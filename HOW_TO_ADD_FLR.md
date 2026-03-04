# How To Add the Family Law Rules to Your App

## Step 1: Get the Raw Text (5-10 minutes, one time only)

1. Open this URL in your browser: https://www.ontario.ca/laws/regulation/990114
2. Wait for the page to fully load
3. Press **Ctrl+A** (or Cmd+A on Mac) to select all text on the page
4. Press **Ctrl+C** (or Cmd+C) to copy
5. Open a plain text editor (Notepad on Windows, TextEdit on Mac set to plain text)
6. Paste the text (Ctrl+V / Cmd+V)
7. Save the file as **family_law_rules_raw.txt** in your `family-court-app` folder

**Tip:** The file will be large (probably 300-500 KB of text). That's normal — the FLR is a big regulation.

**Alternative method (if copy-paste is messy):**
- Go to https://www.ontario.ca/laws/regulation/990114
- Right-click the page → "Save as..." → choose "Web page, complete" or "Text file"
- Save it as `family_law_rules_raw.txt`

## Step 2: Have Claude Code Parse It

Once you have `family_law_rules_raw.txt` in your project folder, open Claude Code and paste this prompt:

---

```
I have a file called family_law_rules_raw.txt in this directory. It contains the full text of the Ontario Family Law Rules (O. Reg. 114/99), copied from the e-Laws website.

Parse this file into a structured JSON file called data_family_law_rules.json in the data/ directory (create the directory if it doesn't exist). The JSON file should be an array of objects, where each object represents one rule or meaningful sub-section.

Each object should have this structure:

{
  "id": "flr-XXX",
  "source": "Family Law Rules, O. Reg. 114/99",
  "scope": "provincial",
  "court_level": "all",
  "rule_number": "Rule 14",
  "subrule": "14(12)",
  "heading": "Urgent Motion Without Notice",
  "url": "https://www.ontario.ca/laws/regulation/990114#BK24",
  "canlii_url": "https://www.canlii.org/en/on/laws/regu/o-reg-114-99/latest/o-reg-114-99.html#sec14subsec12",
  "text": "The actual text of the subrule..."
}

PARSING RULES:

1. CHUNKING GRANULARITY: Each chunk should be a logical, self-contained unit. This means:
   - For short rules (under 500 words), the entire rule can be one chunk
   - For long rules (like Rule 13 Financial Disclosure, Rule 14 Motions, Rule 15 Motions to Change, Rule 17 Conferences, Rule 25 Orders), break them into sub-sections based on headings or logical groupings of subrules
   - Each chunk should be answerable on its own — someone reading just that chunk should understand the requirement without needing context from other chunks
   - Group related subrules together (e.g., all the subrules about service deadlines for motions can be one chunk)

2. IDs: Use sequential IDs like "flr-001", "flr-002", etc.

3. URLs: 
   - For the e-Laws url field, use: https://www.ontario.ca/laws/regulation/990114 (we can't deep-link into e-Laws easily)
   - For the canlii_url field, construct URLs like: https://www.canlii.org/en/on/laws/regu/o-reg-114-99/latest/o-reg-114-99.html#sec{rule_number}
   - For example, Rule 14 → #sec14, Rule 17 → #sec17

4. HEADINGS: Use the rule heading from the FLR itself. For sub-chunks, combine the rule heading with the sub-section topic. For example:
   - "Conferences — Case Conference Brief Requirements"
   - "Motions — Service of Motion Materials"
   - "Financial Disclosure — Documents to Include with Financial Statement"

5. TEXT: Include the actual rule text. Clean up any artifacts from the copy-paste (extra whitespace, page numbers, navigation elements). Keep the subrule numbering (e.g., "(3.1)", "(12)") as it appears in the original.

6. RULE_NUMBER: Always include the top-level rule number (e.g., "Rule 14", "Rule 17")

7. SUBRULE: Where applicable, include the specific subrule reference (e.g., "17(13.1)", "14(4.2)")

Here are the rules in the FLR and their approximate topics — use these to guide your parsing:

Rule 1 — General (jurisdiction, forms, practice directions, case management powers)
Rule 2 — Interpretation (definitions)
Rule 3 — Time
Rule 4 — Representation (who may appear)
Rule 5 — Where a Case Starts and is to be Heard
Rule 6 — Service of Documents
Rule 7 — Parties to a Case (adding/removing parties, OCL)
Rule 8 — Starting a Case (applications, mandatory info program)
Rule 8.0.1 — Automatic Orders
Rule 8.1 — Mandatory Information Program
Rule 9 — Continuing Record
Rule 10 — Answers
Rule 11 — Amending Applications, Answers, Replies
Rule 12 — Withdrawing, Combining, Splitting Cases
Rule 13 — Financial Disclosure (IMPORTANT — break into sub-sections)
Rule 14 — Motions (IMPORTANT — break into sub-sections for regular motions, urgent motions, without notice, 14B motions)
Rule 15 — Motions to Change (IMPORTANT — break into sub-sections)
Rule 16 — Summary Judgment
Rule 17 — Conferences (IMPORTANT — break into sub-sections for case conferences, settlement conferences, TMCs, confirmation forms, DROs)
Rule 18 — Offers to Settle
Rule 19 — Document Disclosure
Rule 20 — Questioning and Experts
Rule 20.1 — Further Dispute Resolution
Rule 20.2 — Expert Opinion Evidence
Rule 21 — Report of Children's Lawyer
Rule 22 — Admission of Facts
Rule 23 — Evidence and Trial (uncontested trials, evidence rules)
Rule 24 — Costs
Rule 25 — Orders (drafting, signing, effective dates)
Rule 25.1 — Custody and Access (historical)
Rule 26 — Enforcement of Orders
Rule 27 — Requiring Financial Information
Rule 28 — Seizure and Sale
Rule 29 — Garnishment
Rule 30 — Default Hearing
Rule 31 — Contempt of Court
Rule 32 — Bonds, Recognizances, Warrants
Rule 33 — Child Protection (IMPORTANT — break into sub-sections)
Rule 33.1 — Custody/Access, Adoption — consent and service requirements
Rule 34 — Adoption
Rule 35 — Change of Name
Rule 35.1 — Parenting Affidavit (Form 35.1)
Rule 36 — Divorce
Rule 37 — Interjurisdictional Support Orders
Rule 38 — Appeals
Rule 39-42 — Case Management rules
Rule 43 — Binding Judicial Dispute Resolution (NEW — added January 2025)

After creating the JSON file, print a summary showing: total number of chunks created, and a count of chunks per rule number.
```

---

## Step 3: Verify the Output

After Claude Code finishes, it should tell you how many chunks it created. You should expect roughly 200-400 chunks depending on granularity. Check that:
- The file `data/data_family_law_rules.json` exists
- It's valid JSON (Claude Code should confirm this)
- Key rules like 14, 15, 17 have multiple chunks each

## What Happens Next

Once the FLR data file is created, proceed with the main app build using the updated PROJECT_SPEC.md. The app architecture has been updated to handle the larger dataset using a search/retrieval step.
