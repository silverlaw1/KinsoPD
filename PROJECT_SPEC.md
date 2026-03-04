# Ontario Family Court Procedural Q&A App — Claude Code Project Spec

## What This Document Is

This is a complete project specification you can paste directly into Claude Code to build your app. It contains everything Claude Code needs: the architecture, the data structure, the system prompt, and step-by-step instructions. You should not need to write code yourself.

---

## ORDER OF OPERATIONS — COMPLETE CHECKLIST

1. ☐ Download all files from this conversation (this spec, the two practice direction JSONs, HOW_TO_ADD_FLR.md)
2. ☐ Create the `family-court-app` folder and put all the files in it
3. ☐ Copy the FLR text from e-Laws and save as `family_law_rules_raw.txt` (see HOW_TO_ADD_FLR.md)
4. ☐ Open Claude Code in the folder, paste the FLR parsing prompt from HOW_TO_ADD_FLR.md
5. ☐ Verify the FLR JSON file was created in data/
6. ☐ Move the two practice direction JSONs into data/ if they aren't already there
7. ☐ Paste the main build prompt below into Claude Code
8. ☐ Get a Claude API key from console.anthropic.com
9. ☐ Create .env file with your API key
10. ☐ Run `npm install` then `npm run dev`
11. ☐ Test with sample questions at the bottom of this document
12. ☐ Deploy to Vercel when ready

---

## STEP 3/4: PARSE THE FAMILY LAW RULES

See **HOW_TO_ADD_FLR.md** for the one manual step (copying text from e-Laws) and the Claude Code prompt that converts it to structured JSON.

---

## STEP 7: MAIN BUILD PROMPT — PASTE INTO CLAUDE CODE

