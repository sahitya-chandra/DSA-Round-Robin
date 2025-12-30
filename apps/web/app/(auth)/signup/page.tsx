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
import { formSchema } from "@repo/types";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { User, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { authClient } from "@/lib/auth-client";

export default function Page() {
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
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const parsed = formSchema.safeParse({ name, email, password });
      if (!parsed.success) {
				setErrorMsg(parsed.error?.message || "Please enter valid details.")
        return;
      }

      const { data, error } = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message || "Something went wrong.");
        return;
      }
			console.log("data", data)
			router.push("/");
      setSuccessMsg("Account created successfully!");
      e.currentTarget?.reset();
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden minecraft-texture">
      {/* Background Effects */}
      <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,oklch(0.3_0.01_0/0.3)_2px,transparent_2px),linear-gradient(to_bottom,oklch(0.3_0.01_0/0.3)_2px,transparent_2px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-accent/10 via-primary/10 to-transparent blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-card border-2 border-border backdrop-blur-xl shadow-2xl minecraft-texture">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-card-foreground font-minecraft">
              Create an account
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your details to get started
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-card-foreground">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    name="name" 
                    type="text" 
                    placeholder="John Doe" 
                    required 
                    className="pl-10 bg-input text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    name="email" 
                    placeholder="name@example.com"
                    required
                    className="pl-10 bg-input text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-card-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    required 
                    className="pl-10 bg-input text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
              </div>

              {/* Status Messages */}
              {errorMsg && (
                <div className="p-3 bg-destructive/10 border-2 border-destructive text-destructive text-sm text-center pixel-border-outset">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-primary/10 border-2 border-primary text-primary text-sm text-center pixel-border-outset">
                  {successMsg}
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-primary text-primary-foreground hover:brightness-110 font-minecraft" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Sign Up
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t-2 border-border"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-minecraft">
                  Or continue with
                </span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full"
              type="button"
              onClick={async () => {
                await authClient.signIn.social({
                  provider: "google",
                  callbackURL: "/dashboard",
                });
              }}
            >
               <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M21.9 12.2c0-.7-.1-1.4-.2-2.1H12v3.9h5.4c-.2 1.3-.8 2.5-1.7 3.4v2.5h3.2c1.9-1.8 3-4.5 3-7.7z"/><path fill="currentColor" d="M12 22c3.3 0 6.1-1.1 8.2-3.1l-3.2-2.5c-.9.6-2.1 1-3.7 1-2.8 0-5.2-1.9-6.1-4.4H2.7v2.6C4.8 20.3 8.2 22 12 22z"/><path fill="currentColor" d="M5.9 14.8c-.3-.9-.4-1.9-.4-2.8s.1-1.9.4-2.8V6.6H2.7C2 8.1 1.7 10 1.7 12s.3 3.9 1 5.4l3.2-2.6z"/><path fill="currentColor" d="M12 5.5c1.8 0 3.3.6 4.6 1.8l2.8-2.8C18.1 2.5 15.2 1 12 1c-3.8 0-7.2 1.7-9.3 4.4l3.2 2.6c.9-2.5 3.3-4.2 6.1-4.2z"/></svg>
              Google
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/signin" className="text-primary hover:text-primary/80 font-medium hover:underline">
                Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
