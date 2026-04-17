import { useState } from "react";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, Briefcase, HelpCircle, Loader2, Zap } from "lucide-react";

interface AnalysisResult {
  type: "job offer" | "scam risk" | "informational" | "promotional" | "unknown";
  riskLevel: "low" | "medium" | "high";
  missingInfo: string[];
  summary: string;
  recommendation: string;
}

const typeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  "job offer": { label: "Job Offer", icon: Briefcase, color: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800" },
  "scam risk": { label: "Scam Risk", icon: ShieldAlert, color: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800" },
  "informational": { label: "Informational", icon: Info, color: "text-sky-600 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-950 dark:border-sky-800" },
  "promotional": { label: "Promotional", icon: Zap, color: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800" },
  "unknown": { label: "Unknown", icon: HelpCircle, color: "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700" },
};

const riskConfig: Record<string, { label: string; color: string; dot: string }> = {
  low: { label: "Low Risk", color: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800", dot: "bg-green-500" },
  medium: { label: "Medium Risk", color: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800", dot: "bg-amber-500" },
  high: { label: "High Risk", color: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800", dot: "bg-red-500" },
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
          <p className="text-xs text-muted-foreground text-center">
            Press Cmd+Enter to analyze
          </p>
        </div>

        {error && (
          <div data-testid="status-error" className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && typeInfo && riskInfo && (
          <div data-testid="section-results" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-2 gap-3">
              <div data-testid="card-type" className={`flex items-center gap-3 p-4 rounded-xl border ${typeInfo.color}`}>
                <typeInfo.icon className="w-5 h-5 shrink-0" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide opacity-70">Type</p>
                  <p data-testid="text-type" className="font-semibold text-sm">{typeInfo.label}</p>
                </div>
              </div>
              <div data-testid="card-risk" className={`flex items-center gap-3 p-4 rounded-xl border ${riskInfo.color}`}>
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${riskInfo.dot}`} />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide opacity-70">Risk Level</p>
                  <p data-testid="text-risk-level" className="font-semibold text-sm">{riskInfo.label}</p>
                </div>
              </div>
            </div>

            <div data-testid="card-summary" className="p-5 rounded-xl border border-border bg-card space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</h3>
              <p data-testid="text-summary" className="text-sm text-foreground leading-relaxed">{result.summary}</p>
            </div>

            {result.missingInfo.length > 0 && (
              <div data-testid="card-missing-info" className="p-5 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Missing Information</h3>
                <ul className="space-y-1.5">
                  {result.missingInfo.map((item, idx) => (
                    <li key={idx} data-testid={`text-missing-info-${idx}`} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                      <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div data-testid="card-recommendation" className="p-5 rounded-xl border border-primary/20 bg-primary/5 space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-primary/70">Recommendation</h3>
              <p data-testid="text-recommendation" className="text-sm text-foreground leading-relaxed font-medium">{result.recommendation}</p>
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
