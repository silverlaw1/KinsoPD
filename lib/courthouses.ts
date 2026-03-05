export interface CourthouseConfig {
  name: string;
  region: string;
  courtLevel: "SCJ" | "OCJ";
  dataSources: string[];
  filterKey: string;
}

export const courthouses: Record<string, CourthouseConfig> = {
  "brampton-scj": {
    name: "Brampton — Superior Court of Justice (Central West)",
    region: "Central West",
    courtLevel: "SCJ",
    dataSources: ["provincial_pd", "central_west_pd", "family_law_rules"],
    filterKey: "Brampton",
  },
  "brampton-ocj": {
    name: "Brampton — Ontario Court of Justice",
    region: "Central West",
    courtLevel: "OCJ",
    dataSources: ["brampton_ocj_pd", "family_law_rules"],
    filterKey: "Brampton",
  },
};
