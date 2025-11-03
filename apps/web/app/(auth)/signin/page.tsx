"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@repo/auth";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const router = useRouter(); 

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {

      if (!email || !password) {
        setErrorMsg("Please enter both email and password.");
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message || "Sign in failed. Please check your credentials.");
        return;
      }
      
      console.log("Sign-in successful", data);
      setSuccessMsg("Signed in successfully!");
      router.push("/");
      e.currentTarget?.reset();

    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred during sign-in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
  }

  return (
    <div className="flex flex-col items-center p-8 min-h-screen bg-gray-50 font-sans">
      <Card className="w-full max-w-sm shadow-xl rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Sign In to your account
          </CardTitle>
          <CardDescription className="text-gray-500">
            Enter your email and password to login
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Email Input */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                name="email" 
                placeholder="you@example.com"
                required
                className="rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Password Input */}
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password" className="font-medium text-gray-700">Password</Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-blue-600 font-medium"
                >
                  Forgot password?
                </a>
              </div>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                className="rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Messages */}
            {errorMsg && (
              <p className="text-red-600 text-sm text-center font-medium p-2 bg-red-100 rounded-lg border border-red-300 transition-opacity duration-300">
                {errorMsg}
              </p>
            )}
            {successMsg && (
              <p className="text-green-700 text-sm text-center font-medium p-2 bg-green-100 rounded-lg border border-green-300 transition-opacity duration-300">
                {successMsg}
              </p>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200" 
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-4 pt-0">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 font-medium">
                Or continue with
              </span>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.9 12.2c0-.7-.1-1.4-.2-2.1H12v3.9h5.4c-.2 1.3-.8 2.5-1.7 3.4v2.5h3.2c1.9-1.8 3-4.5 3-7.7z"/><path fill="#34A853" d="M12 22c3.3 0 6.1-1.1 8.2-3.1l-3.2-2.5c-.9.6-2.1 1-3.7 1-2.8 0-5.2-1.9-6.1-4.4H2.7v2.6C4.8 20.3 8.2 22 12 22z"/><path fill="#FBBC04" d="M5.9 14.8c-.3-.9-.4-1.9-.4-2.8s.1-1.9.4-2.8V6.6H2.7C2 8.1 1.7 10 1.7 12s.3 3.9 1 5.4l3.2-2.6z"/><path fill="#EA4335" d="M12 5.5c1.8 0 3.3.6 4.6 1.8l2.8-2.8C18.1 2.5 15.2 1 12 1c-3.8 0-7.2 1.7-9.3 4.4l3.2 2.6c.9-2.5 3.3-4.2 6.1-4.2z"/></svg>
            Sign In with Google
          </Button>
          <div className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Button variant="link" onClick={() => router.push("/signup")} className="p-0 h-auto text-blue-600 hover:text-blue-700 font-medium">
              Sign Up
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Logout button for utility/testing */}
      <Button 
        variant="secondary"
        className="w-[100px] mt-8 shadow-md bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg" 
        onClick={handleLogout}
      > 
        Logout
      </Button>
    </div>
  )
}
