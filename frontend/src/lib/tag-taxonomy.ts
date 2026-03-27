export const TAG_CATEGORY_DEFS = [
  {
    id: "storage-database",
    label: "存储 / 数据库",
    tags: ["vector-db", "relational-db", "kv-store", "graph-db", "document-store", "local-file", "in-memory"],
  },
  {
    id: "embedding-models",
    label: "Embedding / 向量模型",
    tags: ["embedding", "custom-embedding"],
  },
  {
    id: "llm-engines",
    label: "LLM / 推理引擎",
    tags: ["llm-openai", "llm-anthropic", "llm-gemini", "llm-ollama", "llm-vllm", "llm-open-source"],
  },
  {
    id: "retrieval-query",
    label: "检索 / 查询",
    tags: ["faiss-search", "postgres-pgvector", "elasticsearch-bm25", "redis-vector-search", "weaviate-hybrid-search"],
  },
  {
    id: "api-service",
    label: "API / 服务层框架",
    tags: ["fastapi", "flask", "express", "grpc", "django"],
  },
  {
    id: "data-pipeline",
    label: "数据处理 / pipeline 库",
    tags: ["langchain", "llamaindex", "haystack", "semantic-kernel"],
  },
  {
    id: "concurrency",
    label: "并发 / 执行模型",
    tags: ["asyncio", "celery", "ray", "threading", "multiprocessing"],
  },
  {
    id: "streaming-mq",
    label: "流式 / 消息队列",
    tags: ["kafka", "pulsar", "rabbitmq"],
  },
  {
    id: "config-env",
    label: "配置 / 环境管理",
    tags: ["dotenv", "pydantic-settings", "yaml-config"],
  },
  {
    id: "deployment-infra",
    label: "部署 / 基础设施",
    tags: ["docker", "docker-compose", "kubernetes", "serverless"],
  },
  {
    id: "cloud-services",
    label: "云服务依赖",
    tags: ["aws-s3", "aws-rds", "aws-dynamodb", "gcp-bigquery", "azure-blob"],
  },
  {
    id: "data-format",
    label: "数据格式",
    tags: ["json", "parquet", "csv", "protobuf"],
  },
] as const;

export type TagCategoryId = (typeof TAG_CATEGORY_DEFS)[number]["id"];
export type TagId = (typeof TAG_CATEGORY_DEFS)[number]["tags"][number];

export const TAG_TO_CATEGORY = new Map<TagId, TagCategoryId>(
  TAG_CATEGORY_DEFS.flatMap((category) => category.tags.map((tag) => [tag, category.id] as const)),
);

export const TAG_TO_CATEGORY_LABEL = new Map<TagId, string>(
  TAG_CATEGORY_DEFS.flatMap((category) => category.tags.map((tag) => [tag, category.label] as const)),
);

export function getTagsForCategory(categoryId: string): string[] {
  return [...(TAG_CATEGORY_DEFS.find((category) => category.id === categoryId)?.tags ?? [])];
}

export function getUsedCategoryIds(tags: string[]): TagCategoryId[] {
  const used = new Set<TagCategoryId>();
  for (const tag of tags) {
    const categoryId = TAG_TO_CATEGORY.get(tag as TagId);
    if (categoryId) used.add(categoryId);
  }
  return TAG_CATEGORY_DEFS.map((category) => category.id).filter((id) => used.has(id)) as TagCategoryId[];
}

export function normalizeSelectedTags(tags: string[]): TagId[] {
  return [
    ...new Set(
      tags
        .map((tag) => tag.trim())
        .filter((tag): tag is TagId => Boolean(tag) && TAG_TO_CATEGORY.has(tag as TagId)),
    ),
  ];
}

export function groupSelectedTagsByCategory(tags: string[]): Map<TagCategoryId, TagId[]> {
  const grouped = new Map<TagCategoryId, TagId[]>();
  for (const tag of normalizeSelectedTags(tags)) {
    const categoryId = TAG_TO_CATEGORY.get(tag);
    if (!categoryId) continue;
    const current = grouped.get(categoryId) ?? [];
    current.push(tag);
    grouped.set(categoryId, current);
  }
  return grouped;
}
