export type ArxivMatchType = "official" | "lineage" | "related" | "none";

export type EntityDiagram = {
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  type?: "text";
  text?: string;
};

export type Entity = {
  entityId: string;
  name: string;
  githubFullName: string;
  githubUrl: string;
  description: string;
  docsUrl?: string;
  homepageUrl?: string;
  tags: string[];
  stats: {
    stars: number;
    forks: number;
    openIssues: number;
  };
  repoUpdatedAt?: string;
  sourceSnapshotAt?: string;
  language?: string;
  license?: string;
  arxiv: {
    id?: string;
    url?: string;
    title?: string;
    matchType: ArxivMatchType;
    confidence: number;
  };
  diagrams: EntityDiagram[];
};

export type QaItem = {
  id: number;
  section: string;
  question: string;
  answer: string;
  confidence: number;
};

export type EntityDetail = {
  entity: Entity;
  qa: QaItem[];
};

export type EntityIndexStats = {
  total: number;
  paperCount: number;
  languageCount: number;
};
