import { useState } from "react";
import {
  AlertTriangle, CheckCircle2, Info, ShieldAlert, Briefcase,
  HelpCircle, Loader2, Zap, ArrowRight
} from "lucide-react";

interface AnalysisResult {
  type: "job offer" | "scam risk" | "informational" | "promotional" | "unknown";
  riskLevel: "low" | "medium" | "high";
  observations: string[];
  summary: string;
  action: string;
}

const typeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  "job offer":     { label: "Job Offer",      icon: Briefcase,   color: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800" },
  "scam risk":     { label: "Scam Risk",       icon: ShieldAlert, color: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800" },
  "informational": { label: "Informational",   icon: Info,        color: "text-sky-600 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-950 dark:border-sky-800" },
  "promotional":   { label: "Promotional",     icon: Zap,         color: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800" },
  "unknown":       { label: "Unknown",         icon: HelpCircle,  color: "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700" },
};

const riskConfig: Record<string, { label: string; color: string; dot: string; bar: string }> = {
  low:    { label: "Low",    color: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800", dot: "bg-green-500", bar: "bg-green-500 w-1/3" },
  medium: { label: "Medium", color: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800", dot: "bg-amber-500", bar: "bg-amber-500 w-2/3" },
  high:   { label: "High",   color: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800",           dot: "bg-red-500",   bar: "bg-red-500 w-full" },
};

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setResult(data as AnalysisResult);
    } catch {
      setError("Failed to reach the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const typeInfo = result ? (typeConfig[result.type] ?? typeConfig.unknown) : null;
  const riskInfo = result ? (riskConfig[result.riskLevel] ?? riskConfig.medium) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Clario</span>
          <span className="text-muted-foreground text-sm ml-1 hidden sm:inline">— Clarity from real-world messages</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 flex flex-col gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground" data-testid="heading-title">Clario</h1>
          <p className="text-muted-foreground text-base" data-testid="text-subtitle">
            Paste any message and get instant structured clarity — is it trustworthy, risky, or unclear?
          </p>
        </div>

        <div className="space-y-3">
          <textarea
            data-testid="input-message"
            className="w-full min-h-[160px] rounded-xl border border-input bg-card text-foreground p-4 text-sm resize-y placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            placeholder="Paste a message, job offer, or announcement..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleAnalyze();
              }
            }}
          />
          <button
            data-testid="button-analyze"
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="w-full py-3 px-6 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Message"
            )}
          </button>
          <p className="text-xs text-muted-foreground text-center">Press Cmd+Enter to analyze</p>
        </div>

        {error && (
          <div data-testid="status-error" className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && typeInfo && riskInfo && (
          <div data-testid="section-results" className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">

            {/* Row 1: Message Type + Risk Signal */}
            <div className="grid grid-cols-2 gap-3">
              <div data-testid="card-type" className={`p-4 rounded-xl border ${typeInfo.color}`}>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-2">1. Message Type</p>
                <div className="flex items-center gap-2">
                  <typeInfo.icon className="w-4 h-4 shrink-0" />
                  <p data-testid="text-type" className="font-bold text-sm">{typeInfo.label}</p>
                </div>
              </div>

              <div data-testid="card-risk" className={`p-4 rounded-xl border ${riskInfo.color}`}>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-2">2. Risk Level</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${riskInfo.dot}`} />
                  <p data-testid="text-risk-level" className="font-bold text-sm">{riskInfo.label}</p>
                </div>
                <div className="h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${riskInfo.bar}`} />
                </div>
              </div>
            </div>

            {/* Row 2: Key Observations */}
            {result.observations.length > 0 && (
              <div data-testid="card-observations" className="p-5 rounded-xl border border-border bg-card space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">3. Key Observations</p>
                <ul className="space-y-1.5">
                  {result.observations.map((item, idx) => (
                    <li key={idx} data-testid={`text-observation-${idx}`} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-primary mt-0.5 shrink-0">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Row 3: Simplified Summary */}
            <div data-testid="card-summary" className="p-5 rounded-xl border border-border bg-card space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">4. Simplified Summary</p>
              <p data-testid="text-summary" className="text-sm text-foreground leading-relaxed">{result.summary}</p>
            </div>

            {/* Row 4: Action */}
            <div data-testid="card-action" className="p-5 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary/60">5. Recommended Action</p>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                <p data-testid="text-action" className="text-sm text-foreground leading-relaxed">{result.action}</p>
              </div>
            </div>

          </div>
        )}
      </main>

      <footer className="border-t border-border py-5">
        <p className="text-center text-xs text-muted-foreground">
          Clario uses AI to analyze messages. Always use your own judgment.
        </p>
      </footer>
    </div>
  );
}
