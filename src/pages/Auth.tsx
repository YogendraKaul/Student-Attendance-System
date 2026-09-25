
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth";
import { isDemoMode } from "@/integrations/supabase/client";
import { DEMO_CREDENTIALS, resetDemoDb } from "@/integrations/supabase/demoData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserCheck } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'principal' | 'teacher' | 'student'>('student');
  const [signupComplete, setSignupComplete] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && profile && !loading) {
      const redirectPath = `/dashboard/${profile.role}`;
      toast.success(`Logged in as ${profile.first_name} (${profile.role})`);
      navigate(redirectPath);
    }
  }, [user, profile, loading, navigate]);

  // Show loading state while checking auth
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast.error("Login failed: " + error.message);
      }
    } catch (error: any) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        role,
      });
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please log in instead.");
        } else {
          toast.error("Registration failed: " + error.message);
        }
      } else {
        setSignupComplete(true);
        toast.success("Registration successful! You can now log in.");
      }
    } catch (error: any) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(demoEmail, demoPassword);
      if (error) {
        toast.error("Demo login failed: " + error.message);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDemo = () => {
    resetDemoDb();
    toast.success("Demo data has been reset");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
            <UserCheck className="h-8 w-8" />
            College Attendance System
          </h1>
          <p className="text-gray-500 mt-2">Sign in or create an account</p>
        </div>

        <Card>
          <Tabs defaultValue={signupComplete ? "login" : "login"}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <TabsContent value="login">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              {signupComplete ? (
                <CardContent className="space-y-4 text-center py-6">
                  <div className="rounded-full bg-green-100 p-3 w-16 h-16 mx-auto flex items-center justify-center">
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Registration Complete!</h3>
                  <p className="text-gray-500">Your account has been created successfully.</p>
                  <Button 
                    onClick={() => {
                      document.querySelector('[data-value="login"]')?.dispatchEvent(
                        new MouseEvent('click', { bubbles: true })
                      );
                    }}
                    className="w-full mt-2"
                  >
                    Go to Login
                  </Button>
                </CardContent>
              ) : (
                <form onSubmit={handleSignUp}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={role} onValueChange={(value: any) => setRole(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="principal">Principal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </CardFooter>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <CardFooter className="flex justify-center pt-0">
            <CardDescription className="text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </CardDescription>
          </CardFooter>
        </Card>

        {isDemoMode && (
          <Card className="mt-4 border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Try the live demo</CardTitle>
              <CardDescription>
                No account needed — explore the app as any role. Changes are stored
                in your browser only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {DEMO_CREDENTIALS.map((cred) => (
                <Button
                  key={cred.role}
                  variant="outline"
                  className="w-full bg-white"
                  disabled={isLoading}
                  onClick={() => handleDemoLogin(cred.email, cred.password)}
                >
                  {isLoading ? "Logging in..." : `Continue as ${cred.label}`}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-gray-500"
                onClick={handleResetDemo}
              >
                Reset demo data
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Auth;