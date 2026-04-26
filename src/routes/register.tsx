import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Fixi AI" },
      {
        name: "description",
        content: "Create your free Fixi AI account. 5 images per day, no card required.",
      },
    ],
  }),
  component: RegisterPage,
});

const schema = z.object({
  displayName: z.string().trim().min(1, "Required").max(60),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(100),
});

function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/app" });
  }, [user, navigate]);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { display_name: values.displayName },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — you're in!");
    navigate({ to: "/app" });
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) toast.error(error.message);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center">
          <LogoMark size={40} />
        </Link>

        <div className="glass rounded-2xl p-8 shadow-card-glow">
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            5 free cutouts per day. No credit card.
          </p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="displayName">Name</Label>
              <Input id="displayName" {...form.register("displayName")} className="mt-1.5" />
              {form.formState.errors.displayName && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.displayName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...form.register("email")}
                className="mt-1.5"
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...form.register("password")}
                className="mt-1.5"
              />
              {form.formState.errors.password && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            OR
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="glow" size="lg" className="w-full" onClick={signInWithGoogle}>
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
