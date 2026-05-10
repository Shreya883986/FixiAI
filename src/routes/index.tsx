import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useRef, useState, useEffect } from "react";
import { MarketingShell } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  ImageIcon,
  Wand2,
  Download,
  UploadCloud,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { validateImageFile } from "@/lib/storage";
import { removeBackground } from "@/server/remove-background";
import { createRazorpayOrder } from "@/server/razorpay";
import logoSrc from "@/assets/fixi-logo.png";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Trash2 } from "lucide-react";

interface HistoryItem {
  id: string;
  original: string;
  result: string;
  timestamp: number;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fixi AI — Remove Image Backgrounds Instantly with AI" },
      {
        name: "description",
        content:
          "Pixel-perfect AI background removal in under 5 seconds. Free to start. JPG, PNG, WEBP up to 10 MB.",
      },
      { property: "og:title", content: "Fixi AI — Remove Backgrounds Instantly" },
      {
        property: "og:description",
        content: "AI background remover. One click. Pixel-perfect cutouts.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("snapcut_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = useCallback(
    (original: string, result: string) => {
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        original,
        result,
        timestamp: Date.now(),
      };
      const updatedHistory = [newItem, ...history].slice(0, 50); // Keep last 50
      setHistory(updatedHistory);
      localStorage.setItem("snapcut_history", JSON.stringify(updatedHistory));
    },
    [history],
  );

