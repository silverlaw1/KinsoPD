export interface CourthouseConfig {
  name: string;
  region: string;
  dataSources: string[];
  filterKey: string;
}

export const courthouses: Record<string, CourthouseConfig> = {
  "brampton-scj": {
    name: "Brampton SCJ (Central West Region)",
    region: "Central West",
    dataSources: ["provincial_pd", "central_west_pd", "family_law_rules"],
    filterKey: "Brampton",
  },
  "brampton-ocj": {
    name: "Brampton OCJ (Ontario Court of Justice)",
    region: "Central West",
    dataSources: ["brampton_ocj_pd", "family_law_rules"],
    filterKey: "Brampton",
  },
};
