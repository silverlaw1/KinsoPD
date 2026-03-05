"use client";

import { useState } from "react";

const COURTHOUSES = [
  { id: "brampton-scj", name: "Brampton SCJ (Central West Region)" },
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setAnswer("");
    setSources([]);
    setError("");

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
    } catch {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-navy text-white py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold">
            Ontario Family Court — Procedural Reference Tool
          </h1>
          <p className="mt-1 text-sm opacity-90">
            Answers sourced exclusively from official Ontario Superior Court of
            Justice Practice Directions and the Family Law Rules, O. Reg. 114/99
          </p>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="courthouse"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                Courthouse
              </label>
              <select
                id="courthouse"
                value={courthouse}
                onChange={(e) => setCourthouse(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-navy"
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
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                Your Question
              </label>
              <textarea
                id="question"
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What is the page limit for a case conference brief?"
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-navy resize-y"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuestion(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-colors"
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
            <div className="mt-6 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-navy mr-2 align-middle" />
              <span>
                Searching practice directions and Family Law Rules...
              </span>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          {answer && (
            <div className="mt-6 space-y-4">
              <div className="border-l-4 border-navy bg-white rounded-r-md p-5 shadow-sm">
                <MarkdownContent content={answer} />
              </div>

              {sources.length > 0 && (
                <div className="bg-gray-100 rounded-md p-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    Sources consulted
                  </h3>
                  <ul className="text-sm text-gray-500 space-y-1">
                    {sources.map((s) => (
                      <li key={s}>&bull; {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 py-4 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-gray-400 leading-relaxed">
            This tool provides information from official court practice
            directions and the Family Law Rules for reference purposes only. It
            does not constitute legal advice. Always verify current requirements
            with the court and consult a lawyer for advice about your specific
            situation. Practice directions and rules may be amended &mdash; check{" "}
            <a
              href="https://www.ontariocourts.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:underline"
            >
              ontariocourts.ca
            </a>{" "}
            and{" "}
            <a
              href="https://www.ontario.ca/laws"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:underline"
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
  // Escape HTML first to prevent XSS, then apply markdown formatting
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const rendered = escaped
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Links - open in new tab
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-link hover:underline">$1</a>'
    )
    // Paragraphs
    .split("\n\n")
    .map((p) => p.trim())
    .filter((p) => p)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return (
    <div
      className="prose prose-sm max-w-none [&_p]:mb-3 [&_p]:leading-relaxed [&_strong]:font-semibold [&_a]:text-link"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
