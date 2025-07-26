'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BusIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width="24px"
        height="24px"
        {...props}
      >
        <path
          fill="#FFC107"
          d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
        />
        <path
          fill="#FF3D00"
          d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.655-3.417-11.27-8.161l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
        />
        <path
          fill="#1976D2"
          d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.902,35.696,44,30.41,44,24C44,22.659,43.862,21.35,43.611,20.083z"
        />
      </svg>
    );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle, loginWithEmail, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push('/bus-selection');
    }
  }, [user, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      router.push('/bus-selection');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
      });
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push('/bus-selection');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Please try again.",
      });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full relative">
        <div className="absolute top-4 right-4">
            <ThemeToggle />
        </div>
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <BusIcon className="h-10 w-10 text-primary" />
            </div>
          <CardTitle className="text-2xl font-headline">NaviLoop Tracker</CardTitle>
          <CardDescription>
            Sign in to track your bus in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleEmailLogin} className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                        id="email" 
                        type="email" 
                        placeholder="m@example.com" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                        id="password" 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                </Button>
            </form>
            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
            </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              'Signing in...'
            ) : (
                <>
                    <GoogleIcon className="mr-2 h-5 w-5" />
                    Sign in with Google
                </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