```
Build me a Next.js web application for procedural Q&A about Ontario family court.

## WHAT THE APP DOES

This is a tool for family lawyers and self-represented litigants to ask procedural questions about Ontario family court practice and receive accurate, cited answers drawn ONLY from official practice directions and the Family Law Rules.

The user experience is:
1. User selects a courthouse (starting with Brampton SCJ)
2. User types a question (e.g., "What is the page limit for a case conference brief?", "How do I schedule a motion in Brampton?", "What are the service deadlines for a motion?")
3. The app searches the data for the most relevant chunks
4. The app sends those relevant chunks + the question to the Claude API
5. Claude answers using ONLY the provided data, with specific citations and hyperlinks

## DATA FILES

I have three JSON data files in the data/ directory:
- `data_provincial_pd.json` — Provincial Practice Direction (applies to all SCJ courts)
- `data_central_west_pd.json` — Central West Regional Practice Direction (applies to Brampton, Milton, Guelph, etc.)
- `data_family_law_rules.json` — Family Law Rules, O. Reg. 114/99 (applies province-wide)

Each practice direction entry has this structure:
{
  "id": "prov-012",
  "source": "Consolidated Provincial Practice Direction for Family Proceedings",
  "scope": "provincial",
  "court_level": "SCJ",
  "section": "Part I, Section E.1(b)",
  "heading": "Restrictions on Filing Conference Materials (Page Limits and Attachments)",
  "url": "https://www.ontariocourts.ca/scj/areas-of-law/family/family-pd/#...",
  "text": "Case conference briefs shall not exceed 8 pages..."
}

Each Family Law Rules entry has this structure:
{
  "id": "flr-045",
  "source": "Family Law Rules, O. Reg. 114/99",
  "scope": "provincial",
  "court_level": "all",
  "rule_number": "Rule 17",
  "subrule": "17(13.1)",
  "heading": "Conferences — Filing Deadlines",
  "url": "https://www.ontario.ca/laws/regulation/990114",
  "canlii_url": "https://www.canlii.org/en/on/laws/regu/o-reg-114-99/latest/o-reg-114-99.html#sec17",
  "text": "..."
}

Some Central West entries also have an "applies_to" array listing which courthouses they apply to.

## ARCHITECTURE

### The Search/Retrieval Problem

The combined dataset is too large to send entirely in each API call. The app MUST include a retrieval step that selects only the most relevant chunks for each question. Use this approach:

### Search Strategy: Two-Pass Retrieval

Pass 1 — Keyword + heading search (fast, local):
- Tokenize the user's question into keywords (lowercase, remove common stop words)
- Score each chunk by counting keyword matches in its heading, text, section, rule_number, and subrule fields
- Apply extra weight to heading matches (3x) and rule_number matches (2x)
- Common legal synonyms should be mapped, for example:
  "custody" also searches "decision-making responsibility", "parenting time"
  "access" also searches "parenting time", "contact"
  "support" also searches "child support", "spousal support"
  "motion" also searches "motions"
  "conference" also searches "case conference", "settlement conference"
  "DRO" also searches "dispute resolution officer"
  "page limit" also searches "page limits", "restrictions on filing", "page restrictions"
  "confirmation" also searches "confirmation form", "Form 14C", "Form 17F"
  "urgent" also searches "without notice", "hardship"
  "adjournment" also searches "adjourn", "adjournments"
  "serve" or "service" also searches "serving", "service of documents"
  "filing" also searches "file", "filed"
  "financial" also searches "financial statement", "financial disclosure", "Form 13", "Form 13.1"
  "trial" also searches "trial management", "trial record", "trial scheduling"
- Also map question patterns to likely rule numbers: questions about "serve" or "service" should boost Rule 6 chunks; "costs" should boost Rule 24 chunks; "financial statement" or "disclosure" should boost Rule 13 chunks; "change" or "variation" should boost Rule 15 chunks

Pass 2 — Filter by courthouse:
- Include ALL provincial practice direction chunks that scored above threshold
- Include ALL FLR chunks that scored above threshold (they apply everywhere)
- Include Central West chunks that scored above threshold AND where applies_to includes the selected courthouse (or has no applies_to field)

Select top results:
- Take the top 25 highest-scoring chunks
- If fewer than 5 chunks matched, broaden the search by lowering the threshold or falling back to broader keyword matching
- Cap at 30 chunks maximum to stay well within API context limits

### Frontend (single page)
- Clean, professional design. Law-firm appropriate. No playful colors.
- Header: "Ontario Family Court — Procedural Reference Tool"
- Subtitle: "Answers sourced exclusively from official Ontario Superior Court of Justice Practice Directions and the Family Law Rules, O. Reg. 114/99"
- A dropdown to select the courthouse. For now, just "Brampton SCJ (Central West Region)" — but build this as a configurable list
- A text input for the question with placeholder text like "e.g., What is the page limit for a case conference brief?"
- A submit button
- A response area that displays:
  - The answer in clear paragraphs with markdown rendered (bold, links)
  - Each citation as a clickable hyperlink opening in a new tab
  - After the answer, a "Sources consulted" section listing which data sources were searched
- Example question chips below the input that auto-fill the question field when clicked:
  - "What is the page limit for a case conference brief?"
  - "How do I schedule a motion in Brampton?"
  - "When are confirmation forms due?"
  - "What is the process for a motion to change?"
  - "How do I bring an urgent motion?"
- A disclaimer at the bottom: "This tool provides information from official court practice directions and the Family Law Rules for reference purposes only. It does not constitute legal advice. Always verify current requirements with the court and consult a lawyer for advice about your specific situation. Practice directions and rules may be amended — check ontariocourts.ca and e-Laws for the most current versions."

### Backend (Next.js API route: /api/ask)

When the user submits a question:

1. Load all three JSON data files from the data/ directory (cache in memory after first load)
2. Run the two-pass search described above to find the most relevant chunks
3. Send the selected chunks + the user's question + the courthouse name to the Claude API with the system prompt below
4. Return Claude's response and the list of source documents to the frontend

### Claude API Call
Use the Anthropic SDK for Node.js (@anthropic-ai/sdk).
Model: claude-sonnet-4-20250514
Max tokens: 2500

The API key should be read from an environment variable called ANTHROPIC_API_KEY.

### System Prompt for Claude API

Use this exact system prompt:

"You are a procedural reference assistant for Ontario family court (Superior Court of Justice). You answer questions about court procedures, scheduling, filing requirements, service deadlines, page limits, and practice direction requirements using the Family Law Rules and official Practice Directions.

CRITICAL RULES:
1. You must ONLY answer based on the data provided below. Never use outside knowledge about Ontario family law or court procedures.
2. Every factual claim in your answer MUST include a citation. Use this markdown format: [Source abbreviation, Section reference](URL)
   - For practice directions: [Provincial PD, Part I, s. E.1(b)](url) or [Central West PD, Part 3, s. F](url)
   - For the Family Law Rules: [FLR, Rule 17(13.1)](canlii_url) or [FLR, Rule 14(12)](canlii_url)
3. If the provided data does not contain information to answer the question, say: 'I don't have specific information about that in the practice directions and Family Law Rules I have access to. You may want to contact the Trial Coordinator's Office at the Brampton courthouse or check ontariocourts.ca and e-Laws directly.'
4. Never provide legal advice. You provide procedural information only. Do not tell people what they 'should' do in their case — only what the rules and practice directions require or permit.
5. When a question could be answered by BOTH the Family Law Rules AND a practice direction, include BOTH sources. The practice direction may add requirements beyond what the Rules state (e.g., the Rules set filing deadlines but the practice direction adds page limits). Make clear which requirements come from which source.
6. Be specific about which courthouse or region a rule applies to. Distinguish between provincial rules (apply everywhere), regional rules (Central West), and courthouse-specific rules (Brampton only).
7. Format your answer in clear, readable paragraphs. Use **bold** for key deadlines, page limits, or requirements that the user most needs to notice.
8. Always use the full section reference AND make it a clickable markdown link.
9. If relevant, note the specific form number required (e.g., Form 17F, Form 14C, Form 17A).
10. When discussing deadlines, specify whether they are business days or calendar days as stated in the source.

The user is asking about procedures at: {courthouse_name}

RELEVANT PRACTICE DIRECTION AND RULE DATA:
{chunks_as_json}"

Replace {courthouse_name} with the selected courthouse and {chunks_as_json} with a JSON string of the selected relevant chunks.

## TECHNICAL REQUIREMENTS

- Use Next.js App Router (app directory)
- Use TypeScript
- Tailwind CSS for styling
- The app should work with npm run dev locally
- Include a .env.example file with ANTHROPIC_API_KEY=your_key_here
- Include a README.md with clear setup instructions
- The data files should be read from a /data directory in the project root
- Make the courthouse selection and data loading modular so it is easy to add new courthouses later
- Cache the loaded JSON data in memory after first load (do not re-read files on every request)

## FILE STRUCTURE

family-court-app/
├── app/
│   ├── page.tsx          (main UI)
│   ├── layout.tsx        (root layout with metadata)
│   ├── globals.css       (tailwind styles)
│   └── api/
│       └── ask/
│           └── route.ts  (API endpoint)
├── data/
│   ├── data_provincial_pd.json
│   ├── data_central_west_pd.json
│   └── data_family_law_rules.json
├── lib/
│   ├── loadData.ts       (data loading and caching)
│   ├── search.ts         (keyword search, synonym mapping, scoring, chunk selection)
│   └── courthouses.ts    (courthouse config: names, regions, which data files apply)
├── .env.example
├── README.md
├── package.json
├── tsconfig.json
└── tailwind.config.ts

## COURTHOUSE CONFIGURATION (lib/courthouses.ts)

Create a configuration object that maps courthouses to their data sources:

export const courthouses = {
  "brampton-scj": {
    name: "Brampton SCJ (Central West Region)",
    region: "Central West",
    dataSources: ["provincial_pd", "central_west_pd", "family_law_rules"],
    filterKey: "Brampton"
  }
};

## DESIGN GUIDELINES

- Background: white or very light gray (#fafafa)
- Text: dark charcoal (#1a1a1a)
- Accent/header color: deep navy (#1e3a5f)
- Links: blue (#2563eb), open in new tab
- Font: system font stack or Inter
- Response area: subtle left border (navy) and light background
- Citations: clearly styled as clickable blue links
- Loading state: "Searching practice directions and Family Law Rules..." with subtle animation
- Mobile responsive — this will be used on phones in courthouses
- Question input: at least 2 lines tall
- Example question chips below input

Build the complete app now. The data JSON files should already be in the data/ directory. If they are in the root instead, move them into data/.
```

