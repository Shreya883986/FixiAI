import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Check,
  Clock,
  CreditCard,
  Download,
  History,
  ImageIcon,
  KeyRound,
  Loader2,
  LogOut,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  UserCircle,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { createRazorpayOrder } from "@/actions/razorpay";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [{ title: "Dashboard - Fixi AI" }, { name: "robots", content: "noindex" }],
  }),
  component: AppPage,
});

type UploadRow = {
  id: string;
  user_id: string;
  original_path: string;
  result_path: string | null;
  original_filename: string | null;
  status: "pending" | "processing" | "done" | "failed";
  error_message: string | null;
  created_at: string;
  expires_at: string;
  completed_at: string | null;
  processing_time_ms: number | null;
  download_count: number;
};

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  plan: string;
  credits_remaining: number;
  credits_reset_at: string;
};

function AppPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      const isSigningOut = sessionStorage.getItem("fixi_signing_out") === "1";
      if (isSigningOut) {
        sessionStorage.removeItem("fixi_signing_out");
        navigate({ to: "/", replace: true });
        return;
      }

      navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <Workspace userId={user.id} userEmail={user.email ?? ""} />;
}

function Workspace({ userId, userEmail }: { userId: string; userEmail: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { signOut } = useAuth();
  const [plansOpen, setPlansOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error) throw error;
      return data as Profile;
    },
  });

  const { data: uploads = [] } = useQuery({
    queryKey: ["uploads", userId],
    queryFn: async (): Promise<UploadRow[]> => {
      const { data, error } = await supabase
        .from("uploads")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as UploadRow[];
    },
    refetchInterval: (q) => {
      const list = q.state.data as UploadRow[] | undefined;
      return list?.some((u) => u.status === "pending" || u.status === "processing") ? 1500 : false;
    },
  });

  const refreshAll = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["uploads", userId] });
    qc.invalidateQueries({ queryKey: ["profile", userId] });
  }, [qc, userId]);

  const userName = profile?.display_name || userEmail.split("@")[0] || "User";
  const processedCount = uploads.filter((u) => u.status === "done").length;
  const thisMonthCount = uploads.filter((u) => {
    const createdAt = new Date(u.created_at);
    const now = new Date();
    return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
  }).length;
  const creditsValue = profile?.credits_remaining?.toString() ?? "—";
  const finishedUploads = uploads.filter((u) => typeof u.processing_time_ms === "number");
  const averageTimeSeconds =
    finishedUploads.length > 0
      ? (
          finishedUploads.reduce((sum, upload) => sum + (upload.processing_time_ms ?? 0), 0) /
          finishedUploads.length /
          1000
        ).toFixed(1)
      : "0.0";

  const goHomeUpload = useCallback(() => navigate({ to: "/" }), [navigate]);
  const scrollToHistory = useCallback(() => {
    document.getElementById("recent-images")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleSignOut = useCallback(async () => {
    sessionStorage.setItem("fixi_signing_out", "1");
    await signOut();
    navigate({ to: "/", replace: true });
  }, [navigate, signOut]);

  const loadRazorpayScript = useCallback(async () => {
    if (typeof window === "undefined") return false;
    if ((window as any).Razorpay) return true;

    return new Promise<boolean>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Unable to load Razorpay checkout script."));
      document.body.appendChild(script);
    });
  }, []);

  const handleCheckout = useCallback(
    async (planName: "Pro" | "Pack", amount: number) => {
      setCheckoutLoading(planName);
      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) throw new Error("Unable to load Razorpay checkout. Try again later.");

        const orderResponse = await createRazorpayOrder({
          data: {
            amount,
            currency: "INR",
            receipt: `fixi-${planName.toLowerCase()}-${Date.now()}`,
            notes: { plan: planName, business_name: "Fixi AI" },
          },
        });

        const Razorpay = (window as any).Razorpay;
        if (!Razorpay) throw new Error("Razorpay checkout is not available.");

        const checkout = new Razorpay({
          key: orderResponse.keyId,
          amount: orderResponse.amount,
          currency: orderResponse.currency,
          order_id: orderResponse.orderId,
          name: "Fixi AI",
          description: `${planName} plan`,
          prefill: { email: userEmail },
          theme: { color: "#48B5FF" },
          notes: { plan: planName, website: "https://fixi.ai" },
          handler: async () => {
            if (planName === "Pro") {
              await supabase
                .from("profiles")
                .update({
                  plan: "pro",
                  credits_remaining: 10,
                  credits_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .eq("id", userId);
            }
            toast.success("Payment completed successfully.");
            setPlansOpen(false);
            setCheckoutLoading(null);
            qc.invalidateQueries({ queryKey: ["profile", userId] });
          },
          modal: {
            confirm_close: true,
            ondismiss: () => setCheckoutLoading(null),
          },
          retry: { enabled: true, max_count: 3 },
        });

        checkout.open();
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.");
        setCheckoutLoading(null);
      }
    },
    [loadRazorpayScript, qc, userEmail, userId],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader
        userName={userName}
        userEmail={userEmail}
        plan={profile?.plan ?? "free"}
        onOpenPlans={() => setPlansOpen(true)}
        onUpload={goHomeUpload}
        onHistory={scrollToHistory}
        onSignOut={handleSignOut}
      />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<ImageIcon className="h-5 w-5" />} value={processedCount.toString()} label="Images Processed" />
            <StatCard icon={<Sparkles className="h-5 w-5" />} value={creditsValue} label="Credits Remaining" />
            <StatCard icon={<BarChart3 className="h-5 w-5" />} value={thisMonthCount.toString()} label="This Month" trend="+8%" />
            <StatCard icon={<Clock className="h-5 w-5" />} value={`${averageTimeSeconds}s`} label="Avg. Time" />
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <QuickAction
                icon={<Upload className="h-8 w-8" />}
                title="Upload Image"
                description="Remove background from a new image"
                onClick={goHomeUpload}
              />
              <QuickAction
                icon={<History className="h-8 w-8" />}
                title="View History"
                description="Access your recent processed images"
                onClick={scrollToHistory}
              />
            </div>
          </section>

          <section id="recent-images" className="mt-12 scroll-mt-24">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Images</h2>
              {uploads.length > 0 && (
                <p className="text-xs text-muted-foreground">Auto-deleted after 24 hours</p>
              )}
            </div>

            {uploads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-12 text-center">
                <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No images yet. Upload one from the home page to get started.
                </p>
              </div>
            ) : (
              <RecentImagesTable uploads={uploads} onChanged={refreshAll} />
            )}
          </section>
        </div>
      </main>

      <PlanDialog
        open={plansOpen}
        onOpenChange={setPlansOpen}
        checkoutLoading={checkoutLoading}
        onCheckout={handleCheckout}
      />
    </div>
  );
}

