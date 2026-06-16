export type ModelCapability =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "multimodal"
  | "rerank"
  | "embedding"
  | "code";

export type ModelPlatformTag = "featured" | "discount" | "new" | "popular" | "connected" | "recommended";

export type ModelProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "meta"
  | "deepseek"
  | "xai"
  | "mistral"
  | "qwen"
  | "moonshot"
  | "minimax"
  | "stability"
  | "runway"
  | "pika"
  | "luma"
  | "other";

export type ModelSeriesId =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "llama"
  | "deepseek"
  | "grok"
  | "mistral"
  | "qwen"
  | "kimi"
  | "minimax"
  | "glm"
  | "stability"
  | "runway"
  | "pika"
  | "luma"
  | "other";

export type ModelProvider = {
  id: ModelProviderId;
  name: string;
  logoSrc: string;
  logoAlt: string;
  aliases: string[];
  color: string;
};

export type ModelSeries = {
  id: ModelSeriesId;
  name: string;
  provider: ModelProviderId;
  providerName: string;
  productIconSrc?: string;
  productIconAlt?: string;
  logoSrc: string;
  logoAlt: string;
  aliases: string[];
  defaultTags: ModelPlatformTag[];
  description: string;
};

export type CatalogModel = {
  id: string;
  name: string;
  displayName: string;
  provider: ModelProviderId;
  providerName: string;
  series?: ModelSeriesId;
  description: string;
  capabilities: ModelCapability[];
  tags: ModelPlatformTag[];
  inputPrice?: string;
  outputPrice?: string;
  contextLength?: string;
  supports: {
    streaming?: boolean;
    imageInput?: boolean;
    functionCalling?: boolean;
    longContext?: boolean;
  };
};

export type ModelIcon = {
  label: string;
  src: string;
  alt: string;
};

export type ModelIconRule = ModelIcon & {
  seriesIds: ModelSeriesId[];
  keywords: string[];
  sourceNames: string[];
};

