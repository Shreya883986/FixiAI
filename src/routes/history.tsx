import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { MarketingShell } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { Download, History, Trash2 } from "lucide-react";

interface HistoryItem {
  id: string;
  original: string;
  result: string;
  timestamp: number;
}

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Fixi AI" },
      {
        name: "description",
        content: "View and download your previously processed background removals.",
      },
      { property: "og:title", content: "Fixi AI History" },
      {
        property: "og:description",
        content: "Your previous background removals, stored locally in your browser.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("snapcut_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    const updatedHistory = history.filter((item) => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem("snapcut_history", JSON.stringify(updatedHistory));
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem("snapcut_history");
  }, []);

  return (
    <MarketingShell>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <History className="h-3.5 w-3.5" />
            Stored locally in your browser
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Your <span className="text-gradient">History</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            View, download, and manage your previous background removals.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="glow">
              <Link to="/">Upload new image</Link>
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              onClick={clearHistory}
              disabled={history.length === 0}
            >
              Clear all
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          {history.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center shadow-card-glow">
              <History className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No background removals yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="glass group flex items-center justify-between gap-4 rounded-2xl p-4 shadow-card-glow"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="flex shrink-0 gap-2">
                      <div className="h-20 w-20 overflow-hidden rounded-xl bg-card/40 ring-1 ring-border/50">
                        <img src={item.original} alt="Original" className="h-full w-full object-cover" />
                      </div>
                      <div className="h-20 w-20 overflow-hidden rounded-xl checkerboard ring-1 ring-border/50">
                        <img src={item.result} alt="Result" className="h-full w-full object-cover" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Background removed</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 px-3 text-xs"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = item.result;
                        link.download = `cutout-${item.id.slice(0, 8)}.png`;
                        link.click();
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeFromHistory(item.id)}
                      aria-label="Remove from history"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </MarketingShell>
  );
}

