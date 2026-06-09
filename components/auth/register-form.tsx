"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  role: z.enum(["founder", "investor"]),
});

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") as "founder" | "investor") ?? "founder";
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole },
  });

  const role = watch("role");

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  async function signInWithLinkedIn() {
    await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  async function onSubmit(data: FormData) {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: data.role,
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    if (authData.user) {
      toast.success("Account created! Welcome to StartupMinds.");
      // Sign in immediately after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (signInError) {
        router.push("/login");
      } else {
        const role = data.role.replace("_", "-");
        router.push(`/dashboard/${role}`);
        router.refresh();
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create account</h2>
        <p className="text-muted-foreground mt-2">
          Join the StartupMinds ecosystem
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" className="w-full" onClick={signInWithGoogle}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={signInWithLinkedIn}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#0A66C2">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn
        </Button>
      </div>

      <div className="relative">
        <Separator />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="bg-background px-2 text-xs text-muted-foreground">or register with email</span>
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role selection */}
        <div className="space-y-3">
          <Label>I am a...</Label>
          <RadioGroup
            value={role}
            onValueChange={(v) => setValue("role", v as "founder" | "investor")}
            className="grid grid-cols-2 gap-3"
          >
            {[
              { value: "founder", label: "Founder", desc: "I have a startup" },
              { value: "investor", label: "Investor", desc: "I want to invest" },
            ].map((option) => (
              <div key={option.value}>
                <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                <Label
                  htmlFor={option.value}
                  className={`flex flex-col cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                    role === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="font-semibold">{option.label}</span>
                  <span className="text-muted-foreground text-xs">{option.desc}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" placeholder="Your full name" {...register("full_name")} />
          {errors.full_name && (
            <p className="text-destructive text-sm">{errors.full_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-destructive text-sm">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs text-muted-foreground">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>
        {" "}and{" "}
        <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
      </p>
    </div>
  );
}
