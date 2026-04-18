import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Fixi AI" },
      { name: "description", content: "Reset your Fixi AI password." },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center">
          <LogoMark size={40} />
        </Link>

        <div className="glass rounded-2xl p-8 shadow-card-glow">
          {sent ? (
            <>
              <h1 className="text-2xl font-bold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a password reset link to your inbox. The link expires in 1 hour.
              </p>
              <Button asChild variant="glow" size="lg" className="mt-6 w-full">
                <Link to="/login">Back to sign in</Link>
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Reset your password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll email you a secure link to set a new one.
              </p>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
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
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