function DashboardHeader({
  userName,
  userEmail,
  plan,
  onOpenPlans,
  onUpload,
  onHistory,
  onSignOut,
}: {
  userName: string;
  userEmail: string;
  plan: string;
  onOpenPlans: () => void;
  onUpload: () => void;
  onHistory: () => void;
  onSignOut: () => void;
}) {
  const initial = (userName || userEmail || "U").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark size={36} />
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={onOpenPlans}>
            <CreditCard className="h-4 w-4" />
            Billing
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={onUpload}>
            <Upload className="h-4 w-4" />
            Upload Image
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={onHistory}>
            <History className="h-4 w-4" />
            History
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link to="/api-docs">
              <KeyRound className="h-4 w-4" />
              API Keys
            </Link>
          </Button>
          <Button variant="hero" size="icon" title="View plans" onClick={onOpenPlans}>
            <Wand2 className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-primary-foreground ring-1 ring-primary/40 transition-shadow hover:shadow-glow-sm">
                {initial}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <span className="block truncate text-sm font-semibold">{userName}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">{userEmail}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Current plan
                </span>
                <Badge variant="secondary" className="capitalize">{plan}</Badge>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function StatCard({
  icon,
  value,
  label,
  trend,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  trend?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
          {icon}
        </div>
        {trend && (
          <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
            {trend}
          </span>
        )}
      </div>
      <p className="mt-5 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-border/60 bg-card/40 p-7 text-left backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-card/60"
    >
      <div className="text-primary">{icon}</div>
      <h3 className="mt-6 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </button>
  );
}

function PlanDialog({
  open,
  onOpenChange,
  checkoutLoading,
  onCheckout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkoutLoading: string | null;
  onCheckout: (planName: "Pro" | "Pack", amount: number) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choose a plan</DialogTitle>
          <DialogDescription>Upgrade your Fixi AI workspace through Razorpay.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-3">
          <PlanBox
            name="Free"
            price="₹0"
            features={["5 images per day", "Standard quality output", "JPG and PNG", "Email support"]}
          />
          <PlanBox
            name="Pro"
            price="₹499 / month"
            features={["10 credits for one month", "HD quality outputs", "PNG, WEBP, JPG", "API access (1000 calls/mo)"]}
            cta={checkoutLoading === "Pro" ? "Processing..." : "Upgrade to Pro"}
            onClick={() => onCheckout("Pro", 49900)}
            disabled={!!checkoutLoading}
            featured
          />
          <PlanBox
            name="Pack"
            price="₹999 / month"
            features={["Everything in Pro", "Unlimited calls", "Customer support"]}
            cta={checkoutLoading === "Pack" ? "Processing..." : "Buy a pack"}
            onClick={() => onCheckout("Pack", 99900)}
            disabled={!!checkoutLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlanBox({
  name,
  price,
  features,
  cta,
  onClick,
  disabled,
  featured,
}: {
  name: string;
  price: string;
  features: string[];
  cta?: string;
  onClick?: () => void;
  disabled?: boolean;
  featured?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${featured ? "border-primary/50 bg-card/60 shadow-glow-sm" : "border-border/60 bg-card/40"}`}>
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-2 text-3xl font-bold">{price}</p>
      <ul className="mt-4 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {feature}
          </li>
        ))}
      </ul>
      {cta && (
        <Button variant={featured ? "hero" : "outline"} className="mt-5 w-full" onClick={onClick} disabled={disabled}>
          {cta}
        </Button>
      )}
    </div>
  );
}

function RecentImagesTable({
  uploads,
  onChanged,
}: {
  uploads: UploadRow[];
  onChanged: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Image</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Downloads</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((upload) => (
              <RecentImageRow key={upload.id} upload={upload} onChanged={onChanged} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecentImageRow({ upload, onChanged }: { upload: UploadRow; onChanged: () => void }) {
  const originalUrl = useMemo(
    () => supabase.storage.from("snapcut-images").getPublicUrl(upload.original_path).data.publicUrl,
    [upload.original_path],
  );
  const resultUrl = useMemo(
    () =>
      upload.result_path
        ? supabase.storage.from("snapcut-images").getPublicUrl(upload.result_path).data.publicUrl
        : null,
    [upload.result_path],
  );

  async function handleDelete() {
    const paths = [upload.original_path];
    if (upload.result_path) paths.push(upload.result_path);
    await supabase.storage.from("snapcut-images").remove(paths);
    await supabase.from("uploads").delete().eq("id", upload.id);
    onChanged();
    toast.success("Deleted");
  }

  async function handleDownload() {
    if (!resultUrl) return;
    const resp = await fetch(resultUrl);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fixi-${upload.id.slice(0, 8)}.png`;
    a.click();
    URL.revokeObjectURL(url);
    const nextCount = (upload.download_count ?? 0) + 1;
    await supabase.from("uploads").update({ download_count: nextCount }).eq("id", upload.id);
    onChanged();
  }

  async function handleRename() {
    const nextName = window.prompt("Rename file", upload.original_filename ?? "image");
    if (!nextName) return;
    const cleanName = nextName.trim();
    if (!cleanName) return;
    const { error } = await supabase
      .from("uploads")
      .update({ original_filename: cleanName })
      .eq("id", upload.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("File renamed.");
    onChanged();
  }

  const viewUrl = resultUrl ?? originalUrl;
  const isProcessing = upload.status === "pending" || upload.status === "processing";
  const processingSeconds =
    typeof upload.processing_time_ms === "number"
      ? `${(upload.processing_time_ms / 1000).toFixed(1)}s`
      : upload.status === "done"
        ? "—"
        : "Processing";

  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-lg bg-background/50 ring-1 ring-border/60">
            <img src={viewUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{upload.original_filename ?? "image"}</p>
            {upload.error_message && (
              <p className="mt-1 line-clamp-1 text-xs text-destructive">{upload.error_message}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge
          variant="secondary"
          className={
            upload.status === "done"
              ? "border-primary/30 bg-primary/20 text-primary"
              : upload.status === "failed"
                ? "border-destructive/30 bg-destructive/20 text-destructive"
                : ""
          }
        >
          {upload.status}
        </Badge>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{processingSeconds}</td>
      <td className="px-4 py-3 text-muted-foreground">{upload.download_count ?? 0}</td>
      <td className="px-4 py-3 text-muted-foreground">
        {new Date(upload.created_at).toLocaleString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <Button asChild size="sm" variant="outline">
            <a href={viewUrl} target="_blank" rel="noreferrer">
              View
            </a>
          </Button>
          <Button size="sm" variant="outline" onClick={handleRename}>
            Rename
          </Button>
          {upload.status === "done" && resultUrl && (
            <Button size="icon" variant="ghost" onClick={handleDownload} title="Download">
              <Download className="h-4 w-4" />
            </Button>
          )}
          {!isProcessing && (
            <Button size="icon" variant="ghost" onClick={handleDelete} title="Delete" className="hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