---

## AFTER CLAUDE CODE BUILDS THE APP

### To run locally:
1. Create a `.env` file: `ANTHROPIC_API_KEY=sk-ant-...your-key-here...`
2. Run: `npm install`
3. Run: `npm run dev`
4. Open http://localhost:3000

### To get a Claude API key:
Go to https://console.anthropic.com → create account → generate API key.

### To deploy:
1. Push to GitHub
2. Create free Vercel account at https://vercel.com
3. Import the repo, add ANTHROPIC_API_KEY in settings
4. Deploy

---

## ADDING MORE COURTS LATER

1. Fetch the regional practice direction for that region
2. Create a new data file (e.g., `data/data_toronto_pd.json`) in the same JSON structure
3. Add a new entry to courthouses config in `lib/courthouses.ts`
4. Provincial PD and FLR files never change — they apply to all courts

---

## SAMPLE TEST QUESTIONS

1. "What is the page limit for a case conference brief?"
2. "How do I schedule a motion in Brampton?"
3. "When is the confirmation form due for a settlement conference?"
4. "What documents need to be uploaded to Case Center?"
5. "How do I bring an urgent motion without notice?"
6. "What is the process for a motion to change in Brampton?"
7. "Do I need to gown for a case conference?"
8. "How do I schedule a DRO conference in Brampton?"
9. "What are the page limits for a short motion affidavit?"
10. "What are the service deadlines for motion materials?"
11. "How long do I have to file an Answer to an application?"
12. "What must be included in a financial statement?"
13. "What is the process for a combined case/settlement conference?"
14. "How do I get a trial date in Brampton?"
15. "What happens if I don't file a confirmation form?"

---

## DATA SOURCES

| Source | URL | Notes |
|--------|-----|-------|
| Provincial PD for Family | https://www.ontariocourts.ca/scj/areas-of-law/family/family-pd/ | Amended Feb 6, 2025 |
| Central West Regional PD | https://www.ontariocourts.ca/scj/practice_directions/consolidated-practice-direction-for-the-central-west-region/ | Effective June 30, 2025 |
| Family Law Rules, O. Reg. 114/99 | https://www.ontario.ca/laws/regulation/990114 | Last amendment: O. Reg. 228/25 |

**Check these URLs every few months and regenerate data files if content has changed.**
