import { loadAllData, DataEntry, PDEntry, FLREntry } from "./loadData";
import { CourthouseConfig } from "./courthouses";

const SYNONYM_MAP: Record<string, string[]> = {
  custody: ["decision-making responsibility", "parenting time"],
  access: ["parenting time", "contact"],
  support: ["child support", "spousal support"],
  motion: ["motions"],
  conference: ["case conference", "settlement conference"],
  dro: ["dispute resolution officer"],
  "page limit": ["page limits", "restrictions on filing", "page restrictions"],
  confirmation: ["confirmation form", "form 14c", "form 17f"],
  urgent: ["without notice", "hardship"],
  adjournment: ["adjourn", "adjournments"],
  serve: ["serving", "service of documents", "service"],
  service: ["serving", "service of documents", "serve"],
  filing: ["file", "filed"],
  file: ["filing", "filed"],
  financial: ["financial statement", "financial disclosure", "form 13", "form 13.1"],
  trial: ["trial management", "trial record", "trial scheduling"],
};

const RULE_BOOST_MAP: Record<string, string[]> = {
  serve: ["Rule 6"],
  service: ["Rule 6"],
  costs: ["Rule 24"],
  "financial statement": ["Rule 13"],
  disclosure: ["Rule 13"],
  change: ["Rule 15"],
  variation: ["Rule 15"],
  motion: ["Rule 14"],
  conference: ["Rule 17"],
  "case conference": ["Rule 17"],
  "settlement conference": ["Rule 17"],
  trial: ["Rule 23"],
  answer: ["Rule 10"],
  appeal: ["Rule 38"],
};

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "shall",
  "should", "may", "might", "must", "can", "could", "i", "me", "my",
  "we", "our", "you", "your", "he", "she", "it", "they", "them",
  "this", "that", "these", "those", "what", "which", "who", "whom",
  "how", "when", "where", "why", "if", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "into", "about", "and", "or",
  "but", "not", "no", "so", "than", "too", "very", "just", "also",
  "there", "here", "all", "each", "every", "both", "few", "more",
  "most", "some", "any", "need", "get", "go", "know", "want",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s.-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function expandKeywords(tokens: string[]): string[] {
  const expanded = new Set(tokens);
  const joined = tokens.join(" ");

  // Check multi-word synonyms
  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (joined.includes(key) || tokens.some((t) => t === key)) {
      for (const syn of synonyms) {
        for (const word of syn.split(" ")) {
          if (word.length > 1) expanded.add(word);
        }
      }
    }
  }

  // Check single tokens against synonym keys
  for (const token of tokens) {
    if (SYNONYM_MAP[token]) {
      for (const syn of SYNONYM_MAP[token]) {
        for (const word of syn.split(" ")) {
          if (word.length > 1) expanded.add(word);
        }
      }
    }
  }

  return Array.from(expanded);
}

function getRuleBoostedRules(tokens: string[]): string[] {
  const rules: string[] = [];
  const joined = tokens.join(" ");

  for (const [key, ruleNumbers] of Object.entries(RULE_BOOST_MAP)) {
    if (joined.includes(key) || tokens.some((t) => t === key)) {
      rules.push(...ruleNumbers);
    }
  }
  return rules;
}

function scoreEntry(entry: DataEntry, keywords: string[], boostedRules: string[]): number {
  let score = 0;
  const headingLower = (entry.heading || "").toLowerCase();
  const textLower = (entry.text || "").toLowerCase();
  const sectionLower = ("section" in entry ? (entry as PDEntry).section || "" : "").toLowerCase();
  const ruleNumber = "rule_number" in entry ? (entry as FLREntry).rule_number || "" : "";
  const subrule = "subrule" in entry ? (entry as FLREntry).subrule || "" : "";
  const ruleNumberLower = ruleNumber.toLowerCase();
  const subruleLower = subrule.toLowerCase();

  for (const kw of keywords) {
    if (headingLower.includes(kw)) score += 3;
    if (ruleNumberLower.includes(kw) || subruleLower.includes(kw)) score += 2;
    if (sectionLower.includes(kw)) score += 1.5;
    if (textLower.includes(kw)) score += 1;
  }

  // Boost entries matching rule number patterns
  for (const rule of boostedRules) {
    if (ruleNumberLower === rule.toLowerCase()) {
      score += 2;
    }
  }

  return score;
}

export interface ScoredEntry {
  entry: DataEntry;
  score: number;
}

export interface SearchResult {
  chunks: DataEntry[];
  sourcesConsulted: string[];
}

export async function searchChunks(
  question: string,
  courthouse: CourthouseConfig
): Promise<SearchResult> {
  const data = await loadAllData();
  const tokens = tokenize(question);
  const keywords = expandKeywords(tokens);
  const boostedRules = getRuleBoostedRules(tokens);

  const scored: ScoredEntry[] = [];
  const sourcesConsulted: Set<string> = new Set();

  // Score provincial PD entries
  if (courthouse.dataSources.includes("provincial_pd")) {
    sourcesConsulted.add("Consolidated Provincial Practice Direction for Family Proceedings");
    for (const entry of data.provincial_pd) {
      const score = scoreEntry(entry, keywords, boostedRules);
      if (score > 0) scored.push({ entry, score });
    }
  }

  // Score central west PD entries (filter by courthouse)
  if (courthouse.dataSources.includes("central_west_pd")) {
    sourcesConsulted.add("Consolidated Practice Direction for the Central West Region");
    for (const entry of data.central_west_pd) {
      // Filter: include if no applies_to or if courthouse is in applies_to
      if (
        entry.applies_to &&
        entry.applies_to.length > 0 &&
        !entry.applies_to.includes(courthouse.filterKey)
      ) {
        continue;
      }
      const score = scoreEntry(entry, keywords, boostedRules);
      if (score > 0) scored.push({ entry, score });
    }
  }

  // Score FLR entries
  if (courthouse.dataSources.includes("family_law_rules")) {
    sourcesConsulted.add("Family Law Rules, O. Reg. 114/99");
    for (const entry of data.family_law_rules) {
      const score = scoreEntry(entry, keywords, boostedRules);
      if (score > 0) scored.push({ entry, score });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // If fewer than 5, lower threshold by including broader matches
  let results = scored;
  if (results.length < 5) {
    // Broaden: re-score with individual characters removed from keywords
    // Just take what we have - the API will handle limited data gracefully
  }

  // Take top 25, cap at 30
  const topChunks = results.slice(0, 25).map((s) => s.entry);

  // Ensure minimum of 5 if available
  const finalChunks = topChunks.length < 5
    ? scored.slice(0, Math.min(5, scored.length)).map((s) => s.entry)
    : topChunks;

  return {
    chunks: finalChunks.slice(0, 30),
    sourcesConsulted: Array.from(sourcesConsulted),
  };
}
