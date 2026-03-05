"use client";

import { useState, useEffect } from "react";

const COURTHOUSES = [
  { id: "brampton-scj", name: "Brampton — Superior Court of Justice (Central West)" },
  { id: "brampton-ocj", name: "Brampton — Ontario Court of Justice" },
];

const EXAMPLE_QUESTIONS = [
  "What is the page limit for a case conference brief?",
  "How do I schedule a motion in Brampton?",
  "When are confirmation forms due?",
  "What is the process for a motion to change?",
  "How do I bring an urgent motion?",
];

export default function Home() {
  const [courthouse, setCourthouse] = useState(COURTHOUSES[0].id);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setAnswer("");
    setSources([]);
    setError("");
    setFollowUp("");
    setHistory([]);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), courthouse }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "An error occurred.");
        return;
      }

      setAnswer(data.answer);
      setSources(data.sourcesConsulted || []);
      setHistory([
        { role: "user", content: question.trim() },
        { role: "assistant", content: data.answer },
      ]);
    } catch {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!followUp.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: followUp.trim(),
          courthouse,
          history,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "An error occurred.");
        return;
      }

      setAnswer(data.answer);
      setSources(data.sourcesConsulted || []);
      setHistory((prev) => [
        ...prev,
        { role: "user", content: followUp.trim() },
        { role: "assistant", content: data.answer },
      ]);
      setFollowUp("");
    } catch {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg dark:bg-dark-bg text-charcoal dark:text-dark-text">
      <header className="bg-navy text-white py-6 px-4">
        <div className="max-w-3xl mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Ontario Family Court — Procedural Reference Tool
            </h1>
            <p className="mt-1 text-sm opacity-90">
              Procedural information from official practice directions and the Family Law Rules
            </p>
          </div>
          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="shrink-0 mt-1 p-2 rounded-md hover:bg-white/10 transition-colors"
          >
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="courthouse"
                className="block text-sm font-medium text-gray-600 dark:text-dark-muted mb-1"
              >
                Courthouse
              </label>
              <select
                id="courthouse"
                value={courthouse}
                onChange={(e) => setCourthouse(e.target.value)}
                className="w-full border border-gray-300 dark:border-dark-border rounded-md px-3 py-2 bg-white dark:bg-dark-surface text-charcoal dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-navy"
              >
                {COURTHOUSES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="question"
                className="block text-sm font-medium text-gray-600 dark:text-dark-muted mb-1"
              >
                Your Question
              </label>
              <textarea
                id="question"
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What is the page limit for a case conference brief?"
                className="w-full border border-gray-300 dark:border-dark-border rounded-md px-3 py-2 bg-white dark:bg-dark-surface text-charcoal dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-navy resize-y"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuestion(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-dark-border text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-surface hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="w-full bg-navy text-white py-2.5 px-4 rounded-md font-medium hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Searching..." : "Search Practice Directions & Rules"}
            </button>
          </form>

          {loading && (
            <div className="mt-6 text-center text-gray-500 dark:text-dark-muted">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-300 dark:border-dark-border border-t-navy mr-2 align-middle" />
              <span>
                Searching practice directions and Family Law Rules...
              </span>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {answer && (
            <div className="mt-6 space-y-4">
              <div className="border-l-4 border-navy bg-white dark:bg-dark-surface rounded-r-md p-5 shadow-sm">
                <MarkdownContent content={answer} />
              </div>

              {sources.length > 0 && (
                <div className="bg-gray-100 dark:bg-dark-surface rounded-md p-4">
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-dark-muted mb-2">
                    Sources consulted
                  </h3>
                  <ul className="text-sm text-gray-500 dark:text-dark-muted space-y-1">
                    {sources.map((s) => (
                      <li key={s}>&bull; {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              <form
                onSubmit={handleFollowUp}
                className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-md p-4 space-y-3"
              >
                <label
                  htmlFor="follow-up"
                  className="block text-sm font-medium text-gray-600 dark:text-dark-muted"
                >
                  Provide additional details or ask a follow-up question
                </label>
                <textarea
                  id="follow-up"
                  rows={2}
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder="e.g., It's a short motion, not a long motion..."
                  className="w-full border border-gray-300 dark:border-dark-border rounded-md px-3 py-2 bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-navy resize-y text-sm"
                />
                <button
                  type="submit"
                  disabled={loading || !followUp.trim()}
                  className="bg-navy text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Searching..." : "Send Follow-up"}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-dark-border py-4 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-gray-400 dark:text-dark-muted leading-relaxed">
            This tool provides information from official court practice
            directions and the Family Law Rules for reference purposes only. It
            does not constitute legal advice. Always verify current requirements
            with the court and consult a lawyer for advice about your specific
            situation. Practice directions and rules may be amended &mdash; check{" "}
            <a
              href="https://www.ontariocourts.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link dark:text-link-dark hover:underline"
            >
              ontariocourts.ca
            </a>{" "}
            and{" "}
            <a
              href="https://www.ontario.ca/laws"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link dark:text-link-dark hover:underline"
            >
              e-Laws
            </a>{" "}
            for the most current versions.
          </p>
        </div>
      </footer>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const rendered = escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    .split("\n\n")
    .map((p) => p.trim())
    .filter((p) => p)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return (
    <div
      className="prose prose-sm max-w-none [&_p]:mb-3 [&_p]:leading-relaxed [&_strong]:font-semibold [&_a]:text-link dark:[&_a]:text-link-dark [&_a:hover]:underline"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
