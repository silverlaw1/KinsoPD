# Ontario Family Court — Procedural Reference Tool

A Next.js app that lets family lawyers and self-represented litigants ask procedural questions about Ontario family court. Answers are sourced exclusively from official Practice Directions and the Family Law Rules, with specific citations and hyperlinks.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...your-key-here...
   ```
   Get a key at https://console.anthropic.com
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000

## Data Sources

| Source | File |
|--------|------|
| Provincial Practice Direction | `data/data_provincial_pd.json` |
| Central West Regional Practice Direction | `data/data_central_west_pd.json` |
| Family Law Rules, O. Reg. 114/99 | `data/data_family_law_rules.json` |

## Adding More Courthouses

1. Create a new regional data file in `data/` following the existing JSON structure
2. Add an entry to `lib/courthouses.ts`
3. Provincial PD and FLR files apply to all courts — no changes needed

## Deployment

1. Push to GitHub
2. Import the repo on [Vercel](https://vercel.com)
3. Add `ANTHROPIC_API_KEY` in project settings
4. Deploy
