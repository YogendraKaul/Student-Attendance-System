// Offline mock of the Supabase client used when env vars are missing.
// Implements just the query-builder surface this app uses:
// select/eq/in/order/limit/single, insert, update, delete + auth.

import {
  DemoDb,
  DemoUser,
  clearDemoSession,
  getDemoSession,
  loadDemoDb,
  newDemoId,
  saveDemoDb,
  setDemoSession,
} from "./demoData";

type Row = Record<string, unknown>;
type Filter = { col: string; op: "eq" | "in"; val: unknown };

const TABLES = ["users", "classes", "class_students", "attendance_records"] as const;
type TableName = (typeof TABLES)[number];

const now = () => new Date().toISOString();

function parseColumns(columns: string): string[] | null {
  const cleaned = columns.replace(/\s+/g, " ").trim();
  if (cleaned === "*" || cleaned === "") return null;
  return cleaned
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

function project(row: Row, columns: string): Row {
  const cols = parseColumns(columns);
  if (!cols) return { ...row };
  const out: Row = {};
  for (const c of cols) out[c] = row[c];
  return out;
}

function applyFilters(rows: Row[], filters: Filter[]): Row[] {
  return rows.filter((row) =>
    filters.every((f) => {
      if (f.op === "eq") return row[f.col] === f.val;
      return Array.isArray(f.val) ? (f.val as unknown[]).includes(row[f.col]) : false;
    })
  );
}

class MockQueryBuilder {
  private mode: "select" | "insert" | "update" | "delete" = "select";
  private columns = "*";
  private filters: Filter[] = [];
  private orderings: Array<{ col: string; asc: boolean }> = [];
  private limitN: number | null = null;
  private wantSingle = false;
  private returnSelect = false;
  private payload: unknown = null;

  constructor(private table: TableName) {}

  select(columns = "*") {
    if (this.mode === "insert") {
      this.returnSelect = true;
      if (columns !== "*") this.columns = columns;
    } else {
      this.columns = columns;
    }
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ col, op: "eq", val });
    return this;
  }

  in(col: string, vals: unknown[]) {
    this.filters.push({ col, op: "in", val: vals });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderings.push({ col, asc: opts?.ascending ?? true });
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  single() {
    this.wantSingle = true;
    return this;
  }

  insert(rows: unknown) {
    this.mode = "insert";
    this.payload = rows;
    return this;
  }

  update(patch: Record<string, unknown>) {
    this.mode = "update";
    this.payload = patch;
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  // Thenable so `await supabase.from(...).select(...).eq(...)` works.
  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve()
      .then(() => this.execute())
      .then(onfulfilled, onrejected);
  }

  private rowsOf(db: DemoDb): Row[] {
    return (db[this.table] as unknown as Row[]).map((r) => ({ ...r }));
  }

  private execute(): { data: unknown; error: unknown } {
    const db = loadDemoDb();

    if (this.mode === "insert") {
      const incoming = (Array.isArray(this.payload) ? this.payload : [this.payload]) as Row[];
      const ts = now();
      const inserted: Row[] = incoming.map((row) => {
        const full: Row = { ...row };
        if (full.id == null) full.id = newDemoId(this.table);
        if (full.created_at == null) full.created_at = ts;
        if (this.table !== "class_students" && full.updated_at == null) full.updated_at = ts;
        return full;
      });
      (db[this.table] as Row[]).push(...inserted);
      saveDemoDb(db);
      const data = this.returnSelect
        ? applyFilters(inserted, this.filters).map((r) => project(r, this.columns))
        : inserted;
      return { data, error: null };
    }

    if (this.mode === "update") {
      const patch = { ...(this.payload as Row), updated_at: now() };
      const rows = db[this.table] as unknown as Row[];
      const updated: Row[] = [];
      for (const row of rows) {
        if (applyFilters([row], this.filters).length > 0) {
          Object.assign(row, patch);
          updated.push({ ...row });
        }
      }
      saveDemoDb(db);
      return { data: updated, error: null };
    }

    if (this.mode === "delete") {
      const rows = db[this.table] as unknown as Row[];
      const removed: Row[] = [];
      const kept: Row[] = rows.filter((row) => {
        if (applyFilters([row], this.filters).length > 0) {
          removed.push(row);
          return false;
        }
        return true;
      });
      (db as unknown as Record<string, Row[]>)[this.table] = kept;
      saveDemoDb(db);
      return { data: removed, error: null };
    }

    // select
    let rows = applyFilters(this.rowsOf(db), this.filters);
    for (const o of this.orderings) {
      rows = [...rows].sort((a, b) => {
        const av = a[o.col];
        const bv = b[o.col];
        if (av == null && bv == null) return 0;
        if (av == null) return o.asc ? -1 : 1;
        if (bv == null) return o.asc ? 1 : -1;
        if (av < bv) return o.asc ? -1 : 1;
        if (av > bv) return o.asc ? 1 : -1;
        return 0;
      });
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN);
    if (this.wantSingle) {
      if (rows.length === 0) return { data: null, error: { message: "No rows returned" } };
      return { data: project(rows[0], this.columns), error: null };
    }
    return { data: rows.map((r) => project(r, this.columns)), error: null };
  }
}

function toSessionUser(u: DemoUser) {
  return {
    id: u.id,
    email: u.email,
    user_metadata: { first_name: u.first_name, last_name: u.last_name, role: u.role },
  };
}

function toSession(u: DemoUser) {
  return { access_token: "demo-token", user: toSessionUser(u) };
}

type AuthListener = (event: string, session: unknown) => void;

export function createMockSupabaseClient() {
  const listeners = new Set<AuthListener>();
  const emit = (event: string, session: unknown) => {
    listeners.forEach((cb) => {
      try {
        cb(event, session);
      } catch {
        // ignore listener errors
      }
    });
  };

  return {
    from(table: string) {
      if (!(TABLES as readonly string[]).includes(table)) {
        throw new Error(`Demo DB has no table "${table}"`);
      }
      return new MockQueryBuilder(table as TableName);
    },
    auth: {
      getSession: async () => ({ data: { session: getDemoSession() }, error: null }),
      getUser: async () => {
        const session = getDemoSession();
        if (!session) return { data: { user: null }, error: { message: "No active session" } };
        return { data: { user: session.user }, error: null };
      },
      onAuthStateChange: (cb: AuthListener) => {
        listeners.add(cb);
        return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const db = loadDemoDb();
        const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user || user.password !== password) {
          return { data: { user: null, session: null }, error: { message: "Invalid login credentials" } };
        }
        const session = toSession(user);
        setDemoSession(session);
        emit("SIGNED_IN", session);
        return { data: { user: session.user, session }, error: null };
      },
      signUp: async ({
        email,
        password,
        options,
      }: {
        email: string;
        password: string;
        options?: { data?: { first_name?: string; last_name?: string; role?: string } };
      }) => {
        const db = loadDemoDb();
        if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
          return { data: { user: null, session: null }, error: { message: "User already registered" } };
        }
        const meta = options?.data ?? {};
        const ts = now();
        const user: DemoUser = {
          id: newDemoId("users"),
          email,
          first_name: meta.first_name ?? "Demo",
          last_name: meta.last_name ?? "User",
          role: meta.role ?? "student",
          password,
          created_at: ts,
          updated_at: ts,
        };
        db.users.push(user);
        saveDemoDb(db);
        const session = toSession(user);
        setDemoSession(session);
        emit("SIGNED_IN", session);
        return { data: { user: session.user, session }, error: null };
      },
      signOut: async () => {
        clearDemoSession();
        emit("SIGNED_OUT", null);
        return { error: null };
      },
    },
  };
}