  const removeFromHistory = useCallback(
    (id: string) => {
      const updatedHistory = history.filter((item) => item.id !== id);
      setHistory(updatedHistory);
      localStorage.setItem("snapcut_history", JSON.stringify(updatedHistory));
    },
    [history],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem("snapcut_history");
  }, []);

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
    async (planName: string, amount: number, currency: string) => {
      setIsCheckoutLoading(true);

      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Unable to load Razorpay checkout. Try again later.");
        }

        const orderData = {
          amount,
          currency,
          receipt: `fixi-${planName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          notes: {
            plan: planName,
            business_name: "Fixi AI",
          },
        };

        const orderResponse = await createRazorpayOrder({ data: orderData });

        const Razorpay = (window as any).Razorpay;
        if (!Razorpay) {
          throw new Error("Razorpay checkout is not available.");
        }

        const checkout = new Razorpay({
          key: orderResponse.keyId,
          amount: orderResponse.amount,
          currency: orderResponse.currency,
          order_id: orderResponse.orderId,
          name: "Fixi AI",
          description: `${planName} purchase`,
          theme: { color: "#48B5FF" },
          notes: {
            plan: planName,
            website: "https://fixi.ai",
          },
          handler: (response: any) => {
            toast.success("Payment completed successfully.");
            setIsCheckoutLoading(false);
            setIsPricingOpen(false);
          },
          modal: {
            ondismiss: () => {
              setIsCheckoutLoading(false);
            },
          },
        });

        checkout.open();
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.");
        setIsCheckoutLoading(false);
      }
    },
    [loadRazorpayScript],
  );

  const handleStartFree = useCallback(() => {
    navigate({ to: "/register" });
  }, [navigate]);

  const handleUpgradePro = useCallback(() => {
    handleCheckout("Pro", 49900, "INR");
  }, [handleCheckout]);

  const handleBuyPack = useCallback(() => {
    handleCheckout("Pack", 99900, "INR");
  }, [handleCheckout]);

  const handleFile = useCallback(
    async (file: File) => {
      const error = validateImageFile(file);
      if (error) {
        toast.error(error);
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setOriginalImage(base64);
        setIsProcessing(true);
        setResultImage(null);

        try {
          const result = await removeBackground({ data: { imageBase64: base64 } });
          if (result && "resultDataUrl" in result && result.resultDataUrl) {
            const resultUrl = result.resultDataUrl;
            setResultImage(resultUrl);
            saveToHistory(base64, resultUrl);
            toast.success("Background removed!");
          } else {
            throw new Error("Failed to process image");
          }
        } catch (err) {
          console.error(err);
          toast.error(err instanceof Error ? err.message : "Processing failed. Please try again.");
          setOriginalImage(null);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => toast.error("Could not read file");
      reader.readAsDataURL(file);
    },
    [saveToHistory],
  );

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 bg-gradient-radial blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-20 pb-24 sm:px-6 lg:px-8 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center">
              <img
                src={logoSrc}
                alt=""
                aria-hidden="true"
                className="h-24 w-24 animate-float drop-shadow-[0_0_40px_rgba(14,165,255,0.5)]"
              />
            </div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by Gemini Vision AI
            </div>

            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Remove backgrounds.
              <br />
              <span className="text-gradient">In a snap.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              AI-powered background removal that actually works. Drop an image, get a pixel-perfect
              cutout in seconds. No skill required.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4">
              <Tabs defaultValue="upload" className="w-full max-w-xl">
                <TabsList className="mb-4 grid w-full grid-cols-2">
                  <TabsTrigger value="upload" className="gap-2">
                    <UploadCloud className="h-4 w-4" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-2">
                    <History className="h-4 w-4" />
                    History ({history.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload">
                  <div className="flex flex-col items-center gap-4">
                    <HeroUpload onFile={handleFile} isProcessing={isProcessing} />
                  </div>
                </TabsContent>
                <TabsContent value="history">
                  <div className="glass max-h-[400px] overflow-y-auto rounded-2xl p-4 text-left">
                    {history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <History className="mb-2 h-10 w-10 opacity-20" />
                        <p>No background removals yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium">Recent Activity</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearHistory}
                            className="h-8 text-xs text-destructive hover:bg-destructive/10"
                          >
                            Clear all
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {history.map((item) => (
                            <div
                              key={item.id}
                              className="group relative flex items-center gap-4 rounded-xl border border-border/40 bg-background/40 p-3 transition-colors hover:bg-background/60"
                            >
                              <div className="flex shrink-0 gap-2">
                                <div className="h-16 w-16 overflow-hidden rounded-lg bg-card/40 ring-1 ring-border/50">
                                  <img
                                    src={item.original}
                                    alt="Original"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="h-16 w-16 overflow-hidden rounded-lg checkerboard ring-1 ring-border/50">
                                  <img
                                    src={item.result}
                                    alt="Result"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-1 flex-col justify-center overflow-hidden">
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(item.timestamp).toLocaleString()}
                                </p>
                                <div className="mt-2 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-[10px]"
                                    onClick={() => {
                                      setOriginalImage(item.original);
                                      setResultImage(item.result);
                                      const target = document.querySelector(".glass");
                                      if (!target) return;
                                      const top =
                                        target.getBoundingClientRect().top + window.scrollY - 100;
                                      window.scrollTo({ top, behavior: "smooth" });
                                    }}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-[10px]"
                                    onClick={() => {
                                      const link = document.createElement("a");
                                      link.href = item.result;
                                      link.download = `cutout-${item.id.slice(0, 5)}.png`;
                                      link.click();
                                    }}
                                  >
                                    Download
                                  </Button>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                                onClick={() => removeFromHistory(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <Button asChild variant="glow" size="lg">
                <Link to="/pricing">See pricing</Link>
              </Button>
              <p className="text-xs text-muted-foreground">No signup required • Try 1 image free</p>
            </div>
          </div>

          {/* Visual demo card */}
          <div className="mx-auto mt-20 max-w-4xl">
            <div className="glass relative rounded-2xl p-2 shadow-card-glow overflow-hidden">
              {(originalImage || isProcessing) && (
                <button
                  onClick={() => {
                    setOriginalImage(null);
                    setResultImage(null);
                    setIsProcessing(false);
                  }}
                  className="absolute right-4 top-4 z-20 rounded-full bg-background/80 p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground backdrop-blur-sm"
                >
                  <X className="h-5 w-5" />
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-card">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-cyan-500/10 to-accent/20" />
                  <div className="absolute left-3 top-3 z-10 rounded-md bg-background/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                    Original
                  </div>
                  <div className="flex h-full w-full items-center justify-center">
                    {originalImage ? (
                      <img
                        src={originalImage}
                        alt="Original"
                        className="h-full w-full object-contain animate-in fade-in duration-500"
                      />
                    ) : (
                      <ImageIcon className="h-20 w-20 text-muted-foreground/40" />
                    )}
                  </div>
                </div>
                <div className="relative aspect-square overflow-hidden rounded-xl checkerboard">
                  <div className="absolute left-3 top-3 z-10 rounded-md bg-background/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                    Cutout
                  </div>
                  <div className="flex h-full w-full items-center justify-center">
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-[10px] font-medium animate-pulse text-primary uppercase tracking-tighter">
                          Removing...
                        </p>
                      </div>
                    ) : resultImage ? (
                      <>
                        <img
                          src={resultImage}
                          alt="Result"
                          className="h-full w-full object-contain animate-in fade-in zoom-in duration-500"
                        />
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 px-3 text-[11px] shadow-glow"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = resultImage;
                              link.download = "cutout.png";
                              link.click();
                            }}
                          >
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            Download
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Wand2 className="h-20 w-20 text-primary drop-shadow-[0_0_20px_rgba(14,165,255,0.6)]" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Built for <span className="text-gradient">speed.</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to ship cleaner visuals, faster.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Under 5 seconds"
              desc="Upload, process, download. The whole flow in less time than your coffee order."
            />
            <FeatureCard
              icon={<Wand2 className="h-6 w-6" />}
              title="AI precision"
              desc="Edges that handle hair, fur, glass, and translucent details — not just hard outlines."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Auto-deleted in 24h"
              desc="Your images aren't training data. We delete originals and results after 24 hours."
            />
            <FeatureCard
              icon={<ImageIcon className="h-6 w-6" />}
              title="Up to 10 MB"
              desc="JPG, PNG, WEBP. Up to 5000×5000 resolution. Transparent PNG output every time."
            />
            <FeatureCard
              icon={<Download className="h-6 w-6" />}
              title="Instant download"
              desc="Direct download or copy URL. Use in Figma, Photoshop, your CMS — wherever."
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="API access"
              desc="Drop Fixi into your workflow. REST API with simple per-call billing. (Coming soon)"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="glass relative overflow-hidden rounded-3xl p-12 text-center shadow-card-glow">
            <div className="absolute inset-0 -z-10 bg-gradient-brand-soft" />
            <h2 className="text-3xl font-bold sm:text-4xl">
              Stop tracing. Start <span className="text-gradient">snapping</span>.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Free for 5 images per day. Pro is unlimited and priced in INR.
            </p>
            <div className="mt-8">
              <Button variant="hero" size="xl" onClick={() => setIsPricingOpen(true)}>
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={isPricingOpen} onOpenChange={setIsPricingOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Choose your plan</DialogTitle>
            <DialogDescription>
              Select a plan to get started with background removal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
              <h3 className="text-lg font-semibold">Free</h3>
              <p className="mt-2 text-3xl font-bold">₹0</p>
              <p className="mt-1 text-sm text-muted-foreground">Forever</p>
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                onClick={handleStartFree}
              >
                Start free
              </Button>
            </div>
            <div className="rounded-2xl border border-primary/50 bg-card/60 p-5 shadow-glow-sm">
              <h3 className="text-lg font-semibold">Pro</h3>
              <p className="mt-2 text-3xl font-bold">₹499</p>
              <p className="mt-1 text-sm text-muted-foreground">Per month</p>
              <Button 
                variant="hero" 
                className="mt-4 w-full"
                onClick={handleUpgradePro}
                disabled={isCheckoutLoading}
              >
                {isCheckoutLoading ? "Processing..." : "Upgrade to Pro"}
              </Button>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
              <h3 className="text-lg font-semibold">Pack</h3>
              <p className="mt-2 text-3xl font-bold">₹999</p>
              <p className="mt-1 text-sm text-muted-foreground">Per month</p>
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                onClick={handleBuyPack}
                disabled={isCheckoutLoading}
              >
                {isCheckoutLoading ? "Processing..." : "Buy a pack"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MarketingShell>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-glow-sm">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand-soft text-primary ring-1 ring-primary/20">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function HeroUpload({
  onFile,
  isProcessing,
}: {
  onFile: (file: File) => void;
  isProcessing: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (isProcessing) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            onFile(file);
            toast.success("Image pasted!");
            break;
          }
        }
      }
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onFile, isProcessing]);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (isProcessing) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFile(files[0]);
        return;
      }

      // Handle dragging an image from another website
      const items = e.dataTransfer.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith("image/")) {
            const file = items[i].getAsFile();
            if (file) {
              onFile(file);
              return;
            }
          }
        }
      }
    },
    [onFile, isProcessing],
  );

  const onDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isProcessing) setIsDragging(true);
    },
    [isProcessing],
  );

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !isProcessing && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!isProcessing && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
      }}
      className={cn(
        "glass group relative w-full max-w-xl cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center shadow-card-glow transition-all",
        isDragging
          ? "border-primary bg-primary/10 shadow-glow scale-[1.02]"
          : "border-primary/40 hover:border-primary hover:shadow-glow-sm",
        isProcessing && "opacity-50 cursor-not-allowed",
      )}
      aria-label="Upload an image to remove its background"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-brand-soft text-primary ring-1 ring-primary/30 transition-transform group-hover:scale-110">
          {isProcessing ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <UploadCloud className="h-7 w-7" />
          )}
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">
            {isProcessing ? "Processing..." : "Drop an image to remove its background"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            or{" "}
            <span className="text-primary underline-offset-4 group-hover:underline">
              click to browse
            </span>{" "}
            · <span className="hidden sm:inline">paste (Ctrl+V) · </span>JPG, PNG, WEBP · up to 10
            MB
          </p>
        </div>
      </div>
    </div>
  );
}
