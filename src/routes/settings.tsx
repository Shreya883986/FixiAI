import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings - Fixi AI" }, { name: "robots", content: "noindex" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata ?? {};
    const displayName = (meta.display_name as string | undefined) ?? "";
    const [first = "", ...rest] = displayName.split(" ");
    setFirstName((meta.first_name as string | undefined) ?? first);
    setLastName((meta.last_name as string | undefined) ?? rest.join(" "));
    setEmail(user.email ?? "");
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  async function updateProfile() {
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    if (!/^[A-Z][A-Za-z]{0,29}$/.test(cleanFirst) || !/^[A-Z][A-Za-z]{0,29}$/.test(cleanLast)) {
      toast.error("First and Last Name must start with a capital letter and be 30 characters or less.");
      return;
    }

    setSavingProfile(true);
    try {
      const displayName = `${cleanFirst} ${cleanLast}`;
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: displayName, first_name: cleanFirst, last_name: cleanLast },
      });
      if (authError) throw authError;

      await supabase
        .from("profiles")
        .update({ display_name: displayName, email })
        .eq("id", user.id);

      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function updateAccount() {
    setSavingAccount(true);
    try {
      const payload: { email?: string; password?: string } = {};
      if (email && email !== user.email) payload.email = email;
      if (password) payload.password = password;

      if (!payload.email && !payload.password) {
        toast.message("Nothing to update.");
        return;
      }

      const { error } = await supabase.auth.updateUser(payload);
      if (error) throw error;
      toast.success(payload.email ? "Check your new email to confirm the change." : "Password updated.");
      setPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update account.");
    } finally {
      setSavingAccount(false);
    }
  }

  async function deleteAccountData() {
    const confirmed = window.confirm("Delete your Fixi AI account data and sign out?");
    if (!confirmed) return;

    setDeleting(true);
    try {
      const { data: uploads } = await supabase
        .from("uploads")
        .select("original_path,result_path")
        .eq("user_id", user.id);
      const paths =
        uploads?.flatMap((upload) => [upload.original_path, upload.result_path].filter(Boolean) as string[]) ?? [];
      if (paths.length > 0) await supabase.storage.from("snapcut-images").remove(paths);
      await supabase.from("uploads").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);
      await signOut();
      toast.success("Account data deleted.");
      navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete account data.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile and account access.</p>

        <section className="mt-8 rounded-2xl border border-border/60 bg-card/40 p-6">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={firstName} maxLength={30} onChange={(e) => setFirstName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={lastName} maxLength={30} onChange={(e) => setLastName(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <Button className="mt-5" variant="hero" onClick={updateProfile} disabled={savingProfile}>
            {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
            Save profile
          </Button>
        </section>

        <section className="mt-6 rounded-2xl border border-border/60 bg-card/40 p-6">
          <h2 className="text-lg font-semibold">Account</h2>
          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <Button className="mt-5" variant="hero" onClick={updateAccount} disabled={savingAccount}>
            {savingAccount && <Loader2 className="h-4 w-4 animate-spin" />}
            Update account
          </Button>
        </section>

        <section className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-6">
          <h2 className="text-lg font-semibold text-destructive">Delete account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This deletes your Fixi AI profile, upload records, and stored images, then signs you out.
          </p>
          <Button className="mt-5" variant="destructive" onClick={deleteAccountData} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete account data
          </Button>
        </section>
      </main>
    </div>
  );
}
