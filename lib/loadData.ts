import { readFile } from "fs/promises";
import path from "path";

export interface PDEntry {
  id: string;
  source: string;
  scope: string;
  court_level: string;
  part?: string;
  section?: string;
  heading: string;
  url: string;
  text: string;
  applies_to?: string[];
}

export interface FLREntry {
  id: string;
  source: string;
  scope: string;
  court_level: string;
  rule_number: string;
  subrule: string;
  heading: string;
  url: string;
  canlii_url: string;
  text: string;
}

export type DataEntry = PDEntry | FLREntry;

interface DataCache {
  provincial_pd: PDEntry[];
  central_west_pd: PDEntry[];
  brampton_ocj_pd: PDEntry[];
  family_law_rules: FLREntry[];
}

let cache: DataCache | null = null;

export async function loadAllData(): Promise<DataCache> {
  if (cache) return cache;

  const dataDir = path.join(process.cwd(), "data");

  const [provincialRaw, centralWestRaw, bramptonOcjRaw, flrRaw] = await Promise.all([
    readFile(path.join(dataDir, "data_provincial_pd.json"), "utf-8"),
    readFile(path.join(dataDir, "data_central_west_pd.json"), "utf-8"),
    readFile(path.join(dataDir, "data_brampton_ocj_pd.json"), "utf-8"),
    readFile(path.join(dataDir, "data_family_law_rules.json"), "utf-8"),
  ]);

  cache = {
    provincial_pd: JSON.parse(provincialRaw),
    central_west_pd: JSON.parse(centralWestRaw),
    brampton_ocj_pd: JSON.parse(bramptonOcjRaw),
    family_law_rules: JSON.parse(flrRaw),
  };

  return cache;
}