export const modelProviders: ModelProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    logoSrc: "/logos/vendors/openai.svg",
    logoAlt: "OpenAI logo",
    aliases: ["openai", "gpt", "chatgpt", "o1", "o3", "o4"],
    color: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    logoSrc: "/logos/vendors/anthropic.svg",
    logoAlt: "Anthropic logo",
    aliases: ["anthropic", "claude", "sonnet", "opus", "haiku"],
    color: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  {
    id: "google",
    name: "Google",
    logoSrc: "/logos/vendors/google.svg",
    logoAlt: "Google logo",
    aliases: ["google", "gemini", "palm", "vertex"],
    color: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  {
    id: "meta",
    name: "Meta",
    logoSrc: "/logos/vendors/meta.svg",
    logoAlt: "Meta logo",
    aliases: ["meta", "llama", "facebook"],
    color: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    logoSrc: "/logos/vendors/deepseek.svg",
    logoAlt: "DeepSeek logo",
    aliases: ["deepseek"],
    color: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  },
  {
    id: "xai",
    name: "xAI",
    logoSrc: "/logos/vendors/xai.svg",
    logoAlt: "xAI logo",
    aliases: ["xai", "x.ai", "grok"],
    color: "bg-slate-100 text-slate-800 ring-slate-200",
  },
  {
    id: "mistral",
    name: "Mistral",
    logoSrc: "/logos/vendors/mistral.svg",
    logoAlt: "Mistral logo",
    aliases: ["mistral", "mixtral", "codestral"],
    color: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  {
    id: "qwen",
    name: "Qwen / 阿里",
    logoSrc: "/logos/vendors/qwen.svg",
    logoAlt: "Qwen Alibaba logo",
    aliases: ["qwen", "tongyi", "aliyun", "alibaba", "阿里", "通义", "dashscope"],
    color: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  {
    id: "moonshot",
    name: "Moonshot / Kimi",
    logoSrc: "/logos/vendors/moonshot.svg",
    logoAlt: "Moonshot Kimi logo",
    aliases: ["moonshot", "kimi"],
    color: "bg-purple-50 text-purple-700 ring-purple-200",
  },
  {
    id: "minimax",
    name: "MiniMax",
    logoSrc: "/logos/vendors/minimax.svg",
    logoAlt: "MiniMax logo",
    aliases: ["minimax", "abab", "hailuo"],
    color: "bg-pink-50 text-pink-700 ring-pink-200",
  },
  {
    id: "stability",
    name: "Stability",
    logoSrc: "/logos/vendors/stability.svg",
    logoAlt: "Stability AI logo",
    aliases: ["stability", "stable-diffusion", "sdxl"],
    color: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  {
    id: "runway",
    name: "Runway",
    logoSrc: "/logos/vendors/runway.svg",
    logoAlt: "Runway logo",
    aliases: ["runway", "gen-2", "gen-3"],
    color: "bg-zinc-100 text-zinc-800 ring-zinc-200",
  },
  {
    id: "pika",
    name: "Pika",
    logoSrc: "/logos/vendors/pika.svg",
    logoAlt: "Pika logo",
    aliases: ["pika"],
    color: "bg-lime-50 text-lime-700 ring-lime-200",
  },
  {
    id: "luma",
    name: "Luma",
    logoSrc: "/logos/vendors/luma.svg",
    logoAlt: "Luma AI logo",
    aliases: ["luma", "ray"],
    color: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
  },
  {
    id: "other",
    name: "其他",
    logoSrc: "/logos/vendors/default-ai.svg",
    logoAlt: "AI provider logo",
    aliases: ["other", "provider", "model", "bge", "baai", "cohere", "jina", "baidu", "ernie", "zhipu", "glm"],
    color: "bg-slate-100 text-slate-700 ring-slate-200",
  },
];

export const modelSeriesList: ModelSeries[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    provider: "openai",
    providerName: "OpenAI",
    productIconSrc: "/logos/model-series/chatgpt.svg",
    productIconAlt: "ChatGPT app icon",
    logoSrc: "/logos/model-series/chatgpt.svg",
    logoAlt: "ChatGPT series logo",
    aliases: ["chatgpt", "gpt-", "gpt_", "gpt ", "o1", "o3", "o4"],
    defaultTags: ["popular", "recommended"],
    description: "OpenAI GPT 系列，适合通用聊天、多模态理解、工具调用和代码任务。",
  },
  {
    id: "claude",
    name: "Claude",
    provider: "anthropic",
    providerName: "Anthropic",
    productIconSrc: "/logos/model-series/claude.svg",
    productIconAlt: "Claude app icon",
    logoSrc: "/logos/model-series/claude.svg",
    logoAlt: "Claude series logo",
    aliases: ["claude", "sonnet", "opus", "haiku", "anthropic"],
    defaultTags: ["popular", "recommended"],
    description: "Anthropic Claude 系列，适合写作、分析、代码和长文档处理。",
  },
  {
    id: "gemini",
    name: "Gemini",
    provider: "google",
    providerName: "Google",
    productIconSrc: "/logos/model-series/gemini.svg",
    productIconAlt: "Gemini app icon",
    logoSrc: "/logos/model-series/gemini.svg",
    logoAlt: "Gemini series logo",
    aliases: ["gemini", "google", "vertex"],
    defaultTags: ["featured", "popular"],
    description: "Google Gemini 系列，适合多模态理解、长上下文和生产级助手。",
  },
  {
    id: "llama",
    name: "Llama",
    provider: "meta",
    providerName: "Meta",
    productIconSrc: "/logos/model-series/llama.svg",
    productIconAlt: "Llama app icon",
    logoSrc: "/logos/model-series/llama.svg",
    logoAlt: "Llama series logo",
    aliases: ["llama", "meta"],
    defaultTags: ["popular"],
    description: "Meta Llama 系列，适合开源生态、私有化评估和通用生成任务。",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    provider: "deepseek",
    providerName: "DeepSeek",
    productIconSrc: "/logos/model-series/deepseek.svg",
    productIconAlt: "DeepSeek app icon",
    logoSrc: "/logos/model-series/deepseek.svg",
    logoAlt: "DeepSeek series logo",
    aliases: ["deepseek"],
    defaultTags: ["featured", "discount", "recommended"],
    description: "DeepSeek 系列，适合高性价比聊天、代码和复杂推理。",
  },
  {
    id: "grok",
    name: "Grok",
    provider: "xai",
    providerName: "xAI",
    productIconSrc: "/logos/model-series/grok.svg",
    productIconAlt: "Grok app icon",
    logoSrc: "/logos/model-series/grok.svg",
    logoAlt: "Grok series logo",
    aliases: ["grok", "xai", "x.ai"],
    defaultTags: ["new"],
    description: "xAI Grok 系列，适合实时信息理解和通用对话任务。",
  },
  {
    id: "mistral",
    name: "Mistral",
    provider: "mistral",
    providerName: "Mistral",
    productIconSrc: "/logos/model-series/mistral.svg",
    productIconAlt: "Mistral app icon",
    logoSrc: "/logos/model-series/mistral.svg",
    logoAlt: "Mistral series logo",
    aliases: ["mistral", "mixtral", "codestral"],
    defaultTags: ["recommended"],
    description: "Mistral 系列，适合多语言、代码和高性能文本任务。",
  },
  {
    id: "qwen",
    name: "Qwen",
    provider: "qwen",
    providerName: "Alibaba",
    productIconSrc: "/logos/model-series/qwen.svg",
    productIconAlt: "Qwen app icon",
    logoSrc: "/logos/model-series/qwen.svg",
    logoAlt: "Qwen series logo",
    aliases: ["qwen", "tongyi", "aliyun", "alibaba", "阿里", "通义", "dashscope"],
    defaultTags: ["popular", "recommended"],
    description: "阿里 Qwen / 通义千问系列，适合中文、多语言和企业知识场景。",
  },
  {
    id: "kimi",
    name: "Kimi",
    provider: "moonshot",
    providerName: "Moonshot",
    productIconSrc: "/logos/model-series/kimi.svg",
    productIconAlt: "Kimi app icon",
    logoSrc: "/logos/model-series/kimi.svg",
    logoAlt: "Kimi series logo",
    aliases: ["kimi", "moonshot"],
    defaultTags: ["popular", "recommended"],
    description: "Moonshot Kimi 系列，适合长文本阅读、总结和知识库问答。",
  },
  {
    id: "minimax",
    name: "MiniMax",
    provider: "minimax",
    providerName: "MiniMax",
    productIconSrc: "/logos/model-series/minimax.svg",
    productIconAlt: "MiniMax app icon",
    logoSrc: "/logos/model-series/minimax.svg",
    logoAlt: "MiniMax series logo",
    aliases: ["minimax", "abab", "hailuo"],
    defaultTags: ["new"],
    description: "MiniMax 系列，适合中文对话、角色互动、内容生成和音频能力。",
  },
  {
    id: "glm",
    name: "GLM",
    provider: "other",
    providerName: "Z.ai",
    productIconSrc: "/logos/model-series/glm.svg",
    productIconAlt: "GLM app icon",
    logoSrc: "/logos/model-series/glm.svg",
    logoAlt: "GLM Z.ai series logo",
    aliases: ["glm", "z.ai", "zai", "zhipu", "智谱", "chatglm"],
    defaultTags: ["recommended"],
    description: "Z.ai / GLM 系列，适合中文、多语言、推理和工具调用场景。",
  },
  {
    id: "stability",
    name: "Stability",
    provider: "stability",
    providerName: "Stability AI",
    productIconSrc: "/logos/model-series/stability.svg",
    productIconAlt: "Stability app icon",
    logoSrc: "/logos/model-series/stability.svg",
    logoAlt: "Stability series logo",
    aliases: ["stability", "stable-diffusion", "sdxl"],
    defaultTags: ["popular"],
    description: "Stability 图像模型系列，适合视觉创意和设计资产生成。",
  },
  {
    id: "runway",
    name: "Runway",
    provider: "runway",
    providerName: "Runway",
    productIconSrc: "/logos/model-series/runway.svg",
    productIconAlt: "Runway app icon",
    logoSrc: "/logos/model-series/runway.svg",
    logoAlt: "Runway series logo",
    aliases: ["runway", "gen-2", "gen-3"],
    defaultTags: ["new"],
    description: "Runway 视频模型系列，适合分镜、视频生成和创意工作流。",
  },
  {
    id: "pika",
    name: "Pika",
    provider: "pika",
    providerName: "Pika",
    productIconSrc: "/logos/model-series/pika.svg",
    productIconAlt: "Pika app icon",
    logoSrc: "/logos/model-series/pika.svg",
    logoAlt: "Pika series logo",
    aliases: ["pika"],
    defaultTags: ["new"],
    description: "Pika 视频模型系列，适合短视频生成和社媒创意内容。",
  },
  {
    id: "luma",
    name: "Luma",
    provider: "luma",
    providerName: "Luma AI",
    productIconSrc: "/logos/model-series/luma.svg",
    productIconAlt: "Luma app icon",
    logoSrc: "/logos/model-series/luma.svg",
    logoAlt: "Luma series logo",
    aliases: ["luma", "ray"],
    defaultTags: ["featured", "new"],
    description: "Luma 视频模型系列，适合高质量视觉故事板和视频片段生成。",
  },
  {
    id: "other",
    name: "其他",
    provider: "other",
    providerName: "Other",
    productIconSrc: "/logos/model-series/other.svg",
    productIconAlt: "AI app icon",
    logoSrc: "/logos/model-series/other.svg",
    logoAlt: "AI model series logo",
    aliases: ["other", "provider", "model", "bge", "baai", "cohere", "jina", "baidu", "ernie", "zhipu", "glm", "embedding", "rerank"],
    defaultTags: ["recommended"],
    description: "未归入主流系列的模型，包含 Embedding、重排序和其他专用能力。",
  },
];

export const defaultModelIcon: ModelIcon = {
  label: "默认模型",
  src: "/logos/model-series/other.svg",
  alt: "Default model icon",
};

export const modelIconRules: ModelIconRule[] = [
  {
    label: "GPT / ChatGPT",
    src: "/logos/model-series/chatgpt.svg",
    alt: "GPT ChatGPT model icon",
    seriesIds: ["chatgpt"],
    keywords: [
      "gpt",
      "chatgpt",
      "gpt-4o",
      "gpt-4 turbo",
      "gpt-5",
      "gpt-4.1",
      "gpt-4",
      "gpt-3.5",
      "o1",
      "o3",
      "o4",
      "text-embedding-3",
      "text-embedding",
      "openai",
    ],
    sourceNames: ["GPT-4o", "GPT-4 Turbo"],
  },
  {
    label: "Claude",
    src: "/logos/model-series/claude.svg",
    alt: "Claude model icon",
    seriesIds: ["claude"],
    keywords: ["claude", "opus", "sonnet", "haiku", "anthropic"],
    sourceNames: ["Claude 3 Opus"],
  },
  {
    label: "Gemini",
    src: "/logos/model-series/gemini.svg",
    alt: "Gemini model icon",
    seriesIds: ["gemini"],
    keywords: ["gemini", "google"],
    sourceNames: ["Gemini 1.5 Pro"],
  },
  {
    label: "Llama",
    src: "/logos/model-series/llama.svg",
    alt: "Llama model icon",
    seriesIds: ["llama"],
    keywords: ["llama", "meta"],
    sourceNames: ["Llama 3 70B"],
  },
  {
    label: "Qwen / 通义千问",
    src: "/logos/model-series/qwen.svg",
    alt: "Qwen Tongyi model icon",
    seriesIds: ["qwen"],
    keywords: ["qwen", "通义", "通义千问", "tongyi", "alibaba", "aliyun", "阿里", "dashscope"],
    sourceNames: ["Qwen 1.5 110B"],
  },
  {
    label: "Mistral",
    src: "/logos/model-series/mistral.svg",
    alt: "Mistral model icon",
    seriesIds: ["mistral"],
    keywords: ["mistral", "mixtral", "codestral"],
    sourceNames: ["Mistral Large 2"],
  },
  {
    label: "Grok",
    src: "/logos/model-series/grok.svg",
    alt: "Grok model icon",
    seriesIds: ["grok"],
    keywords: ["grok", "xai", "x.ai"],
    sourceNames: ["Grok-1.5"],
  },
  {
    label: "DeepSeek",
    src: "/logos/model-series/deepseek.svg",
    alt: "DeepSeek model icon",
    seriesIds: ["deepseek"],
    keywords: [
      "deepseek",
      "deepseek-v2",
      "deepseek-v2.5",
      "deepseek-v3",
      "deepseek-v4",
      "deepseek-v4-pro",
      "deepseek-chat",
      "deepseek-reasoner",
      "deepseek-r1",
    ],
    sourceNames: ["DeepSeek-V2", "DeepSeek-V2.5"],
  },
  {
    label: "Kimi",
    src: "/logos/model-series/kimi.svg",
    alt: "Kimi model icon",
    seriesIds: ["kimi"],
    keywords: ["kimi", "moonshot", "月之暗面"],
    sourceNames: ["Kimi 智能助手"],
  },
  {
    label: "MiniMax",
    src: "/logos/model-series/minimax.svg",
    alt: "MiniMax model icon",
    seriesIds: ["minimax"],
    keywords: ["minimax", "mini max", "abab", "hailuo", "海螺"],
    sourceNames: ["MINIMAX"],
  },
  {
    label: "智谱 / GLM",
    src: "/logos/model-series/glm.svg",
    alt: "Zhipu GLM model icon",
    seriesIds: ["glm"],
    keywords: ["glm", "chatglm", "zhipu", "z.ai", "zai", "智谱", "智谱清言"],
    sourceNames: ["智谱·AI"],
  },
  {
    label: "Stability",
    src: "/logos/model-series/stability.svg",
    alt: "Stability model icon",
    seriesIds: ["stability"],
    keywords: ["stability", "stable diffusion", "stable-diffusion", "sdxl", "stable-image"],
    sourceNames: ["Stable Diffusion"],
  },
  {
    label: "Runway",
    src: "/logos/model-series/runway.svg",
    alt: "Runway model icon",
    seriesIds: ["runway"],
    keywords: ["runway", "gen-2", "gen-3", "gen3"],
    sourceNames: ["Runway"],
  },
  {
    label: "Pika",
    src: "/logos/model-series/pika.svg",
    alt: "Pika model icon",
    seriesIds: ["pika"],
    keywords: ["pika"],
    sourceNames: ["Pika"],
  },
  {
    label: "Luma",
    src: "/logos/model-series/luma.svg",
    alt: "Luma model icon",
    seriesIds: ["luma"],
    keywords: ["luma", "ray"],
    sourceNames: ["Luma"],
  },
  {
    label: "BGE / BAAI",
    src: "/logos/model-series/other.svg",
    alt: "BGE model icon",
    seriesIds: [],
    keywords: ["bge", "baai", "reranker", "rerank"],
    sourceNames: ["BGE Reranker"],
  },
];

export function getModelIconBySeries(seriesId: ModelSeriesId): ModelIcon {
  return modelIconRules.find((rule) => rule.seriesIds.includes(seriesId)) ?? defaultModelIcon;
}

export function resolveModelIcon({
  seriesId,
  name,
  displayName,
  providerName,
  provider,
  supplierName,
  upstreamModel,
  description,
}: {
  seriesId?: ModelSeriesId;
  name?: string | null;
  displayName?: string | null;
  providerName?: string | null;
  provider?: string | null;
  supplierName?: string | null;
  upstreamModel?: string | null;
  description?: string | null;
}): ModelIcon {
  const source = [name, displayName, upstreamModel, providerName, provider, supplierName, description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const keywordMatchedIcon = source.trim()
    ? modelIconRules.find((rule) => rule.keywords.some((keyword) => source.includes(keyword.toLowerCase())))
    : undefined;

  if (keywordMatchedIcon) {
    return keywordMatchedIcon;
  }

  if (seriesId && seriesId !== "other") {
    return getModelIconBySeries(seriesId);
  }

  return defaultModelIcon;
}

export function getModelIcon(model: Parameters<typeof resolveModelIcon>[0]): ModelIcon {
  return resolveModelIcon(model);
}

export function getModelSeries(...values: Array<string | null | undefined>): ModelSeriesId {
  return resolveModelSeriesId(...values);
}

export const capabilityLabels: Record<ModelCapability, string> = {
  text: "文本模型",
  image: "图像模型",
  video: "视频模型",
  audio: "音频模型",
  multimodal: "多模态模型",
  rerank: "重排序模型",
  embedding: "Embedding 模型",
  code: "代码模型",
};

export const platformTagLabels: Record<ModelPlatformTag, string> = {
  featured: "主推",
  discount: "特价",
  new: "新上线",
  popular: "热门",
  connected: "已接入",
  recommended: "推荐",
};

export const compactCapabilityLabels: Record<ModelCapability, string> = {
  text: "文本",
  image: "视觉识别",
  video: "视频",
  audio: "音频",
  multimodal: "视觉识别",
  rerank: "重排序",
  embedding: "向量",
  code: "代码",
};

export const compactPlatformTagLabels: Record<ModelPlatformTag, string> = {
  featured: "旗舰",
  discount: "特价",
  new: "新上线",
  popular: "热门",
  connected: "已接入",
  recommended: "高级",
};

export const capabilityOrder: ModelCapability[] = [
  "text",
  "multimodal",
  "code",
  "image",
  "video",
  "audio",
  "embedding",
  "rerank",
];

export const platformTagOrder: ModelPlatformTag[] = [
  "featured",
  "popular",
  "recommended",
  "new",
  "discount",
  "connected",
];

export const modelCatalog: CatalogModel[] = [
  {
    id: "deepseek-chat",
    name: "deepseek-chat",
    displayName: "DeepSeek Chat",
    provider: "deepseek",
    providerName: "DeepSeek",
    description: "适合通用问答、写作、代码和轻量分析的高性价比文本模型。",
    capabilities: ["text", "code"],
    tags: ["featured", "connected", "discount"],
    inputPrice: "¥0.02 / 1K tokens",
    outputPrice: "¥0.02 / 1K tokens",
    contextLength: "64K",
    supports: { streaming: true, functionCalling: true, longContext: true },
  },
  {
    id: "deepseek-reasoner",
    name: "deepseek-reasoner",
    displayName: "DeepSeek Reasoner",
    provider: "deepseek",
    providerName: "DeepSeek",
    description: "面向复杂推理、规划和多步骤问题的推理模型。",
    capabilities: ["text", "code"],
    tags: ["recommended", "connected", "popular"],
    inputPrice: "¥0.02 / 1K tokens",
    outputPrice: "¥0.02 / 1K tokens",
    contextLength: "64K",
    supports: { streaming: true, functionCalling: true, longContext: true },
  },
  {
    id: "gpt-4o",
    name: "gpt-4o",
    displayName: "GPT-4o",
    provider: "openai",
    providerName: "OpenAI",
    description: "通用多模态模型，适合文本、图片理解、工具调用和生产级助手。",
    capabilities: ["text", "multimodal", "code"],
    tags: ["popular", "recommended"],
    contextLength: "128K",
    supports: { streaming: true, imageInput: true, functionCalling: true, longContext: true },
  },
  {
    id: "gpt-4o-mini",
    name: "gpt-4o-mini",
    displayName: "GPT-4o mini",
    provider: "openai",
    providerName: "OpenAI",
    description: "轻量多模态模型，适合高频调用、低延迟聊天和自动化任务。",
    capabilities: ["text", "multimodal"],
    tags: ["discount", "popular"],
    contextLength: "128K",
    supports: { streaming: true, imageInput: true, functionCalling: true, longContext: true },
  },
  {
    id: "claude-3-5-sonnet",
    name: "claude-3.5-sonnet",
    displayName: "Claude 3.5 Sonnet",
    provider: "anthropic",
    providerName: "Anthropic",
    description: "适合高质量写作、代码理解、分析和企业级文档处理。",
    capabilities: ["text", "code", "multimodal"],
    tags: ["popular", "recommended"],
    contextLength: "200K",
    supports: { streaming: true, imageInput: true, functionCalling: true, longContext: true },
  },
  {
    id: "gemini-1-5-pro",
    name: "gemini-1.5-pro",
    displayName: "Gemini 1.5 Pro",
    provider: "google",
    providerName: "Google",
    description: "长上下文多模态模型，适合大文档、代码库和多媒体理解。",
    capabilities: ["text", "multimodal", "code"],
    tags: ["featured", "popular"],
    contextLength: "1M+",
    supports: { streaming: true, imageInput: true, functionCalling: true, longContext: true },
  },
  {
    id: "llama-3-1-70b",
    name: "llama-3.1-70b",
    displayName: "Llama 3.1 70B",
    provider: "meta",
    providerName: "Meta",
    description: "开源生态常用大模型，适合私有化评估、文本生成和代码任务。",
    capabilities: ["text", "code"],
    tags: ["popular"],
    contextLength: "128K",
    supports: { streaming: true, longContext: true },
  },
  {
    id: "grok-2",
    name: "grok-2",
    displayName: "Grok 2",
    provider: "xai",
    providerName: "xAI",
    description: "适合实时信息理解、问答和通用内容生成的对话模型。",
    capabilities: ["text"],
    tags: ["new"],
    supports: { streaming: true, functionCalling: true },
  },
  {
    id: "mistral-large",
    name: "mistral-large",
    displayName: "Mistral Large",
    provider: "mistral",
    providerName: "Mistral",
    description: "面向推理、代码和多语言任务的通用高性能模型。",
    capabilities: ["text", "code"],
    tags: ["recommended"],
    contextLength: "128K",
    supports: { streaming: true, functionCalling: true, longContext: true },
  },
  {
    id: "qwen-max",
    name: "qwen-max",
    displayName: "Qwen Max",
    provider: "qwen",
    providerName: "Qwen / 阿里",
    description: "中文与多语言能力均衡，适合内容生成、企业知识问答和代码任务。",
    capabilities: ["text", "code"],
    tags: ["recommended", "popular"],
    contextLength: "32K",
    supports: { streaming: true, functionCalling: true },
  },
  {
    id: "moonshot-v1-128k",
    name: "moonshot-v1-128k",
    displayName: "Moonshot Kimi 128K",
    provider: "moonshot",
    providerName: "Moonshot / Kimi",
    description: "适合长文档阅读、总结、抽取和知识库问答的长上下文模型。",
    capabilities: ["text"],
    tags: ["popular", "recommended"],
    contextLength: "128K",
    supports: { streaming: true, longContext: true },
  },
  {
    id: "minimax-abab",
    name: "abab6.5s-chat",
    displayName: "MiniMax Chat",
    provider: "minimax",
    providerName: "MiniMax",
    description: "适合中文对话、角色交互和内容生成的聊天模型。",
    capabilities: ["text", "audio"],
    tags: ["new"],
    supports: { streaming: true },
  },
  {
    id: "glm-4-5",
    name: "glm-4.5",
    displayName: "GLM-4.5",
    provider: "other",
    providerName: "Z.ai",
    series: "glm",
    description: "Z.ai / GLM 系列通用模型，适合中文、多语言、推理、代码和工具调用场景。",
    capabilities: ["text", "code"],
    tags: ["recommended", "new"],
    supports: { streaming: true, functionCalling: true, longContext: true },
  },
  {
    id: "text-embedding-3-large",
    name: "text-embedding-3-large",
    displayName: "Text Embedding 3 Large",
    provider: "openai",
    providerName: "OpenAI",
    description: "用于检索、语义搜索、知识库和聚类分析的向量模型。",
    capabilities: ["embedding"],
    tags: ["connected", "recommended"],
    supports: {},
  },
  {
    id: "bge-reranker-large",
    name: "bge-reranker-large",
    displayName: "BGE Reranker Large",
    provider: "other",
    providerName: "Other",
    description: "用于 RAG 检索结果重排序，提升问答准确率和相关性。",
    capabilities: ["rerank"],
    tags: ["recommended"],
    supports: {},
  },
  {
    id: "stable-diffusion-xl",
    name: "stable-diffusion-xl",
    displayName: "Stable Diffusion XL",
    provider: "stability",
    providerName: "Stability",
    description: "面向图片生成、视觉创意和设计资产生产的图像模型。",
    capabilities: ["image"],
    tags: ["popular"],
    supports: {},
  },
  {
    id: "runway-gen-3",
    name: "runway-gen-3",
    displayName: "Runway Gen-3",
    provider: "runway",
    providerName: "Runway",
    description: "面向视频生成、分镜探索和创意视频工作流的视频模型。",
    capabilities: ["video"],
    tags: ["new"],
    supports: {},
  },
  {
    id: "pika-video",
    name: "pika-video",
    displayName: "Pika Video",
    provider: "pika",
    providerName: "Pika",
    description: "适合短视频生成、动态创意和社媒内容的视频生成模型。",
    capabilities: ["video"],
    tags: ["new"],
    supports: {},
  },
  {
    id: "luma-ray",
    name: "luma-ray",
    displayName: "Luma Ray",
    provider: "luma",
    providerName: "Luma",
    description: "适合高质量视频片段生成和视觉故事板探索的视频模型。",
    capabilities: ["video"],
    tags: ["featured", "new"],
    supports: {},
  },
];

export function getProviderById(providerId: ModelProviderId) {
  return modelProviders.find((provider) => provider.id === providerId) ?? modelProviders[modelProviders.length - 1];
}

export function getSeriesById(seriesId: ModelSeriesId) {
  return modelSeriesList.find((series) => series.id === seriesId) ?? modelSeriesList[modelSeriesList.length - 1];
}

export function resolveModelProviderId(...values: Array<string | null | undefined>): ModelProviderId {
  const source = values.filter(Boolean).join(" ").toLowerCase();

  if (!source.trim()) {
    return "other" satisfies ModelProviderId;
  }

  return (
    modelProviders.find((provider) => provider.aliases.some((alias) => source.includes(alias.toLowerCase())))?.id ??
    ("other" satisfies ModelProviderId)
  );
}

export function resolveModelSeriesId(...values: Array<string | null | undefined>): ModelSeriesId {
  const source = values.filter(Boolean).join(" ").toLowerCase();

  if (!source.trim()) {
    return "other" satisfies ModelSeriesId;
  }

  return (
    modelSeriesList.find((series) => series.aliases.some((alias) => source.includes(alias.toLowerCase())))?.id ??
    ("other" satisfies ModelSeriesId)
  );
}
