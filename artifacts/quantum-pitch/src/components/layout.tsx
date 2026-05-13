import { Link, useLocation } from "wouter";
import { Activity, History, Target, Radio } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground dark selection:bg-primary selection:text-primary-foreground">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tighter uppercase font-mono">
            Quantum<span className="text-primary">Pitch</span> AI
          </h1>
        </div>
        <nav className="flex gap-1">
          <Link
            href="/"
            className={`px-4 py-2 text-sm font-medium transition-colors uppercase tracking-wider ${
              location === "/"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Live Dashboard
            </div>
          </Link>
          <Link
            href="/history"
            className={`px-4 py-2 text-sm font-medium transition-colors uppercase tracking-wider ${
              location === "/history"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Session History
            </div>
          </Link>
          <Link
            href="/calibrate"
            className={`px-4 py-2 text-sm font-medium transition-colors uppercase tracking-wider ${
              location === "/calibrate"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              Calibrate
            </div>
          </Link>
        </nav>
      </header>
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
