export const languages = [
  { code: "zh", label: "简体中文", shortLabel: "中文", dir: "ltr" },
  { code: "en", label: "English", shortLabel: "EN", dir: "ltr" },
  { code: "ja", label: "日本語", shortLabel: "日本語", dir: "ltr" },
  { code: "ko", label: "한국어", shortLabel: "한국어", dir: "ltr" },
  { code: "es", label: "Español", shortLabel: "ES", dir: "ltr" },
  { code: "fr", label: "Français", shortLabel: "FR", dir: "ltr" },
  { code: "de", label: "Deutsch", shortLabel: "DE", dir: "ltr" },
  { code: "pt", label: "Português", shortLabel: "PT", dir: "ltr" },
  { code: "ru", label: "Русский", shortLabel: "RU", dir: "ltr" },
  { code: "ar", label: "العربية", shortLabel: "AR", dir: "rtl" },
] as const;

export type LanguageCode = (typeof languages)[number]["code"];
export type Direction = (typeof languages)[number]["dir"];

export const defaultLanguage: LanguageCode = "zh";
export const languageStorageKey = "eelapi-language";
export const languageChangeEventName = "eelapi-language-change";

type TextBlock = {
  title: string;
  desc: string;
};

type FeatureBlock = TextBlock & {
  icon:
    | "code"
    | "database"
    | "receipt"
    | "key"
    | "message"
    | "settings"
    | "layers"
    | "gauge"
    | "activity"
    | "wallet"
    | "users"
    | "building"
    | "card"
    | "file"
    | "life"
    | "mail"
    | "briefcase"
    | "clock";
};

type PricingPlan = {
  name: string;
  audience: string;
  price: string;
  billing: string;
  prepay: string;
  fit: string;
  desc: string;
  features: string[];
  highlighted?: boolean;
};

type PolicySection = {
  title: string;
  body: string[];
};

type PageHeroCopy = {
  eyebrow: string;
  title: string;
  desc: string;
};

export type MarketingCopy = {
  languageLabel: string;
  nav: {
    features: string;
    models?: string;
    pricing: string;
    docs: string;
    faq: string;
    about: string;
    contact: string;
    login: string;
    start: string;
    dashboard: string;
  };
  footer: {
    product: string;
    resources: string;
    company: string;
    legal: string;
    supportEmail: string;
    supportFlow: string;
    description: string;
    copyright: string;
    tagline: string;
  };
  common: {
    primaryCta: string;
    pricingCta: string;
    viewDocs: string;
    pythonExample: string;
    legalSectionEyebrow: string;
  };
  home: {
    hero: PageHeroCopy & {
      promptPlaceholder: string;
      promptButton: string;
      promptHint: string;
      apiCta: string;
      dashboardCta: string;
      chips: Array<{ label: string; href: string; prompt: string }>;
    };
    stats: Array<[string, string]>;
    capabilitiesHeading: PageHeroCopy;
    startHeading: PageHeroCopy;
    useCasesHeading: PageHeroCopy;
    billingHeading: PageHeroCopy;
    whyHeading: PageHeroCopy;
    docsHeading: PageHeroCopy;
    cta: PageHeroCopy & { signup: string; login: string; pricing: string };
  };
  capabilities: FeatureBlock[];
  startSteps: FeatureBlock[];
  useCases: TextBlock[];
  billingNotes: TextBlock[];
  whyItems: TextBlock[];
  pricingPlans: PricingPlan[];
  featureDetails: FeatureBlock[];
  trustItems: FeatureBlock[];
  pages: {
    features: {
      hero: PageHeroCopy;
      heading: PageHeroCopy;
      scenarios: TextBlock[];
    };
    pricing: {
      hero: PageHeroCopy;
      plansHeading: PageHeroCopy;
      notes: TextBlock[];
      logicHeading: PageHeroCopy;
      logicItems: TextBlock[];
      billingLabel: string;
      prepayLabel: string;
      fitLabel: string;
    };
    docs: {
      hero: PageHeroCopy;
      heading: PageHeroCopy;
      bullets: string[];
      codeTitle: string;
    };
    about: {
      hero: PageHeroCopy;
      positioning: PageHeroCopy;
      introCards: TextBlock[];
      audienceHeading: PageHeroCopy;
      audience: TextBlock[];
      focusItems: TextBlock[];
      trustHeading: PageHeroCopy;
    };
    contact: {
      hero: PageHeroCopy;
      heading: PageHeroCopy;
      items: FeatureBlock[];
      processHeading: PageHeroCopy;
      process: TextBlock[];
      scopeTitle: string;
      scopeDesc: string;
    };
    faq: {
      hero: PageHeroCopy;
      heading: PageHeroCopy;
      items: Array<{ question: string; answer: string }>;
    };
    terms: {
      hero: PageHeroCopy;
      heading: string;
      sections: PolicySection[];
    };
    privacy: {
      hero: PageHeroCopy;
      heading: string;
      sections: PolicySection[];
    };
    refund: {
      hero: PageHeroCopy;
      heading: PageHeroCopy;
      sections: PolicySection[];
    };
  };
};

export function getLanguageMeta(code: LanguageCode) {
  return languages.find((language) => language.code === code) ?? languages[0];
}

const zh: MarketingCopy = {
  languageLabel: "语言",
  nav: {
    features: "功能",
    models: "模型",
    pricing: "价格",
    docs: "接入代码 / 文档",
    faq: "常见问题",
    about: "关于我们",
    contact: "联系我们",
    login: "登录",
    start: "开始使用",
    dashboard: "进入控制台",
  },
  footer: {
    product: "产品",
    resources: "资源",
    company: "公司",
    legal: "法律与政策",
    supportEmail: "支持邮箱",
    supportFlow: "支持流程",
    description:
      "电鳗 eelapi 是面向开发者、团队和企业的 AI API 聚合接入平台，提供统一接入、模型管理、用量统计和账户账单能力。",
    copyright: "Copyright © 2026 电鳗 eelapi. 保留所有权利。",
    tagline: "AI API 聚合接入、用量管理与开发者工具平台。",
  },
  common: {
    primaryCta: "开始使用",
    pricingCta: "查看价格",
    viewDocs: "查看文档",
    pythonExample: "Python 示例",
    legalSectionEyebrow: "法律与政策",
  },
  home: {
    hero: {
      eyebrow: "Developer-first AI API platform",
      title: "一个 API，接入多模型",
      desc: "电鳗 eelapi 为开发者和团队提供统一模型接入、API Key 管理、用量统计与余额账单能力。",
      promptPlaceholder: "询问模型、计费或 API 接入问题",
      promptButton: "发送",
      promptHint: "问题会带入 AI 聊天；未登录时先登录再继续。",
      apiCta: "接入文档",
      dashboardCta: "控制台",
      chips: [
        { label: "接入 OpenAI 兼容接口", href: "/docs", prompt: "如何接入 OpenAI 兼容接口？" },
        { label: "查看用量和账单", href: "/faq", prompt: "如何查看用量和账单？" },
        { label: "创建 API Key", href: "/docs", prompt: "如何创建 API Key？" },
        { label: "PayPal 和余额计费有什么区别", href: "/faq", prompt: "PayPal 和账户余额计费有什么区别？" },
      ],
    },
    stats: [
      ["已接入模型", "19+"],
      ["模型系列", "15+"],
      ["核心模块", "8+"],
      ["接入方式", "OpenAI 兼容"],
    ],
    capabilitiesHeading: {
      eyebrow: "核心能力",
      title: "面向开发者的产品能力",
      desc: "围绕接入、调试、密钥、模型、用量和账单组织信息，减少在多个系统之间来回切换。",
    },
    startHeading: {
      eyebrow: "开始使用",
      title: "从 API Key 到稳定调用",
      desc: "注册账号、创建 Key、选择模型、发起请求，再通过用量记录核对费用和余额变化。",
    },
    useCasesHeading: {
      eyebrow: "使用场景",
      title: "服务真实业务中的 AI API 接入需求",
      desc: "面向需要稳定调用、清晰账单和统一管理的应用团队，突出 API 接入、用量管理和账户账单能力。",
    },
    billingHeading: {
      eyebrow: "计费与账户说明",
      title: "余额、用量和账单在同一处",
      desc: "充值用于补充账户余额，费用来自模型调用和用量记录。账单信息与开发者工作流保持一致。",
    },
    whyHeading: {
      eyebrow: "为什么选择 eelapi",
      title: "更适合长期运营的开发者 SaaS 基础设施",
      desc: "平台围绕 API 接入、模型管理、账单统计和支持流程建设，帮助用户和审核人员清楚理解网站用途。",
    },
    docsHeading: {
      eyebrow: "接入代码 / 文档",
      title: "用开发者熟悉的方式调用 AI 模型",
      desc: "控制台内提供 API Key、模型列表和接口调试。公开文档页面提供基础接入说明，便于团队评估技术路径。",
    },
    cta: {
      eyebrow: "开始使用 eelapi",
      title: "开始管理你的 AI API 调用",
      desc: "注册后可创建 API Key、验证模型调用、查看用量，并在账户账单中补充余额。",
      signup: "注册 / 开始使用",
      login: "登录控制台",
      pricing: "查看价格",
    },
  },
  capabilities: [
    { icon: "code", title: "统一 API 接入", desc: "提供统一 Base URL 与 OpenAI 兼容调用方式，帮助开发者用更少改造接入不同模型能力。" },
    { icon: "database", title: "多模型管理", desc: "在控制台维护模型别名、供应商线路、显示名称与价格配置，方便团队统一管理可用模型。" },
    { icon: "receipt", title: "用量与账单统计", desc: "记录请求状态、token 用量、模型、费用和时间，账户余额只是账单结算的一部分。" },
    { icon: "key", title: "API Key 管理", desc: "用户可以创建、查看和撤销 API Key，平台仅展示 Key 前缀，减少密钥泄露风险。" },
    { icon: "message", title: "接口调试与开发者友好", desc: "内置接口调试台和接入代码示例，便于开发、调试和验证模型返回效果。" },
    { icon: "settings", title: "团队与后台管理", desc: "管理员可处理模型、供应商、用户、充值审核、财务统计和异常请求，支持持续运营。" },
  ],
  startSteps: [
    { icon: "users", title: "注册账号", desc: "使用邮箱创建账户并进入控制台，后续 API Key、用量和账单都与账户关联。" },
    { icon: "key", title: "创建 API Key", desc: "在控制台生成密钥并妥善保存，平台仅展示 Key 前缀用于识别和排查。" },
    { icon: "code", title: "接入模型 / 开始调用", desc: "选择模型名称，按文档示例配置统一接口地址和鉴权信息，并在应用中开始调用模型能力。" },
    { icon: "receipt", title: "查看用量、账单与账户余额", desc: "通过用量记录查看请求状态、模型、token、费用、时间和账户余额变化，便于团队核对账单。" },
  ],
  useCases: [
    { title: "AI 聊天应用", desc: "为客服、知识库助手、内容生成和对话式产品提供统一模型入口、API Key 管理和用量记录。" },
    { title: "自动化工作流", desc: "把模型能力接入摘要、分类、质检、数据处理等流程，并通过账单记录掌握每个项目的成本。" },
    { title: "企业内部工具", desc: "适合内部运营后台、低代码工具和团队系统，通过统一 API 接入减少重复配置和权限管理成本。" },
    { title: "开发者 API 接入", desc: "开发者可通过统一入口、模型列表和接入示例完成集成，并在控制台查看调用状态与费用。" },
  ],
  billingNotes: [
    { title: "支持预充值", desc: "用户可以通过控制台补充账户余额。余额用于后续 API 调用费用结算，属于账户账单功能的一部分。" },
    { title: "按量计费", desc: "平台依据模型、token 用量和价格配置记录费用，用户可在用量记录和账单中核对。" },
    { title: "账户余额补充", desc: "充值中心属于账户账单的一部分，用于补充余额并结算后续 API 调用费用。" },
    { title: "支付与审核清晰", desc: "PayPal 支付按支付结果处理；微信/支付宝充值通过人工审核确认到账，相关规则在退款政策中说明。" },
  ],
  whyItems: [
    { title: "接入简单", desc: "兼容 OpenAI 调用习惯，开发者可通过统一 Base URL 和 API Key 开始集成。" },
    { title: "管理方便", desc: "模型、API Key、供应商和账户记录集中管理，降低团队协作成本。" },
    { title: "计费清晰", desc: "按实际用量统计请求和费用，充值用于账户余额补充和后续结算。" },
    { title: "多种充值方式", desc: "支持 PayPal，以及微信/支付宝人工审核充值，便于不同客户完成账户结算。" },
  ],
  pricingPlans: [
    { name: "入门版", audience: "适合个人评估和接口验证", price: "按量计费", desc: "用于评估统一 API 接入、接口调试、模型选择和基础用量记录。", billing: "按实际模型调用量记录费用", prepay: "支持小额预充值补充账户余额", fit: "适合原型验证和低频调用", features: ["预充值账户余额", "基础 API Key 管理", "接口调试台", "用量记录查询"] },
    { name: "开发者版", audience: "适合个人开发者和小型项目", price: "按实际用量结算", desc: "面向持续开发和上线项目，支持更完整的模型、账单和密钥管理。", billing: "按 token、模型和价格配置形成账单记录", prepay: "余额用于后续 API 调用费用结算", fit: "适合个人开发、独立产品和小型团队项目", features: ["多模型统一调用", "按 token 统计费用", "充值作为余额补充方式", "请求日志和账单明细"], highlighted: true },
    { name: "团队版", audience: "适合团队和企业业务场景", price: "商务沟通", desc: "为多成员项目、内部系统和运营管理提供更完整的后台管理能力。", billing: "可结合团队使用方式做账单核对和运营管理", prepay: "支持按团队预算补充账户余额", fit: "适合企业内部工具、业务系统和多项目管理", features: ["团队账户与后台管理", "供应商线路管理", "财务和异常请求统计", "商务合作与支持"] },
  ],
  featureDetails: [
    { icon: "code", title: "统一 API 接入", desc: "通过统一入口调用不同模型，减少重复维护多个 SDK、密钥和上游地址的成本。" },
    { icon: "layers", title: "模型列表管理", desc: "管理员可以维护对外模型名称、上游模型名称、供应商、价格和启用状态。" },
    { icon: "key", title: "API Key 管理", desc: "用户可在控制台创建和撤销 API Key。系统保存 Key 哈希并展示前缀，用于识别请求和统计用量。" },
    { icon: "gauge", title: "接口调试", desc: "内置调试入口可帮助开发者验证模型、消息格式和响应结果，减少正式接入前的沟通成本。" },
    { icon: "activity", title: "使用记录", desc: "按请求记录模型、供应商、token、费用、状态、延迟和错误信息，便于理解消耗并排查异常。" },
    { icon: "wallet", title: "充值和账单", desc: "账户余额用于按量结算 API 使用费用。充值用于补充余额，支持 PayPal 与微信/支付宝人工审核流程。" },
    { icon: "users", title: "后台运营管理", desc: "管理员可查看用户、订单、财务统计、供应商状态和异常请求，支持长期运营。" },
  ],
  trustItems: [
    { icon: "building", title: "服务对象明确", desc: "面向开发者、产品团队、自动化团队和企业内部工具建设者。" },
    { icon: "card", title: "账单定位清楚", desc: "余额补充用于账户结算，充值功能服务于后续 API 调用费用管理。" },
    { icon: "file", title: "政策完整", desc: "提供服务条款、隐私政策和退款政策，方便客户与审核方了解规则。" },
    { icon: "life", title: "可联系支持", desc: "客户可通过 {email} 联系支持和商务合作。" },
  ],
  pages: {
    features: {
      hero: { eyebrow: "产品功能", title: "为 AI API 接入、管理和计费而设计的开发者平台", desc: "eelapi 将模型接入、密钥管理、接口调试、用量记录、账户余额和运营后台放在一个清晰的控制台里。" },
      heading: { eyebrow: "能力说明", title: "不只是调用入口，也包括持续运营所需的管理能力", desc: "以下能力用于让客户、开发者和审核人员理解平台服务内容。" },
      scenarios: [
        { title: "开发者接入", desc: "通过统一 API 地址和 API Key，把模型能力接入应用、工作流或内部系统。" },
        { title: "业务运营", desc: "通过用户、订单、用量、异常请求和供应商管理能力维护平台稳定运行。" },
        { title: "账户账单", desc: "按实际使用记录消耗，余额用于账户结算，方便团队掌握成本和充值状态。" },
      ],
    },
    pricing: {
      hero: { eyebrow: "价格与账单", title: "按实际使用结算，预充值用于账户余额补充", desc: "费用围绕 AI API 调用、模型用量和账户账单展开。用户可根据项目规模选择体验、开发者或团队使用方式。" },
      plansHeading: { eyebrow: "套餐", title: "适合不同阶段的 AI API 使用场景", desc: "页面展示的是产品使用方式说明。具体模型价格会根据控制台中的模型价格配置和实际调用量结算。" },
      notes: [
        { title: "是否按量计费", desc: "是。平台根据模型、token 用量和价格配置记录费用，用户可在控制台查看明细。" },
        { title: "是否支持预充值", desc: "是。预充值用于补充账户余额，余额用于后续 API 调用费用结算。" },
        { title: "充值定位", desc: "充值中心属于账户账单功能，用于补充余额并结算后续 API 调用费用。" },
      ],
      logicHeading: { eyebrow: "计费逻辑", title: "费用来自 API 调用记录，而不是账户余额本身", desc: "用户创建 API Key 并调用模型后，平台会根据模型价格、token 用量和请求状态生成用量记录。" },
      logicItems: [
        { title: "调试与验证", desc: "入门版适合验证接入方式、接口调试、模型选择和基础账单展示。" },
        { title: "个人开发", desc: "开发者版适合持续开发、上线小型产品，并按实际调用量核对费用。" },
        { title: "团队使用", desc: "团队版适合多个项目、内部工具或业务系统，需要后台运营和财务统计能力。" },
        { title: "企业沟通", desc: "如涉及更高调用量、供应商线路、对账或商务合作，可通过联系我们页面提交需求。" },
      ],
      billingLabel: "计费方式：",
      prepayLabel: "预充值：",
      fitLabel: "适用场景：",
    },
    docs: {
      hero: { eyebrow: "接入代码 / 文档", title: "通过统一 Base URL 和 API Key 接入 AI 模型", desc: "公开接入说明帮助团队评估技术路径。登录控制台后可以创建 API Key、查看模型列表、进行接口调试并跟踪用量记录。" },
      heading: { eyebrow: "基础说明", title: "兼容开发者熟悉的调用方式", desc: "使用前请先注册账号并在控制台创建 API Key。正式请求会根据模型价格和 token 用量记录费用。" },
      bullets: ["鉴权方式：在请求头中使用 Bearer API Key。", "模型名称：使用控制台模型列表中的对外模型名。", "账单记录：成功请求会进入用量记录，用于余额结算和成本追踪。", "接口调试：可在控制台先验证消息格式和模型响应。"],
      codeTitle: "Python 示例",
    },
    about: {
      hero: { eyebrow: "关于电鳗 eelapi", title: "专注 AI API 接入、用量管理和开发者工具体验", desc: "电鳗 eelapi 是面向开发者、团队和企业的 AI API 聚合接入平台。" },
      positioning: { eyebrow: "平台定位", title: "为 AI 应用团队提供清晰、可维护的 API 接入与账单管理能力", desc: "eelapi 将模型接入、密钥管理、调用记录、账户余额和后台运营放在同一套产品体系中。" },
      introCards: [
        { title: "我们是谁", desc: "电鳗 eelapi 是面向 AI API 使用场景的聚合接入与管理平台。" },
        { title: "我们服务谁", desc: "平台服务开发者、产品团队、自动化流程团队和企业内部工具团队。" },
        { title: "我们提供什么能力", desc: "统一 API 入口、模型列表、API Key 管理、接口调试、用量记录、账户账单和后台运营管理能力。" },
        { title: "我们重视什么", desc: "接入效率、账单清晰、开发者体验和运营管理。" },
      ],
      audienceHeading: { eyebrow: "服务对象", title: "面向需要稳定接入和清楚账单的团队", desc: "eelapi 是面向持续调用 AI API 的开发者平台，充值功能用于账户余额补充和后续调用费用结算。" },
      audience: [
        { title: "开发者", desc: "需要快速接入模型、管理 API Key、查看调用状态和调试接口的个人或小团队。" },
        { title: "产品团队", desc: "需要把 AI 聊天、内容生成、知识库或自动化能力接入产品的业务团队。" },
        { title: "自动化团队", desc: "需要在工作流中使用模型能力，并按项目核对调用量和费用的运营或技术团队。" },
        { title: "企业内部工具", desc: "需要为内部系统提供统一模型入口、账户账单和后台运营能力的企业团队。" },
      ],
      focusItems: [
        { title: "AI API 接入", desc: "提供统一入口和接入示例，降低模型服务切换和维护成本。" },
        { title: "模型调用管理", desc: "通过模型列表、供应商线路和后台配置维护可用模型和价格信息。" },
        { title: "用量统计", desc: "记录模型、token、费用、请求状态和时间，便于核对账单并排查异常。" },
        { title: "开发者工具体验", desc: "通过 API Key 管理、接口调试和文档入口，让接入流程更清楚。" },
      ],
      trustHeading: { eyebrow: "可信基础", title: "让客户和审核人员清楚理解平台业务", desc: "" },
    },
    contact: {
      hero: { eyebrow: "联系我们", title: "客户支持、商务合作和账户账单问题都可以通过邮箱联系", desc: "为了便于核验和处理，请在邮件中提供账号邮箱、问题描述、相关订单号或请求编号。" },
      heading: { eyebrow: "联系入口", title: "正式、可追踪的支持流程", desc: "当前使用统一支持邮箱作为联系入口，便于保留沟通记录并核对账号、订单、用量和支付状态。" },
      items: [
        { icon: "mail", title: "支持咨询", desc: "请发送邮件至 {email}，说明账号邮箱、问题类型和必要的订单或请求编号。" },
        { icon: "briefcase", title: "商务合作", desc: "如需团队使用、企业接入、模型供应商合作或对账相关沟通，可通过邮箱提交商务需求。" },
        { icon: "message", title: "问题反馈", desc: "如果遇到接口错误、模型调用异常、用量记录疑问或控制台操作问题，请提供复现步骤和截图。" },
        { icon: "clock", title: "回复时间", desc: "通常会在 1-2 个工作日内回复。涉及支付争议、账户安全或人工审核的事项可能需要更多核验时间。" },
      ],
      processHeading: { eyebrow: "联系流程", title: "为了更快处理，请在邮件中提供必要信息", desc: "清晰的信息有助于我们核验账号、订单、API Key 前缀和用量记录。" },
      process: [
        { title: "账号相关", desc: "请提供注册邮箱、问题类型和希望处理的账号事项。" },
        { title: "账单相关", desc: "请提供订单号、支付方式、支付时间、金额和账户邮箱。" },
        { title: "接口相关", desc: "请提供模型名称、请求时间、错误状态、request_id 或 API Key 前缀，不要发送完整 API Key。" },
        { title: "商务合作", desc: "请说明团队场景、预计调用量、合作需求和联系人信息。" },
      ],
      scopeTitle: "支持范围说明",
      scopeDesc: "我们可以协助处理账号登录、API Key、模型调用、用量记录、充值到账、PayPal 订单、微信/支付宝人工审核订单和政策说明。",
    },
    faq: {
      hero: { eyebrow: "常见问题", title: "关于接入、充值、到账和账单的常见问题", desc: "帮助快速理解 eelapi 的服务内容、账户账单方式和支持流程。" },
      heading: { eyebrow: "帮助中心", title: "常见问题", desc: "如果这里没有覆盖你的问题，可以通过联系我们页面或支持邮箱提交支持请求。" },
      items: [
        { question: "eelapi 是什么？", answer: "电鳗 eelapi 是面向开发者、团队和企业的 AI API 聚合接入平台，提供统一 API 接入、模型管理、API Key 管理、接口调试、用量记录和账户账单能力。" },
        { question: "如何开始接入？", answer: "注册账号，进入控制台创建 API Key，查看模型列表和接入文档，然后在应用中配置统一接口地址、模型名称和鉴权信息。" },
        { question: "如何创建 API Key？", answer: "登录控制台后，在 API Key 管理区域创建密钥。创建后请立即妥善保存完整 Key，平台后续通常只展示 Key 前缀。" },
        { question: "如何充值？", answer: "登录后可在控制台的账户账单或充值中心补充余额。平台支持 PayPal 支付，也支持微信/支付宝人工审核充值。" },
        { question: "PayPal 与微信/支付宝有什么区别？", answer: "PayPal 通常按支付捕获结果自动更新订单状态；微信/支付宝属于人工审核充值，需要管理员核对收款记录和付款凭证。" },
        { question: "充值后多久到账？", answer: "PayPal 订单通常在支付捕获成功后自动到账。微信/支付宝人工充值会在管理员确认收款和订单信息匹配后到账。" },
        { question: "如何查看用量和账单？", answer: "用户可以在控制台查看用量记录、充值记录和账户余额，核对模型、token、费用、请求状态和 request_id。" },
        { question: "如何联系支持？", answer: "请发送邮件至 {email}，并提供账号邮箱、问题描述、订单号、支付凭证、request_id 或 API Key 前缀。" },
        { question: "什么情况下可以退款？", answer: "重复充值、支付成功但平台无法提供对应服务、人工审核确认的错付或多付金额通常可以申请退款或余额调整。已正常消耗的 API 费用通常不退回。" },
      ],
    },
    terms: {
      hero: { eyebrow: "服务条款", title: "服务条款", desc: "本页面说明用户使用 eelapi 平台、API、控制台、账户余额和相关服务时的基本规则。" },
      heading: "服务条款内容",
      sections: [
        { title: "1. 服务说明", body: ["eelapi 提供 AI API 聚合接入、模型管理、API Key 管理、接口调试、用量记录、账户余额和后台运营相关工具。", "平台主要服务是帮助用户以统一方式接入和管理 AI API。充值功能用于账户余额补充和后续 API 使用费用结算。"] },
        { title: "2. 账号与访问", body: ["用户应使用真实、可联系的邮箱注册账号，并妥善保管登录凭据和 API Key。", "因用户主动泄露、共享或在不安全环境中使用 API Key 导致的请求和费用，由用户自行承担。"] },
        { title: "3. API 使用规则", body: ["用户应遵守适用法律法规、上游模型服务规则以及平台公布的接口限制。", "平台可基于安全、风控、异常请求、欠费或违规原因限制相关账号或 API Key 的访问。"] },
        { title: "4. 费用与账单", body: ["平台按照模型、token 用量、请求记录和价格配置计算费用。", "余额消耗与 API 调用记录、模型价格和请求状态相关。"] },
        { title: "5. 支付与充值处理", body: ["PayPal 支付会根据订单和捕获结果更新状态；微信/支付宝充值需要人工审核后确认到账。", "平台可基于拒付、支付争议、涉嫌欺诈或安全风险暂停相关订单处理。"] },
        { title: "6. 联系方式", body: ["如对本条款、账号、账单或服务有疑问，请联系 {email}。"] },
      ],
    },
    privacy: {
      hero: { eyebrow: "隐私政策", title: "隐私政策", desc: "本政策说明 eelapi 如何处理账号、API 使用、账单、支付和安全日志相关信息。" },
      heading: "隐私政策内容",
      sections: [
        { title: "1. 我们收集的信息", body: ["账号信息包括注册邮箱、用户 ID、角色、创建时间和账户余额。", "API 使用信息包括 API Key 前缀、模型、供应商、token 用量、费用、请求状态和必要日志。", "订单与账单信息包括充值金额、支付方式、订单状态和人工审核记录。"] },
        { title: "2. 我们如何使用信息", body: ["用于提供统一 AI API 接入、API Key 管理、模型调用、接口调试、用量统计、余额结算和客户支持。", "用于排查错误、防止滥用、维护平台安全和处理争议。"] },
        { title: "3. API 内容与日志", body: ["平台重点记录计费、风控和排障所需的请求元数据。", "用户应避免在请求中提交不必要的敏感个人信息或商业秘密。"] },
        { title: "4. 信息共享与安全", body: ["为完成支付、模型调用、基础设施托管和客户支持，平台可能与必要服务提供商共享有限信息。", "平台采取合理的技术和管理措施保护账号、API Key、账单和日志数据。"] },
        { title: "5. 数据保留与联系", body: ["平台会在提供服务、账务核对、安全审计、争议处理和法律合规所需期间保留相关数据。", "如对隐私政策有疑问，请联系 {email}。"] },
      ],
    },
    refund: {
      hero: { eyebrow: "退款政策", title: "退款政策", desc: "本政策说明 PayPal 支付、微信/支付宝人工审核充值、余额到账、API 已消耗余额和争议处理方式。" },
      heading: { eyebrow: "退款政策", title: "账户余额、支付与退款处理规则", desc: "以下内容围绕 eelapi 当前业务流程编写，便于用户和审核人员理解充值、到账、消费和退款之间的关系。" },
      sections: [
        { title: "1. 适用范围", body: ["本政策适用于用户通过 eelapi 平台为账户余额进行的充值，以及由充值、到账、账单核对、API 使用或支付争议引发的退款处理。"] },
        { title: "2. PayPal 支付说明", body: ["PayPal 订单只有在支付捕获成功后才会被视为可到账订单。", "涉及 PayPal 拒付、撤销、争议或风控审核的订单，平台可能暂停对应余额使用。"] },
        { title: "3. 微信/支付宝人工审核充值说明", body: ["微信和支付宝充值为人工审核流程。审核通过前，订单金额不会计入可用余额。", "如付款信息不匹配、金额异常或凭证缺失，订单可能被延迟处理或拒绝。"] },
        { title: "4. 到账后余额规则", body: ["到账后的余额属于账户预付余额，用于按量结算后续 API 调用费用。", "用户可以在控制台查看充值记录、账户余额和用量记录。"] },
        { title: "5. API 已消耗余额的处理规则", body: ["已经产生正常 API 调用并形成用量记录的费用，通常视为已使用服务费用，不属于可退款余额。", "经核查确认为平台计费错误或系统异常导致的不应扣费，平台可通过余额返还、账单调整或退款方式处理。"] },
        { title: "6. 拒付/争议处理", body: ["争议处理期间，平台可能临时冻结相关余额、暂停部分账户功能或限制 API 调用。", "如果支付渠道最终确认拒付或撤销支付，平台可从账户余额中扣回对应金额。"] },
        { title: "7. 退款申请路径与处理时效", body: ["如需申请退款、余额调整或订单复核，请发送邮件至 {email}。", "请提供账号邮箱、平台订单号、支付渠道、支付时间、支付金额、PayPal 订单号或微信/支付宝转账截图、问题描述和期望处理方式。", "平台通常会在 1-3 个工作日内给出初步回复。经核验属于常规退款或余额调整的事项，通常会在确认后的 3-7 个工作日内提交处理。", "如申请退款的余额已经产生 API 消耗，平台会先根据用量日志核算已使用金额，剩余可退余额再按支付渠道规则处理。"] },
      ],
    },
  },
};

const en: MarketingCopy = {
  languageLabel: "Language",
  nav: {
    features: "Features",
    models: "Models",
    pricing: "Pricing",
    docs: "API docs",
    faq: "FAQ",
    about: "About",
    contact: "Contact",
    login: "Log in",
    start: "Get started",
    dashboard: "Open console",
  },
  footer: {
    product: "Product",
    resources: "Resources",
    company: "Company",
    legal: "Legal",
    supportEmail: "Support email",
    supportFlow: "Support process",
    description:
      "eelapi is an AI API aggregation and access platform for developers, teams, and businesses, with unified access, model management, usage tracking, and account billing.",
    copyright: "Copyright © 2026 eelapi. All rights reserved.",
    tagline: "AI API aggregation, usage management, and developer tooling.",
  },
  common: {
    primaryCta: "Get started",
    pricingCta: "View pricing",
    viewDocs: "View docs",
    pythonExample: "Python example",
    legalSectionEyebrow: "Legal",
  },
  home: {
    hero: {
      eyebrow: "Developer-first AI API platform",
      title: "One API for many AI models",
      desc: "eelapi gives developers and teams unified model access, API Key management, usage analytics, and clear balance-based billing.",
      promptPlaceholder: "Ask about models, billing, and API integration",
      promptButton: "Explore",
      promptHint: "Your question opens AI Chat. Sign in first when required, then continue naturally.",
      apiCta: "API docs",
      dashboardCta: "Console",
      chips: [
        { label: "OpenAI-compatible API", href: "/docs", prompt: "How do I connect the OpenAI-compatible API?" },
        { label: "View usage and billing", href: "/faq", prompt: "How do I view usage and billing?" },
        { label: "Create an API Key", href: "/docs", prompt: "How do I create an API Key?" },
        { label: "PayPal vs account balance", href: "/faq", prompt: "What is the difference between PayPal and account balance billing?" },
      ],
    },
    stats: [
      ["Connected models", "19+"],
      ["Model series", "15+"],
      ["Core modules", "8+"],
      ["API style", "OpenAI-compatible"],
    ],
    capabilitiesHeading: {
      eyebrow: "Core capabilities",
      title: "Developer platform capabilities",
      desc: "Access, request validation, keys, models, usage, and billing are organized around the way developers work.",
    },
    startHeading: {
      eyebrow: "Getting started",
      title: "From API Key to reliable calls",
      desc: "Create an account, generate a key, choose a model, send requests, then review usage, cost, and balance.",
    },
    useCasesHeading: {
      eyebrow: "Use cases",
      title: "Built for real AI API integration needs",
      desc: "For teams that need reliable calls, clear billing, and unified management across AI-powered applications.",
    },
    billingHeading: {
      eyebrow: "Billing and account",
      title: "Balance, usage, and billing in one place",
      desc: "Top-ups add balance. Costs come from model calls and usage records, keeping billing aligned with developer workflows.",
    },
    whyHeading: {
      eyebrow: "Why eelapi",
      title: "Developer SaaS infrastructure for long-term operations",
      desc: "eelapi is built around API access, model management, billing records, and support workflows so users and reviewers can understand the business clearly.",
    },
    docsHeading: {
      eyebrow: "API docs",
      title: "Call AI models in a familiar developer workflow",
      desc: "The console includes API Keys, model lists, and API debugging. Public docs provide a basic integration path for evaluation.",
    },
    cta: {
      eyebrow: "Start with eelapi",
      title: "Start managing AI API calls",
      desc: "Create API Keys, validate model calls, review usage, and add balance through account billing.",
      signup: "Sign up / Get started",
      login: "Log in",
      pricing: "View pricing",
    },
  },
  capabilities: [
    { icon: "code", title: "Unified API access", desc: "Use one Base URL and an OpenAI-compatible calling pattern to connect multiple model capabilities with less migration work." },
    { icon: "database", title: "Multi-model management", desc: "Maintain model aliases, providers, display names, and pricing configuration in one console." },
    { icon: "receipt", title: "Usage and billing analytics", desc: "Track request status, token usage, model, cost, and time. Balance is part of account settlement." },
    { icon: "key", title: "API Key management", desc: "Create, view, and revoke API Keys. eelapi only shows key prefixes to reduce secret exposure." },
    { icon: "message", title: "API debugging", desc: "Use built-in request validation and code examples to validate messages, models, and responses before production calls." },
    { icon: "settings", title: "Team and admin operations", desc: "Admins can manage models, providers, users, recharge reviews, finance stats, and abnormal requests." },
  ],
  startSteps: [
    { icon: "users", title: "Register an account", desc: "Create an account with email. API Keys, usage, and billing are associated with the account." },
    { icon: "key", title: "Create an API Key", desc: "Generate a key in the console, store it securely, and use the key prefix for identification and support." },
    { icon: "code", title: "Connect models / start calling", desc: "Choose a model name, configure the unified endpoint and auth header, then call model capabilities from your app." },
    { icon: "receipt", title: "Review usage, billing, and balance", desc: "Check request status, model, tokens, cost, time, and account balance changes in usage records." },
  ],
  useCases: [
    { title: "AI chat applications", desc: "Provide a unified model entry point, API Key management, and usage records for support bots, assistants, and content products." },
    { title: "Automation workflows", desc: "Add model capabilities to summarization, classification, QA, data processing, and cost tracking by project." },
    { title: "Internal business tools", desc: "Connect internal systems through one API and reduce repeated configuration and permission management." },
    { title: "Developer API access", desc: "Developers can integrate through one endpoint, model catalog, and examples, then review call status and cost." },
  ],
  billingNotes: [
    { title: "Prepaid balance supported", desc: "Users can add account balance in the console. Balance is used for future API usage settlement." },
    { title: "Usage-based billing", desc: "Costs are recorded based on model, token usage, and pricing configuration." },
    { title: "Account balance top-up", desc: "The recharge center is part of account billing and is used to add balance for API calls." },
    { title: "Clear payment review", desc: "PayPal follows payment results; WeChat/Alipay top-ups are confirmed through manual review." },
  ],
  whyItems: [
    { title: "Simple integration", desc: "Use OpenAI-compatible patterns, a unified Base URL, and API Keys to get started quickly." },
    { title: "Convenient management", desc: "Models, API Keys, providers, and account records are managed in one place." },
    { title: "Clear billing", desc: "Requests and costs are tracked by real usage; top-ups add account balance for settlement." },
    { title: "Multiple top-up options", desc: "Supports PayPal and manual WeChat/Alipay review for different customer workflows." },
  ],
  pricingPlans: [
    { name: "Starter", audience: "For individual evaluation and API validation", price: "Usage-based", desc: "Evaluate unified access, API debugging, model selection, and basic usage records.", billing: "Costs are recorded by actual model usage", prepay: "Small prepaid balance supported", fit: "Prototypes, validation, and low-frequency calls", features: ["Prepaid account balance", "Basic API Key management", "API debugging", "Usage records"] },
    { name: "Developer", audience: "For individual developers and small projects", price: "Usage-based settlement", desc: "For ongoing development and production projects that need stronger model, billing, and key management.", billing: "Records based on tokens, models, and pricing configuration", prepay: "Balance pays for future API calls", fit: "Personal projects, indie products, and small teams", features: ["Unified multi-model calling", "Token-based cost records", "Balance top-ups", "Request logs and billing details"], highlighted: true },
    { name: "Team", audience: "For teams and business scenarios", price: "Contact sales", desc: "For multi-member projects, internal systems, and operational management.", billing: "Supports team usage review and operations", prepay: "Balance can be added by team budget", fit: "Internal tools, business systems, and multi-project management", features: ["Team and admin management", "Provider route management", "Finance and abnormal request stats", "Business support"] },
  ],
  featureDetails: [
    { icon: "code", title: "Unified API access", desc: "Call different models through one endpoint and reduce the cost of maintaining multiple SDKs, keys, and upstream URLs." },
    { icon: "layers", title: "Model catalog management", desc: "Manage public model names, upstream names, providers, prices, and enabled status." },
    { icon: "key", title: "API Key management", desc: "Create and revoke API Keys. The system stores hashes and shows prefixes for request identification and usage tracking." },
    { icon: "gauge", title: "API debugging", desc: "Validate models, message formats, and responses before production integration." },
    { icon: "activity", title: "Usage records", desc: "Record model, provider, tokens, cost, status, latency, and errors for billing and troubleshooting." },
    { icon: "wallet", title: "Recharge and billing", desc: "Account balance settles API usage. Top-ups add balance through PayPal or manual WeChat/Alipay review." },
    { icon: "users", title: "Admin operations", desc: "Admins can review users, orders, finance stats, providers, and abnormal requests for long-term operations." },
  ],
  trustItems: [
    { icon: "building", title: "Clear audience", desc: "Built for developers, product teams, automation teams, and internal tool builders." },
    { icon: "card", title: "Clear billing role", desc: "Balance top-ups support future API usage settlement." },
    { icon: "file", title: "Complete policies", desc: "Terms, privacy policy, and refund policy are available for users and reviewers." },
    { icon: "life", title: "Reachable support", desc: "Customers can contact support and business cooperation through {email}." },
  ],
  pages: {
    features: {
      hero: { eyebrow: "Product features", title: "A developer platform for AI API access, management, and billing", desc: "eelapi brings model access, key management, API debugging, usage records, balance, and operations into a clear console." },
      heading: { eyebrow: "Capabilities", title: "More than an API gateway: management for ongoing operations", desc: "These capabilities explain the service to customers, developers, and reviewers." },
      scenarios: [
        { title: "Developer integration", desc: "Connect model capabilities to apps, workflows, or internal systems through one API and API Key." },
        { title: "Business operations", desc: "Maintain stable operations with user, order, usage, provider, and abnormal request management." },
        { title: "Account billing", desc: "Usage records consume balance, helping teams understand cost and top-up status." },
      ],
    },
    pricing: {
      hero: { eyebrow: "Pricing and billing", title: "Usage-based settlement with prepaid account balance", desc: "Costs are based on AI API calls, model usage, and account billing. Choose a usage mode by project stage." },
      plansHeading: { eyebrow: "Plans", title: "For different AI API usage stages", desc: "Model prices are settled by the console pricing configuration and actual usage." },
      notes: [
        { title: "Usage-based billing?", desc: "Yes. Costs are recorded from models, token usage, and pricing configuration." },
        { title: "Prepaid balance?", desc: "Yes. Prepaid balance is used to pay for future API calls." },
        { title: "Top-up role", desc: "The recharge center is an account billing function for adding balance and settling future API usage." },
      ],
      logicHeading: { eyebrow: "Billing logic", title: "Costs come from API usage records, not balance itself", desc: "After calls are made, eelapi records costs based on model price, token usage, and request status." },
      logicItems: [
        { title: "Validation", desc: "Starter usage validates integration, model choice, API debugging, and basic billing." },
        { title: "Individual development", desc: "Developer usage supports ongoing product development and cost review." },
        { title: "Team usage", desc: "Team usage supports internal tools, business systems, admin operations, and finance stats." },
        { title: "Business contact", desc: "For higher usage, route management, reconciliation, or cooperation, contact us." },
      ],
      billingLabel: "Billing: ",
      prepayLabel: "Prepay: ",
      fitLabel: "Best for: ",
    },
    docs: {
      hero: { eyebrow: "API docs", title: "Connect AI models with one Base URL and API Key", desc: "Public docs explain the basic integration path. The console provides API Keys, model lists, API debugging, and usage tracking." },
      heading: { eyebrow: "Basics", title: "Compatible with familiar developer workflows", desc: "Create an API Key before production use. Requests are billed by model price and token usage." },
      bullets: ["Auth: use Bearer API Key in the request header.", "Model name: use the public model name shown in the console.", "Billing record: successful requests create usage records for balance settlement.", "API debugging: verify message format and model response before integration."],
      codeTitle: "Python example",
    },
    about: {
      hero: { eyebrow: "About eelapi", title: "Focused on AI API access, usage management, and developer tooling", desc: "eelapi is an AI API aggregation platform for developers, teams, and businesses." },
      positioning: { eyebrow: "Positioning", title: "Clear and maintainable API access and billing for AI teams", desc: "eelapi combines model access, key management, usage records, balance, and admin operations in one product system." },
      introCards: [
        { title: "Who we are", desc: "eelapi is an aggregation and management platform for AI API usage scenarios." },
        { title: "Who we serve", desc: "Developers, product teams, automation teams, and internal tool builders." },
        { title: "What we provide", desc: "Unified API access, model catalog, API Key management, API debugging, usage records, account billing, and admin operations." },
        { title: "What we value", desc: "Integration efficiency, clear billing, developer experience, and operational management." },
      ],
      audienceHeading: { eyebrow: "Audience", title: "For teams that need stable access and clear billing", desc: "eelapi is a developer platform for ongoing AI API calls. Top-ups add balance for future usage settlement." },
      audience: [
        { title: "Developers", desc: "Quickly integrate models, manage API Keys, view call status, and debug interfaces." },
        { title: "Product teams", desc: "Add AI chat, content generation, knowledge base, or automation capabilities to products." },
        { title: "Automation teams", desc: "Use model capabilities in workflows and review usage and cost by project." },
        { title: "Internal tools", desc: "Provide unified model entry, account billing, and admin operations for internal systems." },
      ],
      focusItems: [
        { title: "AI API access", desc: "Unified endpoints and examples reduce switching and maintenance costs." },
        { title: "Model call management", desc: "Maintain available models and pricing through model catalog and provider routes." },
        { title: "Usage analytics", desc: "Record model, tokens, costs, request status, and time for billing review." },
        { title: "Developer tooling", desc: "API Keys, API debugging, and docs make the integration path executable." },
      ],
      trustHeading: { eyebrow: "Trust foundation", title: "Make the business clear to customers and reviewers", desc: "" },
    },
    contact: {
      hero: { eyebrow: "Contact", title: "Support, business cooperation, and billing questions are handled by email", desc: "Please include account email, issue description, and related order or request IDs." },
      heading: { eyebrow: "Contact channel", title: "A formal and traceable support process", desc: "We use a unified support email to preserve records and verify accounts, orders, usage, and payments." },
      items: [
        { icon: "mail", title: "Support", desc: "Email {email} with account email, issue type, and relevant order or request IDs." },
        { icon: "briefcase", title: "Business cooperation", desc: "For team use, enterprise integration, provider cooperation, or reconciliation, submit details by email." },
        { icon: "message", title: "Issue feedback", desc: "For API errors, model issues, usage questions, or console problems, include reproduction steps and screenshots." },
        { icon: "clock", title: "Response time", desc: "We usually reply within 1-2 business days. Payment disputes or security reviews may take longer." },
      ],
      processHeading: { eyebrow: "Process", title: "Include the right information for faster handling", desc: "Clear information helps verify account, order, API Key prefix, and usage records." },
      process: [
        { title: "Account issues", desc: "Provide account email, issue type, and the account action you need." },
        { title: "Billing issues", desc: "Provide order ID, payment method, payment time, amount, and account email." },
        { title: "API issues", desc: "Provide model name, request time, error status, request_id, or API Key prefix. Do not send the full API Key." },
        { title: "Business requests", desc: "Describe team scenario, estimated usage, cooperation needs, and contact information." },
      ],
      scopeTitle: "Support scope",
      scopeDesc: "We can help with login, API Keys, model calls, usage records, recharge arrival, PayPal orders, manual WeChat/Alipay review, and policy questions.",
    },
    faq: {
      hero: { eyebrow: "FAQ", title: "Common questions about integration, top-ups, balance, and billing", desc: "Understand eelapi services, account billing, and support flow quickly." },
      heading: { eyebrow: "Help center", title: "FAQ", desc: "If your question is not covered, contact us through the contact page or support email." },
      items: [
        { question: "What is eelapi?", answer: "eelapi is an AI API aggregation platform with unified API access, model management, API Keys, API debugging, usage records, and account billing." },
        { question: "How do I start integrating?", answer: "Register, create an API Key, review the model list and docs, then configure the endpoint, model name, and auth header in your app." },
        { question: "How do I create an API Key?", answer: "Create it in the API Key area of the console. Save the full key immediately; the platform usually only shows the prefix later." },
        { question: "How do I top up?", answer: "Use account billing or recharge center after logging in. PayPal and manually reviewed WeChat/Alipay top-ups are supported." },
        { question: "What is the difference between PayPal and WeChat/Alipay?", answer: "PayPal is usually updated from payment capture results. WeChat/Alipay top-ups require manual review of payment records and proof." },
        { question: "When does balance arrive?", answer: "PayPal usually arrives after capture succeeds. Manual WeChat/Alipay top-ups arrive after admin review." },
        { question: "How do I view usage and billing?", answer: "Use the console to view usage records, recharge records, and balance changes, including model, tokens, cost, status, and request_id." },
        { question: "How do I contact support?", answer: "Email {email} with account email, issue description, order ID, payment proof, request_id, or API Key prefix." },
        { question: "When can I request a refund?", answer: "Duplicate top-ups, confirmed wrong payments, or service failures may qualify. Normal API usage that has already been consumed is usually not refundable." },
      ],
    },
    terms: {
      hero: { eyebrow: "Terms of Service", title: "Terms of Service", desc: "Rules for using the eelapi platform, APIs, console, account balance, and related services." },
      heading: "Terms content",
      sections: [
        { title: "1. Service scope", body: ["eelapi provides AI API aggregation, model management, API Key management, API debugging, usage records, account balance, and admin tooling.", "Top-ups are used to add account balance for future API usage settlement."] },
        { title: "2. Account and access", body: ["Users should register with a reachable email and keep login credentials and API Keys secure.", "Requests and costs caused by leaked or shared API Keys are the user's responsibility."] },
        { title: "3. API usage", body: ["Users must comply with applicable laws, upstream model rules, and platform limits.", "eelapi may restrict access for security, risk control, abnormal requests, unpaid usage, or violations."] },
        { title: "4. Fees and billing", body: ["Fees are calculated from model, token usage, request records, and pricing configuration.", "Balance consumption is related to API calls, model prices, and request status."] },
        { title: "5. Payment and top-up handling", body: ["PayPal orders update by payment and capture results. WeChat/Alipay top-ups are credited after manual review.", "eelapi may pause order handling for chargebacks, payment disputes, suspected fraud, or security risk."] },
        { title: "6. Contact", body: ["For questions about terms, account, billing, or service, contact {email}."] },
      ],
    },
    privacy: {
      hero: { eyebrow: "Privacy Policy", title: "Privacy Policy", desc: "How eelapi handles account, API usage, billing, payment, and security log information." },
      heading: "Privacy content",
      sections: [
        { title: "1. Information we collect", body: ["Account information such as email, user ID, role, creation time, and balance.", "API usage metadata such as key prefix, model, provider, tokens, cost, status, and logs.", "Order and billing information such as amount, payment method, order status, and review notes."] },
        { title: "2. How we use information", body: ["To provide AI API access, API Key management, model calls, API debugging, usage analytics, balance settlement, and support.", "To troubleshoot, prevent abuse, maintain security, and handle disputes."] },
        { title: "3. API content and logs", body: ["eelapi mainly records metadata needed for billing, risk control, and troubleshooting.", "Users should avoid sending unnecessary sensitive personal data or business secrets."] },
        { title: "4. Sharing and security", body: ["Limited information may be shared with necessary providers for payment, model calls, hosting, and support.", "eelapi uses reasonable technical and administrative safeguards for accounts, API Keys, billing, and logs."] },
        { title: "5. Retention and contact", body: ["Data is retained as needed for service, billing review, security audit, disputes, and compliance.", "For privacy questions, contact {email}."] },
      ],
    },
    refund: {
      hero: { eyebrow: "Refund Policy", title: "Refund Policy", desc: "Rules for PayPal payments, manually reviewed WeChat/Alipay top-ups, balance crediting, consumed API balance, and disputes." },
      heading: { eyebrow: "Refund policy", title: "Account balance, payment, and refund handling", desc: "This policy explains the relationship between top-ups, credited balance, usage, and refunds for eelapi." },
      sections: [
        { title: "1. Scope", body: ["This policy applies to top-ups for eelapi account balance and refund handling related to crediting, billing review, API usage, or payment disputes."] },
        { title: "2. PayPal payments", body: ["PayPal orders are credited only after payment capture succeeds.", "Orders under chargeback, reversal, dispute, or risk review may have related balance temporarily restricted."] },
        { title: "3. Manual WeChat/Alipay top-ups", body: ["WeChat and Alipay top-ups require manual review. The order amount is not available before approval.", "Mismatched amount, missing proof, or unverifiable payment records may delay or reject the order."] },
        { title: "4. Balance after crediting", body: ["Credited balance is prepaid account balance for usage-based API settlement.", "Users can review recharge records, balance, and usage records in the console."] },
        { title: "5. Consumed API balance", body: ["Normal API usage with usage records is generally considered consumed service cost and is not refundable.", "Confirmed platform billing errors may be handled through balance return, billing adjustment, or refund."] },
        { title: "6. Chargebacks and disputes", body: ["During disputes, eelapi may freeze related balance, pause functions, or limit API calls.", "If a channel confirms a chargeback or reversal, eelapi may deduct the corresponding amount from account balance."] },
        { title: "7. Request path and timing", body: ["To request a refund, balance adjustment, or order review, email {email}.", "Provide account email, platform order ID, payment channel, payment time, amount, PayPal order ID or WeChat/Alipay transfer screenshot, issue description, and expected handling.", "eelapi usually replies within 1-3 business days. Regular refunds or balance adjustments are usually submitted within 3-7 business days after confirmation.", "If the balance has generated API consumption, eelapi first calculates the used amount from usage logs. The remaining refundable balance is then handled under payment channel rules."] },
      ],
    },
  },
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<unknown>
    ? T[K]
    : T[K] extends Record<string, unknown>
      ? DeepPartial<T[K]>
      : T[K];
};

function mergeCopy(base: MarketingCopy, override: DeepPartial<MarketingCopy>): MarketingCopy {
  const mergeValue = (baseValue: unknown, overrideValue: unknown): unknown => {
    if (overrideValue === undefined) {
      return baseValue;
    }

    if (Array.isArray(baseValue) || Array.isArray(overrideValue)) {
      return overrideValue;
    }

    if (
      baseValue &&
      overrideValue &&
      typeof baseValue === "object" &&
      typeof overrideValue === "object"
    ) {
      const result: Record<string, unknown> = { ...(baseValue as Record<string, unknown>) };
      Object.entries(overrideValue as Record<string, unknown>).forEach(([key, value]) => {
        result[key] = mergeValue(result[key], value);
      });
      return result;
    }

    return overrideValue;
  };

  return mergeValue(base, override) as MarketingCopy;
}

const ja = mergeCopy(en, {
  languageLabel: "言語",
  nav: { features: "機能", pricing: "料金", docs: "API ドキュメント", faq: "FAQ", about: "会社情報", contact: "お問い合わせ", login: "ログイン", start: "始める", dashboard: "コンソール" },
  footer: {
    product: "製品",
    resources: "リソース",
    company: "会社",
    legal: "法務",
    supportEmail: "サポートメール",
    supportFlow: "サポート手順",
    description: "eelapi は開発者、チーム、企業向けの AI API 集約・接続プラットフォームです。統一接続、モデル管理、利用量確認、アカウント請求を提供します。",
    copyright: "Copyright © 2026 eelapi. All rights reserved.",
    tagline: "AI API 集約、利用量管理、開発者ツール。",
  },
  common: { primaryCta: "始める", pricingCta: "料金を見る", viewDocs: "ドキュメントを見る", pythonExample: "Python 例", legalSectionEyebrow: "法務" },
  home: {
    hero: {
      eyebrow: "開発者・チーム・企業向け AI API 集約プラットフォーム",
      title: "AI API 接続と請求をより明確に",
      desc: "モデル接続、API Key、利用量、請求管理を一つの開発者向けコンソールにまとめます。",
      promptPlaceholder: "モデル、請求、API 連携について質問",
      promptButton: "探す",
      promptHint: "質問後、ログインして AI チャットで続行できます。",
      apiCta: "API ドキュメント",
      dashboardCta: "コンソール",
      chips: [
        { label: "OpenAI 互換 API の接続方法", href: "/docs", prompt: "OpenAI 互換 API の接続方法を教えて" },
        { label: "利用量と請求を見る", href: "/faq", prompt: "利用量と請求はどこで確認できますか？" },
        { label: "API Key を作成する", href: "/docs", prompt: "API Key の作成方法は？" },
        { label: "PayPal と残高請求", href: "/faq", prompt: "PayPal とアカウント残高請求の違いは？" },
      ],
    },
    stats: [["対象", "開発者 / チーム / 企業"], ["中核機能", "AI API 接続と管理"], ["請求", "従量課金、前払い残高対応"], ["サポートメール", "{email}"]],
    capabilitiesHeading: { eyebrow: "中核機能", title: "接続から運用まで、明確な AI API プラットフォーム", desc: "アカウント残高、利用ログ、請求管理は開発者プラットフォームの一部です。" },
    startHeading: { eyebrow: "始め方", title: "4 ステップで API 接続とアカウント確認", desc: "登録、API Key 作成、モデル呼び出し、利用量・請求・残高確認を 1 つのコンソールで行えます。" },
    useCasesHeading: { eyebrow: "利用シーン", title: "実際の AI API 接続ニーズに対応", desc: "安定した呼び出し、明確な請求、統一管理を必要とするチーム向けです。" },
    billingHeading: { eyebrow: "請求とアカウント", title: "チャージは残高追加、中心は API 接続と管理", desc: "費用はモデル呼び出しと利用記録から発生します。残高は今後の API 利用に充当されます。" },
    whyHeading: { eyebrow: "eelapi を選ぶ理由", title: "長期運用に向いた開発者 SaaS 基盤", desc: "API 接続、モデル管理、請求記録、サポート手順を明確に整理しています。" },
    docsHeading: { eyebrow: "API ドキュメント", title: "開発者になじみのある方法で AI モデルを呼び出す", desc: "コンソールには API Key、モデル一覧、オンラインテストがあります。" },
    cta: { eyebrow: "eelapi を始める", title: "明確に管理できる AI API 接続と請求ワークフロー", desc: "アカウント作成後、API Key 作成、モデルテスト、利用ログ確認、残高追加ができます。", signup: "登録 / 始める", login: "ログイン", pricing: "料金を見る" },
  },
  capabilities: [
    { icon: "code", title: "統一 API 接続", desc: "1 つの Base URL と OpenAI 互換形式で複数モデルに接続できます。" },
    { icon: "database", title: "複数モデル管理", desc: "モデル別名、プロバイダー、表示名、価格設定をまとめて管理できます。" },
    { icon: "receipt", title: "利用量と請求分析", desc: "リクエスト状態、token、モデル、費用、時間を記録します。" },
    { icon: "key", title: "API Key 管理", desc: "API Key の作成・確認・無効化ができ、表示はプレフィックス中心です。" },
    { icon: "message", title: "オンラインテスト", desc: "本番前にメッセージ形式、モデル、応答を確認できます。" },
    { icon: "settings", title: "チームと管理機能", desc: "モデル、ユーザー、注文、財務、異常リクエストを管理できます。" },
  ],
  startSteps: [
    { icon: "users", title: "アカウント登録", desc: "メールでアカウントを作成し、API Key、利用量、請求を関連付けます。" },
    { icon: "key", title: "API Key 作成", desc: "コンソールでキーを生成し安全に保存します。" },
    { icon: "code", title: "モデル接続 / 呼び出し開始", desc: "モデル名、統一エンドポイント、認証情報を設定して呼び出します。" },
    { icon: "receipt", title: "利用量・請求・残高確認", desc: "状態、モデル、token、費用、時間、残高変化を確認します。" },
  ],
  useCases: [
    { title: "AI チャットアプリ", desc: "サポートボット、アシスタント、コンテンツ製品に統一モデル入口を提供します。" },
    { title: "自動化ワークフロー", desc: "要約、分類、品質確認、データ処理にモデル機能を追加します。" },
    { title: "社内ツール", desc: "社内システムを 1 つの API で接続し、設定と権限管理を簡素化します。" },
    { title: "開発者 API 接続", desc: "統一エンドポイント、モデルカタログ、例を使って素早く統合できます。" },
  ],
  billingNotes: [
    { title: "前払い残高対応", desc: "コンソールでアカウント残高を追加し、今後の API 利用に充当します。" },
    { title: "従量課金", desc: "モデル、token、価格設定に基づいて費用を記録します。" },
    { title: "残高追加", desc: "チャージはアカウント請求機能の一部です。" },
    { title: "支払い確認", desc: "PayPal は支払い結果に従い、WeChat/Alipay は手動確認されます。" },
  ],
  whyItems: [
    { title: "簡単な接続", desc: "OpenAI 互換形式、統一 Base URL、API Key で素早く開始できます。" },
    { title: "管理しやすい", desc: "モデル、API Key、プロバイダー、アカウント記録を一元管理します。" },
    { title: "明確な請求", desc: "実際の利用量に基づいて費用を追跡します。" },
    { title: "複数の入金方法", desc: "PayPal と手動確認の WeChat/Alipay に対応します。" },
  ],
  pricingPlans: [
    { name: "スターター", audience: "個人試用と API 検証向け", price: "従量課金", desc: "統一接続、オンラインテスト、モデル選択、基本利用記録を評価できます。", billing: "実際のモデル利用に基づき記録", prepay: "少額の前払い残高に対応", fit: "テスト、プロトタイプ、低頻度利用", features: ["前払い残高", "基本 API Key 管理", "オンラインテスト", "利用記録"] },
    { name: "開発者", audience: "個人開発者と小規模プロジェクト向け", price: "利用量で精算", desc: "継続開発と本番プロジェクト向け。", billing: "token、モデル、価格設定で記録", prepay: "残高で API 利用費を精算", fit: "個人開発、小規模チーム", features: ["複数モデル呼び出し", "token ベース費用", "残高チャージ", "リクエストログ"], highlighted: true },
    { name: "チーム", audience: "チームと企業向け", price: "相談", desc: "複数メンバー、社内システム、運用管理向け。", billing: "チーム利用の確認に対応", prepay: "チーム予算で残高追加", fit: "社内ツール、業務システム", features: ["チーム管理", "プロバイダー管理", "財務統計", "ビジネスサポート"] },
  ],
  featureDetails: [
    { icon: "code", title: "統一 API 接続", desc: "複数 SDK や上流 URL の保守コストを減らします。" },
    { icon: "layers", title: "モデルカタログ管理", desc: "公開モデル名、上流名、プロバイダー、価格、状態を管理します。" },
    { icon: "key", title: "API Key 管理", desc: "キーを作成・無効化し、プレフィックスで識別します。" },
    { icon: "gauge", title: "オンラインテスト", desc: "本番前に形式と応答を検証できます。" },
    { icon: "activity", title: "利用記録", desc: "モデル、token、費用、状態、遅延、エラーを記録します。" },
    { icon: "wallet", title: "チャージと請求", desc: "残高で API 利用を精算し、PayPal と手動確認に対応します。" },
    { icon: "users", title: "管理運用", desc: "ユーザー、注文、財務、プロバイダー、異常リクエストを確認できます。" },
  ],
  trustItems: [
    { icon: "building", title: "対象が明確", desc: "開発者、製品チーム、自動化チーム、社内ツール担当者向けです。" },
    { icon: "card", title: "請求の位置づけが明確", desc: "残高追加は将来の API 利用精算に使われます。" },
    { icon: "file", title: "ポリシー完備", desc: "利用規約、プライバシー、返金ポリシーを公開しています。" },
    { icon: "life", title: "連絡可能なサポート", desc: "{email} からサポートと商談に連絡できます。" },
  ],
  pages: {
    features: { hero: { eyebrow: "製品機能", title: "AI API 接続、管理、請求のための開発者プラットフォーム", desc: "モデル接続、キー管理、オンラインテスト、利用記録、残高、運用機能を 1 つのコンソールにまとめます。" }, heading: { eyebrow: "機能", title: "API ゲートウェイ以上の継続運用機能", desc: "顧客、開発者、審査担当者にサービス内容を明確に示します。" } },
    pricing: { hero: { eyebrow: "料金と請求", title: "利用量に基づく精算、前払い残高に対応", desc: "費用は AI API 呼び出し、モデル利用、アカウント請求に基づきます。" }, billingLabel: "請求方式：", prepayLabel: "前払い：", fitLabel: "適用場面：" },
    docs: { hero: { eyebrow: "API ドキュメント", title: "統一 Base URL と API Key で AI モデルに接続", desc: "公開ドキュメントで基本的な統合方法を確認できます。" }, codeTitle: "Python 例" },
    about: { hero: { eyebrow: "eelapi について", title: "AI API 接続、利用管理、開発者体験に注力", desc: "eelapi は開発者、チーム、企業向けの AI API 集約プラットフォームです。" } },
    contact: { hero: { eyebrow: "お問い合わせ", title: "サポート、商談、請求の相談はメールで対応", desc: "アカウントメール、問題説明、注文番号や request_id を記載してください。" } },
    faq: {
      hero: { eyebrow: "FAQ", title: "接続、チャージ、残高、請求に関するよくある質問", desc: "eelapi のサービス、請求、サポート手順を素早く理解できます。" },
      items: [
        { question: "eelapi とは？", answer: "eelapi は統一 API 接続、モデル管理、API Key、オンラインテスト、利用記録、アカウント請求を提供する AI API 集約プラットフォームです。" },
        { question: "接続を始めるには？", answer: "登録後、API Key を作成し、モデル一覧とドキュメントを確認してエンドポイントと認証を設定します。" },
        { question: "API Key の作成方法は？", answer: "コンソールの API Key 管理で作成します。完全なキーは作成時に保存してください。" },
        { question: "チャージ方法は？", answer: "ログイン後、アカウント請求またはチャージセンターで残高を追加できます。" },
        { question: "PayPal と WeChat/Alipay の違いは？", answer: "PayPal は捕獲結果で更新され、WeChat/Alipay は手動確認が必要です。" },
        { question: "いつ残高に反映されますか？", answer: "PayPal は通常捕獲成功後、手動チャージは管理者確認後に反映されます。" },
        { question: "利用量と請求はどこで見ますか？", answer: "コンソールで利用記録、チャージ記録、残高変化を確認できます。" },
        { question: "サポートへの連絡方法は？", answer: "{email} にアカウントメール、問題内容、注文番号、request_id などを送ってください。" },
        { question: "返金できる場合は？", answer: "重複チャージ、確認済みの誤入金、サービス提供不可などは返金または残高調整の対象になり得ます。" },
      ],
    },
    terms: { hero: { eyebrow: "利用規約", title: "利用規約", desc: "eelapi プラットフォーム、API、コンソール、残高、関連サービスの基本ルールです。" } },
    privacy: { hero: { eyebrow: "プライバシーポリシー", title: "プライバシーポリシー", desc: "アカウント、API 利用、請求、支払い、安全ログの取り扱いを説明します。" } },
    refund: { hero: { eyebrow: "返金ポリシー", title: "返金ポリシー", desc: "PayPal、手動チャージ、残高反映、API 消費、紛争処理のルールを説明します。" } },
  },
});

const ko = mergeCopy(en, {
  languageLabel: "언어",
  nav: { features: "기능", pricing: "가격", docs: "API 문서", faq: "FAQ", about: "소개", contact: "문의", login: "로그인", start: "시작하기", dashboard: "콘솔" },
  footer: { product: "제품", resources: "리소스", company: "회사", legal: "법률", supportEmail: "지원 이메일", supportFlow: "지원 절차", description: "eelapi는 개발자, 팀, 기업을 위한 AI API 집계 및 접속 플랫폼입니다.", copyright: "Copyright © 2026 eelapi. All rights reserved.", tagline: "AI API 집계, 사용량 관리, 개발자 도구." },
  common: { primaryCta: "시작하기", pricingCta: "가격 보기", viewDocs: "문서 보기", pythonExample: "Python 예제", legalSectionEyebrow: "법률" },
  home: {
    hero: { eyebrow: "개발자, 팀, 기업을 위한 AI API 집계 플랫폼", title: "더 명확한 AI API 접속과 청구", desc: "모델 접속, API Key, 사용량 추적, 청구 관리를 하나의 콘솔에서 제공합니다.", promptPlaceholder: "모델, 청구, API 연동에 대해 질문하세요", promptButton: "탐색", promptHint: "질문 후 로그인하여 AI 채팅에서 이어갈 수 있습니다.", apiCta: "API 문서", dashboardCta: "콘솔", chips: [{ label: "OpenAI 호환 API", href: "/docs", prompt: "OpenAI 호환 API는 어떻게 연결하나요?" }, { label: "사용량과 청구 보기", href: "/faq", prompt: "사용량과 청구는 어디서 보나요?" }, { label: "API Key 만들기", href: "/docs", prompt: "API Key는 어떻게 만드나요?" }, { label: "PayPal과 잔액 청구", href: "/faq", prompt: "PayPal과 계정 잔액 청구의 차이는 무엇인가요?" }] },
    stats: [["대상", "개발자 / 팀 / 기업"], ["핵심 기능", "AI API 접속 및 관리"], ["청구", "사용량 기반, 선불 잔액 지원"], ["지원 이메일", "{email}"]],
    startHeading: { eyebrow: "시작하기", title: "Key에서 첫 호출까지", desc: "가입, API Key 생성, 모델 호출, 사용량·청구·잔액 확인을 하나의 콘솔에서 처리합니다." },
    capabilitiesHeading: { eyebrow: "핵심 기능", title: "API 접속의 핵심 기능", desc: "모델 접속, API Key, 사용량 기록과 청구를 한곳에서 관리합니다." },
  },
  capabilities: [
    { icon: "code", title: "통합 API 접속", desc: "하나의 Base URL과 OpenAI 호환 방식으로 여러 모델에 연결합니다." },
    { icon: "database", title: "다중 모델 관리", desc: "모델 별칭, 공급자, 표시 이름, 가격 구성을 관리합니다." },
    { icon: "receipt", title: "사용량 및 청구 분석", desc: "요청 상태, token, 모델, 비용, 시간을 기록합니다." },
    { icon: "key", title: "API Key 관리", desc: "API Key를 생성, 확인, 폐기할 수 있으며 접두사만 표시합니다." },
    { icon: "message", title: "온라인 테스트", desc: "운영 전 메시지 형식, 모델, 응답을 검증합니다." },
    { icon: "settings", title: "팀 및 관리자 운영", desc: "모델, 사용자, 주문, 재무, 이상 요청을 관리합니다." },
  ],
  startSteps: [
    { icon: "users", title: "계정 등록", desc: "이메일로 계정을 만들고 API Key, 사용량, 청구를 연결합니다." },
    { icon: "key", title: "API Key 생성", desc: "콘솔에서 키를 생성하고 안전하게 보관합니다." },
    { icon: "code", title: "모델 연결 / 호출 시작", desc: "모델명, 통합 엔드포인트, 인증 정보를 설정합니다." },
    { icon: "receipt", title: "사용량, 청구, 잔액 확인", desc: "상태, 모델, token, 비용, 시간, 잔액 변화를 확인합니다." },
  ],
  useCases: [
    { title: "AI 채팅 앱", desc: "지원 봇, 지식 베이스, 콘텐츠 제품에 통합 모델 입구를 제공합니다." },
    { title: "자동화 워크플로", desc: "요약, 분류, QA, 데이터 처리에 모델 기능을 추가합니다." },
    { title: "사내 도구", desc: "내부 시스템을 하나의 API로 연결하고 설정과 권한 관리를 줄입니다." },
    { title: "개발자 API 연동", desc: "통합 엔드포인트, 모델 카탈로그, 예제로 빠르게 연동합니다." },
  ],
  pages: {
    features: { hero: { eyebrow: "제품 기능", title: "AI API 접속, 관리, 청구를 위한 개발자 플랫폼", desc: "모델 접속, 키 관리, 온라인 테스트, 사용 기록, 잔액, 운영 기능을 하나의 콘솔에 모읍니다." } },
    pricing: { hero: { eyebrow: "가격 및 청구", title: "사용량 기반 정산과 선불 계정 잔액", desc: "비용은 AI API 호출, 모델 사용량, 계정 청구를 기준으로 계산됩니다." }, billingLabel: "청구 방식: ", prepayLabel: "선불: ", fitLabel: "적합한 경우: " },
    docs: { hero: { eyebrow: "API 문서", title: "하나의 Base URL과 API Key로 AI 모델 연결", desc: "공개 문서는 기본 연동 경로를 설명합니다." }, codeTitle: "Python 예제" },
    about: { hero: { eyebrow: "eelapi 소개", title: "AI API 접속, 사용량 관리, 개발자 도구에 집중", desc: "eelapi는 개발자, 팀, 기업을 위한 AI API 집계 플랫폼입니다." } },
    contact: { hero: { eyebrow: "문의", title: "지원, 비즈니스 협력, 청구 문의는 이메일로 처리합니다", desc: "계정 이메일, 문제 설명, 주문 번호 또는 request_id를 포함해 주세요." } },
    faq: { hero: { eyebrow: "FAQ", title: "연동, 충전, 잔액, 청구 관련 질문", desc: "eelapi 서비스, 계정 청구, 지원 절차를 빠르게 이해하세요." }, items: [{ question: "eelapi는 무엇인가요?", answer: "통합 API 접속, 모델 관리, API Key, 온라인 테스트, 사용 기록, 계정 청구를 제공하는 AI API 집계 플랫폼입니다." }, { question: "어떻게 시작하나요?", answer: "가입 후 API Key를 만들고 문서와 모델 목록을 확인한 뒤 앱에 엔드포인트와 인증을 설정합니다." }, { question: "API Key는 어떻게 만드나요?", answer: "콘솔의 API Key 영역에서 만들고 생성 시 전체 키를 저장하세요." }, { question: "어떻게 충전하나요?", answer: "로그인 후 계정 청구 또는 충전 센터에서 잔액을 추가할 수 있습니다." }, { question: "PayPal과 WeChat/Alipay의 차이는?", answer: "PayPal은 결제 캡처 결과로 업데이트되고 WeChat/Alipay는 수동 검토가 필요합니다." }, { question: "잔액은 언제 반영되나요?", answer: "PayPal은 캡처 성공 후, 수동 충전은 관리자 확인 후 반영됩니다." }, { question: "사용량과 청구는 어디서 보나요?", answer: "콘솔에서 사용 기록, 충전 기록, 잔액 변화를 확인할 수 있습니다." }, { question: "지원에 연락하려면?", answer: "{email}로 계정 이메일, 문제 설명, 주문 번호, request_id 등을 보내 주세요." }, { question: "환불 가능한 경우는?", answer: "중복 충전, 확인된 오입금, 서비스 제공 불가 등은 환불 또는 잔액 조정 대상이 될 수 있습니다." }] },
    terms: { hero: { eyebrow: "서비스 약관", title: "서비스 약관", desc: "eelapi 플랫폼, API, 콘솔, 계정 잔액 및 관련 서비스 이용 규칙입니다." } },
    privacy: { hero: { eyebrow: "개인정보 처리방침", title: "개인정보 처리방침", desc: "계정, API 사용, 청구, 결제, 보안 로그 정보 처리 방식을 설명합니다." } },
    refund: { hero: { eyebrow: "환불 정책", title: "환불 정책", desc: "PayPal, 수동 충전, 잔액 반영, API 소비, 분쟁 처리 규칙을 설명합니다." } },
  },
});

const es = mergeCopy(en, {
  languageLabel: "Idioma",
  nav: { features: "Funciones", pricing: "Precios", docs: "Docs API", faq: "FAQ", about: "Acerca de", contact: "Contacto", login: "Entrar", start: "Empezar", dashboard: "Consola" },
  footer: { product: "Producto", resources: "Recursos", company: "Empresa", legal: "Legal", supportEmail: "Email de soporte", supportFlow: "Proceso de soporte", description: "eelapi es una plataforma de agregación y acceso a AI API para desarrolladores, equipos y empresas.", copyright: "Copyright © 2026 eelapi. Todos los derechos reservados.", tagline: "Agregación de AI API, gestión de uso y herramientas para desarrolladores." },
  common: { primaryCta: "Empezar", pricingCta: "Ver precios", viewDocs: "Ver docs", pythonExample: "Ejemplo Python", legalSectionEyebrow: "Legal" },
  home: {
    hero: { eyebrow: "Plataforma de agregación de AI API para desarrolladores, equipos y empresas", title: "Acceso y facturación AI API más claros", desc: "Modelos, API Keys, uso y facturación en una consola para desarrolladores y equipos.", promptPlaceholder: "Pregunta sobre modelos, facturación e integración API", promptButton: "Explorar", promptHint: "Pregunta primero y continúa en el chat AI tras iniciar sesión.", apiCta: "Docs API", dashboardCta: "Consola", chips: [{ label: "API compatible OpenAI", href: "/docs", prompt: "¿Cómo conecto la API compatible con OpenAI?" }, { label: "Uso y facturación", href: "/faq", prompt: "¿Cómo veo uso y facturación?" }, { label: "Crear API Key", href: "/docs", prompt: "¿Cómo creo una API Key?" }, { label: "PayPal vs saldo", href: "/faq", prompt: "¿Cuál es la diferencia entre PayPal y el saldo de cuenta?" }] },
    stats: [["Usuarios", "Desarrolladores / Equipos / Empresas"], ["Capacidad", "Acceso y gestión de AI API"], ["Facturación", "Por uso, saldo prepago"], ["Soporte", "{email}"]],
    startHeading: { eyebrow: "Empezar", title: "Conecta APIs y revisa la cuenta en 4 pasos", desc: "Regístrate, crea una API Key, llama modelos y revisa uso, facturación y saldo en una consola." },
  },
  capabilities: [
    { icon: "code", title: "Acceso API unificado", desc: "Un Base URL y llamadas compatibles con OpenAI para conectar varios modelos." },
    { icon: "database", title: "Gestión multi-modelo", desc: "Administra alias, proveedores, nombres visibles y precios." },
    { icon: "receipt", title: "Uso y facturación", desc: "Registra estado, tokens, modelo, coste y tiempo." },
    { icon: "key", title: "Gestión de API Key", desc: "Crea, consulta y revoca claves mostrando solo el prefijo." },
    { icon: "message", title: "Pruebas online", desc: "Valida mensajes, modelos y respuestas antes de producción." },
    { icon: "settings", title: "Operación de equipo", desc: "Gestiona modelos, usuarios, órdenes, finanzas y solicitudes anómalas." },
  ],
  startSteps: [
    { icon: "users", title: "Registrar cuenta", desc: "Crea una cuenta con email y vincula API Keys, uso y facturación." },
    { icon: "key", title: "Crear API Key", desc: "Genera la clave en la consola y guárdala de forma segura." },
    { icon: "code", title: "Conectar modelos / llamar", desc: "Configura modelo, endpoint unificado y autenticación." },
    { icon: "receipt", title: "Ver uso, facturación y saldo", desc: "Revisa estado, modelo, tokens, coste, tiempo y cambios de saldo." },
  ],
  useCases: [
    { title: "Apps de chat AI", desc: "Entrada unificada de modelos para bots, asistentes y productos de contenido." },
    { title: "Flujos de automatización", desc: "Añade modelos a resumen, clasificación, QA y procesamiento de datos." },
    { title: "Herramientas internas", desc: "Conecta sistemas internos con una API y reduce configuración repetida." },
    { title: "Acceso API para desarrolladores", desc: "Integra con endpoint unificado, catálogo de modelos y ejemplos." },
  ],
  pages: {
    features: { hero: { eyebrow: "Funciones", title: "Plataforma para acceso, gestión y facturación de AI API", desc: "Modelo, claves, pruebas online, uso, saldo y operación en una consola." } },
    pricing: { hero: { eyebrow: "Precios y facturación", title: "Liquidación por uso con saldo prepago", desc: "Los costes dependen de llamadas AI API, uso de modelos y facturación de cuenta." }, billingLabel: "Facturación: ", prepayLabel: "Prepago: ", fitLabel: "Ideal para: " },
    docs: { hero: { eyebrow: "Docs API", title: "Conecta modelos AI con un Base URL y API Key", desc: "La documentación pública explica la integración básica." }, codeTitle: "Ejemplo Python" },
    about: { hero: { eyebrow: "Acerca de eelapi", title: "Enfocados en acceso AI API, gestión de uso y herramientas developer", desc: "eelapi es una plataforma AI API para desarrolladores, equipos y empresas." } },
    contact: { hero: { eyebrow: "Contacto", title: "Soporte, cooperación y facturación por email", desc: "Incluye email de cuenta, descripción, orden o request_id." } },
    faq: { hero: { eyebrow: "FAQ", title: "Preguntas sobre integración, recarga, saldo y facturación", desc: "Comprende el servicio, la facturación y el soporte de eelapi." } },
    terms: { hero: { eyebrow: "Términos de servicio", title: "Términos de servicio", desc: "Reglas para usar la plataforma, API, consola, saldo y servicios de eelapi." } },
    privacy: { hero: { eyebrow: "Política de privacidad", title: "Política de privacidad", desc: "Cómo eelapi procesa cuenta, uso API, facturación, pago y logs de seguridad." } },
    refund: { hero: { eyebrow: "Política de reembolso", title: "Política de reembolso", desc: "Reglas de PayPal, recargas manuales, saldo acreditado, consumo API y disputas." } },
  },
});

const fr = mergeCopy(en, {
  languageLabel: "Langue",
  nav: { features: "Fonctionnalités", pricing: "Tarifs", docs: "Docs API", faq: "FAQ", about: "À propos", contact: "Contact", login: "Connexion", start: "Commencer", dashboard: "Console" },
  footer: { product: "Produit", resources: "Ressources", company: "Entreprise", legal: "Légal", supportEmail: "Email support", supportFlow: "Processus support", description: "eelapi est une plateforme d’agrégation et d’accès AI API pour développeurs, équipes et entreprises.", copyright: "Copyright © 2026 eelapi. Tous droits réservés.", tagline: "Agrégation AI API, gestion d’usage et outils développeur." },
  common: { primaryCta: "Commencer", pricingCta: "Voir les tarifs", viewDocs: "Voir la documentation", pythonExample: "Exemple Python", legalSectionEyebrow: "Légal" },
  home: {
    hero: { eyebrow: "Plateforme d’agrégation AI API pour développeurs, équipes et entreprises", title: "Accès AI API et facturation plus clairs", desc: "Modèles, API Keys, suivi d’usage et facturation dans une console pour développeurs.", promptPlaceholder: "Posez une question sur les modèles, la facturation ou l’API", promptButton: "Explorer", promptHint: "Posez une question, puis continuez dans le chat AI après connexion.", apiCta: "Docs API", dashboardCta: "Console", chips: [{ label: "API compatible OpenAI", href: "/docs", prompt: "Comment connecter l’API compatible OpenAI ?" }, { label: "Usage et facturation", href: "/faq", prompt: "Comment voir l’usage et la facturation ?" }, { label: "Créer une API Key", href: "/docs", prompt: "Comment créer une API Key ?" }, { label: "PayPal et solde", href: "/faq", prompt: "Quelle différence entre PayPal et le solde de compte ?" }] },
    stats: [["Public", "Développeurs / Équipes / Entreprises"], ["Capacité", "Accès et gestion AI API"], ["Facturation", "À l’usage, solde prépayé"], ["Support", "{email}"]],
    startHeading: { eyebrow: "Démarrage", title: "Connecter l’API et vérifier le compte en 4 étapes", desc: "Inscription, API Key, appel de modèles, puis suivi de l’usage, de la facturation et du solde." },
  },
  capabilities: [
    { icon: "code", title: "Accès API unifié", desc: "Un Base URL et un schéma compatible OpenAI pour connecter plusieurs modèles." },
    { icon: "database", title: "Gestion multi-modèles", desc: "Gérez alias, fournisseurs, noms affichés et prix." },
    { icon: "receipt", title: "Usage et facturation", desc: "Suivez statut, tokens, modèle, coût et temps." },
    { icon: "key", title: "Gestion API Key", desc: "Créez, consultez et révoquez les clés avec affichage du préfixe." },
    { icon: "message", title: "Validation API", desc: "Validez messages, modèles et réponses avant production." },
    { icon: "settings", title: "Opérations d’équipe", desc: "Administrez modèles, utilisateurs, commandes, finances et requêtes anormales." },
  ],
  startSteps: [
    { icon: "users", title: "Créer un compte", desc: "Créez un compte par email et associez clés, usage et facturation." },
    { icon: "key", title: "Créer une API Key", desc: "Générez la clé dans la console et conservez-la en sécurité." },
    { icon: "code", title: "Connecter les modèles", desc: "Configurez modèle, endpoint unifié et authentification." },
    { icon: "receipt", title: "Voir usage, factures et solde", desc: "Consultez statut, modèle, tokens, coût, temps et solde." },
  ],
  pages: {
    features: { hero: { eyebrow: "Fonctionnalités", title: "Plateforme développeur pour accès, gestion et facturation AI API", desc: "Accès modèles, clés, validation, usage, solde et opérations dans une console claire." } },
    pricing: { hero: { eyebrow: "Tarifs et facturation", title: "Facturation à l’usage avec solde prépayé", desc: "Les coûts reposent sur appels AI API, usage modèles et facturation du compte." }, billingLabel: "Facturation : ", prepayLabel: "Prépayé : ", fitLabel: "Adapté à : " },
    docs: { hero: { eyebrow: "Docs API", title: "Connecter des modèles AI avec un Base URL et une API Key", desc: "La documentation publique explique le parcours d’intégration de base." }, codeTitle: "Exemple Python" },
    about: { hero: { eyebrow: "À propos de eelapi", title: "Accès AI API, gestion d’usage et expérience développeur", desc: "eelapi est une plateforme AI API pour développeurs, équipes et entreprises." } },
    contact: { hero: { eyebrow: "Contact", title: "Support, partenariat et facturation par email", desc: "Incluez email de compte, description, commande ou request_id." } },
    faq: { hero: { eyebrow: "FAQ", title: "Questions sur intégration, recharge, solde et facturation", desc: "Comprendre rapidement le service, la facturation et le support eelapi." } },
    terms: { hero: { eyebrow: "Conditions d’utilisation", title: "Conditions d’utilisation", desc: "Règles d’utilisation de la plateforme, des API, de la console, du solde et des services eelapi." } },
    privacy: { hero: { eyebrow: "Politique de confidentialité", title: "Politique de confidentialité", desc: "Traitement des informations de compte, usage API, facturation, paiement et sécurité." } },
    refund: { hero: { eyebrow: "Politique de remboursement", title: "Politique de remboursement", desc: "Règles PayPal, recharges manuelles, solde crédité, consommation API et litiges." } },
  },
});

const de = mergeCopy(en, {
  languageLabel: "Sprache",
  nav: { features: "Funktionen", pricing: "Preise", docs: "API-Doku", faq: "FAQ", about: "Über uns", contact: "Kontakt", login: "Anmelden", start: "Loslegen", dashboard: "Konsole" },
  footer: { product: "Produkt", resources: "Ressourcen", company: "Unternehmen", legal: "Rechtliches", supportEmail: "Support-E-Mail", supportFlow: "Support-Ablauf", description: "eelapi ist eine Plattform für AI-API-Aggregation und Zugriff für Entwickler, Teams und Unternehmen.", copyright: "Copyright © 2026 eelapi. Alle Rechte vorbehalten.", tagline: "AI-API-Aggregation, Nutzungsmanagement und Entwicklerwerkzeuge." },
  common: { primaryCta: "Loslegen", pricingCta: "Preise ansehen", viewDocs: "Doku ansehen", pythonExample: "Python-Beispiel", legalSectionEyebrow: "Rechtliches" },
  home: {
    hero: { eyebrow: "AI-API-Aggregation für Entwickler, Teams und Unternehmen", title: "Klarer AI-API-Zugriff und Billing", desc: "Modelle, API Keys, Nutzung und Abrechnung in einer Konsole für Entwicklerteams.", promptPlaceholder: "Fragen Sie zu Modellen, Billing und API-Integration", promptButton: "Erkunden", promptHint: "Erst fragen, dann nach dem Login im AI-Chat fortfahren.", apiCta: "API-Doku", dashboardCta: "Konsole", chips: [{ label: "OpenAI-kompatible API", href: "/docs", prompt: "Wie verbinde ich die OpenAI-kompatible API?" }, { label: "Nutzung und Billing", href: "/faq", prompt: "Wie sehe ich Nutzung und Abrechnung?" }, { label: "API Key erstellen", href: "/docs", prompt: "Wie erstelle ich einen API Key?" }, { label: "PayPal vs. Kontosaldo", href: "/faq", prompt: "Was ist der Unterschied zwischen PayPal und Kontosaldo?" }] },
    stats: [["Zielgruppe", "Entwickler / Teams / Unternehmen"], ["Kernfunktion", "AI-API-Zugriff und Verwaltung"], ["Abrechnung", "Nutzungsbasiert, Prepaid-Saldo"], ["Support", "{email}"]],
    startHeading: { eyebrow: "Start", title: "API-Anbindung und Kontoprüfung in 4 Schritten", desc: "Registrieren, API Key erstellen, Modelle aufrufen und Nutzung, Abrechnung sowie Saldo prüfen." },
  },
  capabilities: [
    { icon: "code", title: "Einheitlicher API-Zugriff", desc: "Ein Base URL und OpenAI-kompatible Aufrufe für mehrere Modelle." },
    { icon: "database", title: "Multi-Modell-Verwaltung", desc: "Alias, Anbieter, Anzeigenamen und Preise zentral verwalten." },
    { icon: "receipt", title: "Nutzung und Abrechnung", desc: "Status, Tokens, Modell, Kosten und Zeit erfassen." },
    { icon: "key", title: "API-Key-Verwaltung", desc: "Keys erstellen, anzeigen und widerrufen; angezeigt wird nur der Präfix." },
    { icon: "message", title: "API-Validierung", desc: "Nachrichten, Modelle und Antworten vor Produktion prüfen." },
    { icon: "settings", title: "Team-Betrieb", desc: "Modelle, Nutzer, Bestellungen, Finanzen und auffällige Anfragen verwalten." },
  ],
  startSteps: [
    { icon: "users", title: "Konto registrieren", desc: "Konto per E-Mail erstellen und Keys, Nutzung und Abrechnung verknüpfen." },
    { icon: "key", title: "API Key erstellen", desc: "Key in der Konsole erzeugen und sicher speichern." },
    { icon: "code", title: "Modelle verbinden", desc: "Modell, Endpoint und Authentifizierung konfigurieren." },
    { icon: "receipt", title: "Nutzung, Abrechnung und Saldo prüfen", desc: "Status, Tokens, Kosten, Zeit und Saldoänderungen ansehen." },
  ],
  pages: {
    features: { hero: { eyebrow: "Funktionen", title: "Entwicklerplattform für AI-API-Zugriff, Verwaltung und Abrechnung", desc: "Modelle, Keys, Validierung, Nutzung, Saldo und Betrieb in einer klaren Konsole." } },
    pricing: { hero: { eyebrow: "Preise und Abrechnung", title: "Nutzungsbasierte Abrechnung mit Prepaid-Kontosaldo", desc: "Kosten basieren auf AI-API-Aufrufen, Modellnutzung und Kontoabrechnung." }, billingLabel: "Abrechnung: ", prepayLabel: "Prepaid: ", fitLabel: "Geeignet für: " },
    docs: { hero: { eyebrow: "API-Doku", title: "AI-Modelle mit einem Base URL und API Key verbinden", desc: "Öffentliche Dokumentation erklärt den grundlegenden Integrationspfad." }, codeTitle: "Python-Beispiel" },
    about: { hero: { eyebrow: "Über eelapi", title: "Fokus auf AI-API-Zugriff, Nutzungsmanagement und Developer Experience", desc: "eelapi ist eine AI-API-Plattform für Entwickler, Teams und Unternehmen." } },
    contact: { hero: { eyebrow: "Kontakt", title: "Support, Partnerschaften und Abrechnung per E-Mail", desc: "Bitte Konto-E-Mail, Beschreibung, Bestellung oder request_id angeben." } },
    faq: { hero: { eyebrow: "FAQ", title: "Fragen zu Integration, Aufladung, Saldo und Abrechnung", desc: "eelapi Service, Abrechnung und Support schnell verstehen." } },
    terms: { hero: { eyebrow: "Nutzungsbedingungen", title: "Nutzungsbedingungen", desc: "Regeln für Plattform, API, Konsole, Kontosaldo und Dienste von eelapi." } },
    privacy: { hero: { eyebrow: "Datenschutzerklärung", title: "Datenschutzerklärung", desc: "Umgang mit Konto-, API-Nutzungs-, Abrechnungs-, Zahlungs- und Sicherheitslogdaten." } },
    refund: { hero: { eyebrow: "Rückerstattungsrichtlinie", title: "Rückerstattungsrichtlinie", desc: "Regeln zu PayPal, manuellen Aufladungen, Saldo, API-Verbrauch und Streitfällen." } },
  },
});

const pt = mergeCopy(en, {
  languageLabel: "Idioma",
  nav: { features: "Recursos", pricing: "Preços", docs: "Docs API", faq: "FAQ", about: "Sobre", contact: "Contato", login: "Entrar", start: "Começar", dashboard: "Console" },
  footer: { product: "Produto", resources: "Recursos", company: "Empresa", legal: "Legal", supportEmail: "Email de suporte", supportFlow: "Fluxo de suporte", description: "eelapi é uma plataforma de agregação e acesso a AI API para desenvolvedores, equipes e empresas.", copyright: "Copyright © 2026 eelapi. Todos os direitos reservados.", tagline: "Agregação AI API, gestão de uso e ferramentas para desenvolvedores." },
  common: { primaryCta: "Começar", pricingCta: "Ver preços", viewDocs: "Ver docs", pythonExample: "Exemplo Python", legalSectionEyebrow: "Legal" },
  home: {
    hero: { eyebrow: "Plataforma de agregação AI API para desenvolvedores, equipes e empresas", title: "Acesso AI API e cobrança mais claros", desc: "Modelos, API Keys, uso e cobrança em um console para desenvolvedores e equipes.", promptPlaceholder: "Pergunte sobre modelos, cobrança e integração API", promptButton: "Explorar", promptHint: "Pergunte primeiro e continue no chat AI após entrar.", apiCta: "Docs API", dashboardCta: "Console", chips: [{ label: "API compatível OpenAI", href: "/docs", prompt: "Como conectar a API compatível com OpenAI?" }, { label: "Uso e cobrança", href: "/faq", prompt: "Como ver uso e cobrança?" }, { label: "Criar API Key", href: "/docs", prompt: "Como criar uma API Key?" }, { label: "PayPal vs saldo", href: "/faq", prompt: "Qual a diferença entre PayPal e saldo da conta?" }] },
    stats: [["Público", "Desenvolvedores / Equipes / Empresas"], ["Capacidade", "Acesso e gestão AI API"], ["Cobrança", "Por uso, saldo pré-pago"], ["Suporte", "{email}"]],
    startHeading: { eyebrow: "Começar", title: "Conecte APIs e revise a conta em 4 passos", desc: "Cadastre-se, crie uma API Key, chame modelos e veja uso, cobrança e saldo." },
  },
  capabilities: [
    { icon: "code", title: "Acesso API unificado", desc: "Um Base URL e chamadas compatíveis com OpenAI para vários modelos." },
    { icon: "database", title: "Gestão de modelos", desc: "Gerencie aliases, provedores, nomes exibidos e preços." },
    { icon: "receipt", title: "Uso e cobrança", desc: "Registre status, tokens, modelo, custo e tempo." },
    { icon: "key", title: "Gestão de API Key", desc: "Crie, visualize e revogue chaves mostrando apenas o prefixo." },
    { icon: "message", title: "Validação API", desc: "Valide mensagens, modelos e respostas antes da produção." },
    { icon: "settings", title: "Operação de equipe", desc: "Gerencie modelos, usuários, pedidos, finanças e solicitações anormais." },
  ],
  startSteps: [
    { icon: "users", title: "Registrar conta", desc: "Crie uma conta por email e vincule chaves, uso e cobrança." },
    { icon: "key", title: "Criar API Key", desc: "Gere a chave no console e guarde com segurança." },
    { icon: "code", title: "Conectar modelos", desc: "Configure modelo, endpoint unificado e autenticação." },
    { icon: "receipt", title: "Ver uso, cobrança e saldo", desc: "Revise status, tokens, custo, tempo e alterações de saldo." },
  ],
  pages: {
    features: { hero: { eyebrow: "Recursos", title: "Plataforma para acesso, gestão e cobrança de AI API", desc: "Modelos, chaves, validação, uso, saldo e operação em um console claro." } },
    pricing: { hero: { eyebrow: "Preços e cobrança", title: "Liquidação por uso com saldo pré-pago", desc: "Custos são baseados em chamadas AI API, uso de modelos e cobrança da conta." }, billingLabel: "Cobrança: ", prepayLabel: "Pré-pago: ", fitLabel: "Ideal para: " },
    docs: { hero: { eyebrow: "Docs API", title: "Conecte modelos AI com um Base URL e API Key", desc: "A documentação pública explica o caminho básico de integração." }, codeTitle: "Exemplo Python" },
    about: { hero: { eyebrow: "Sobre eelapi", title: "Foco em acesso AI API, gestão de uso e experiência developer", desc: "eelapi é uma plataforma AI API para desenvolvedores, equipes e empresas." } },
    contact: { hero: { eyebrow: "Contato", title: "Suporte, parceria e cobrança por email", desc: "Inclua email da conta, descrição, pedido ou request_id." } },
    faq: { hero: { eyebrow: "FAQ", title: "Perguntas sobre integração, recarga, saldo e cobrança", desc: "Entenda rapidamente serviço, cobrança e suporte do eelapi." } },
    terms: { hero: { eyebrow: "Termos de Serviço", title: "Termos de Serviço", desc: "Regras de uso da plataforma, API, console, saldo e serviços eelapi." } },
    privacy: { hero: { eyebrow: "Política de Privacidade", title: "Política de Privacidade", desc: "Como eelapi trata conta, uso API, cobrança, pagamento e logs de segurança." } },
    refund: { hero: { eyebrow: "Política de Reembolso", title: "Política de Reembolso", desc: "Regras sobre PayPal, recargas manuais, saldo creditado, consumo API e disputas." } },
  },
});

const ru = mergeCopy(en, {
  languageLabel: "Язык",
  nav: { features: "Функции", pricing: "Цены", docs: "API-документация", faq: "FAQ", about: "О нас", contact: "Контакты", login: "Войти", start: "Начать", dashboard: "Консоль" },
  footer: { product: "Продукт", resources: "Ресурсы", company: "Компания", legal: "Правовые документы", supportEmail: "Email поддержки", supportFlow: "Процесс поддержки", description: "eelapi — платформа агрегации и доступа к AI API для разработчиков, команд и компаний.", copyright: "Copyright © 2026 eelapi. Все права защищены.", tagline: "Агрегация AI API, управление использованием и инструменты разработчика." },
  common: { primaryCta: "Начать", pricingCta: "Посмотреть цены", viewDocs: "Документация", pythonExample: "Пример Python", legalSectionEyebrow: "Правовые документы" },
  home: {
    hero: { eyebrow: "Платформа агрегации AI API для разработчиков, команд и компаний", title: "Понятный доступ к AI API и биллинг", desc: "Модели, API Keys, использование и биллинг в одной консоли для разработчиков.", promptPlaceholder: "Спросите о моделях, биллинге и API-интеграции", promptButton: "Найти", promptHint: "Сначала задайте вопрос, затем продолжите в AI-чате после входа.", apiCta: "API-документация", dashboardCta: "Консоль", chips: [{ label: "OpenAI-compatible API", href: "/docs", prompt: "Как подключить OpenAI-compatible API?" }, { label: "Использование и биллинг", href: "/faq", prompt: "Как смотреть использование и биллинг?" }, { label: "Создать API Key", href: "/docs", prompt: "Как создать API Key?" }, { label: "PayPal и баланс", href: "/faq", prompt: "Чем отличается PayPal от баланса аккаунта?" }] },
    stats: [["Аудитория", "Разработчики / Команды / Компании"], ["Возможность", "Доступ и управление AI API"], ["Биллинг", "По использованию, предоплаченный баланс"], ["Поддержка", "{email}"]],
    startHeading: { eyebrow: "Начало", title: "Подключите API и проверьте аккаунт за 4 шага", desc: "Регистрация, API Key, вызов моделей, проверка использования, биллинга и баланса." },
  },
  capabilities: [
    { icon: "code", title: "Единый API-доступ", desc: "Один Base URL и OpenAI-compatible вызовы для нескольких моделей." },
    { icon: "database", title: "Управление моделями", desc: "Алиасы, провайдеры, отображаемые имена и цены в одном месте." },
    { icon: "receipt", title: "Использование и биллинг", desc: "Статус, токены, модель, стоимость и время запроса." },
    { icon: "key", title: "Управление API Key", desc: "Создание, просмотр и отзыв ключей с отображением только префикса." },
    { icon: "message", title: "Онлайн-тестирование", desc: "Проверка сообщений, моделей и ответов до production." },
    { icon: "settings", title: "Операции команды", desc: "Модели, пользователи, заказы, финансы и аномальные запросы." },
  ],
  startSteps: [
    { icon: "users", title: "Зарегистрировать аккаунт", desc: "Создайте аккаунт по email и свяжите ключи, использование и биллинг." },
    { icon: "key", title: "Создать API Key", desc: "Создайте ключ в консоли и храните его безопасно." },
    { icon: "code", title: "Подключить модели", desc: "Настройте модель, единый endpoint и авторизацию." },
    { icon: "receipt", title: "Проверить использование и баланс", desc: "Смотрите статус, модель, токены, стоимость, время и изменения баланса." },
  ],
  pages: {
    features: { hero: { eyebrow: "Функции", title: "Платформа для доступа, управления и биллинга AI API", desc: "Модели, ключи, тесты, использование, баланс и операции в одной консоли." } },
    pricing: { hero: { eyebrow: "Цены и биллинг", title: "Оплата по использованию с предоплаченным балансом", desc: "Стоимость зависит от вызовов AI API, использования моделей и биллинга аккаунта." }, billingLabel: "Биллинг: ", prepayLabel: "Предоплата: ", fitLabel: "Подходит для: " },
    docs: { hero: { eyebrow: "API-документация", title: "Подключайте AI-модели через один Base URL и API Key", desc: "Публичная документация описывает базовый путь интеграции." }, codeTitle: "Пример Python" },
    about: { hero: { eyebrow: "О eelapi", title: "AI API доступ, управление использованием и инструменты разработчика", desc: "eelapi — AI API платформа для разработчиков, команд и компаний." } },
    contact: { hero: { eyebrow: "Контакты", title: "Поддержка, сотрудничество и биллинг по email", desc: "Укажите email аккаунта, описание, заказ или request_id." } },
    faq: { hero: { eyebrow: "FAQ", title: "Вопросы об интеграции, пополнении, балансе и биллинге", desc: "Быстро понять сервис, биллинг и поддержку eelapi." } },
    terms: { hero: { eyebrow: "Условия обслуживания", title: "Условия обслуживания", desc: "Правила использования платформы, API, консоли, баланса и сервисов eelapi." } },
    privacy: { hero: { eyebrow: "Политика конфиденциальности", title: "Политика конфиденциальности", desc: "Как eelapi обрабатывает данные аккаунта, API, биллинга, платежей и безопасности." } },
    refund: { hero: { eyebrow: "Политика возврата", title: "Политика возврата", desc: "Правила PayPal, ручных пополнений, баланса, потребления API и споров." } },
  },
});

const ar = mergeCopy(en, {
  languageLabel: "اللغة",
  nav: { features: "الميزات", pricing: "الأسعار", docs: "وثائق API", faq: "الأسئلة", about: "من نحن", contact: "اتصل بنا", login: "تسجيل الدخول", start: "ابدأ", dashboard: "لوحة التحكم" },
  footer: { product: "المنتج", resources: "الموارد", company: "الشركة", legal: "السياسات", supportEmail: "بريد الدعم", supportFlow: "مسار الدعم", description: "eelapi منصة لتجميع والوصول إلى AI API للمطورين والفرق والشركات.", copyright: "Copyright © 2026 eelapi. جميع الحقوق محفوظة.", tagline: "تجميع AI API وإدارة الاستخدام وأدوات المطورين." },
  common: { primaryCta: "ابدأ", pricingCta: "عرض الأسعار", viewDocs: "عرض الوثائق", pythonExample: "مثال Python", legalSectionEyebrow: "السياسات" },
  home: {
    hero: { eyebrow: "منصة AI API للمطورين والفرق والشركات", title: "وصول AI API وفوترة أوضح", desc: "النماذج ومفاتيح API والاستخدام والفوترة في لوحة واحدة للمطورين والفرق.", promptPlaceholder: "اسأل عن النماذج والفوترة وتكامل API", promptButton: "استكشف", promptHint: "اسأل أولاً ثم تابع في دردشة AI بعد تسجيل الدخول.", apiCta: "وثائق API", dashboardCta: "لوحة التحكم", chips: [{ label: "API متوافق مع OpenAI", href: "/docs", prompt: "كيف أربط API متوافق مع OpenAI؟" }, { label: "الاستخدام والفوترة", href: "/faq", prompt: "كيف أعرض الاستخدام والفوترة؟" }, { label: "إنشاء API Key", href: "/docs", prompt: "كيف أنشئ API Key؟" }, { label: "PayPal ورصيد الحساب", href: "/faq", prompt: "ما الفرق بين PayPal ورصيد الحساب؟" }] },
    stats: [["الجمهور", "مطوّرون / فرق / شركات"], ["القدرة", "وصول وإدارة AI API"], ["الفوترة", "حسب الاستخدام، رصيد مسبق"], ["الدعم", "{email}"]],
    startHeading: { eyebrow: "البدء", title: "اربط API وراجع الحساب في 4 خطوات", desc: "سجّل، أنشئ API Key، استدعِ النماذج، وراجع الاستخدام والفوترة والرصيد." },
  },
  capabilities: [
    { icon: "code", title: "وصول API موحّد", desc: "Base URL واحد ونمط متوافق مع OpenAI لعدة نماذج." },
    { icon: "database", title: "إدارة نماذج متعددة", desc: "إدارة الأسماء والمزوّدين والأسعار من لوحة واحدة." },
    { icon: "receipt", title: "الاستخدام والفوترة", desc: "تسجيل الحالة وtokens والنموذج والتكلفة والوقت." },
    { icon: "key", title: "إدارة API Key", desc: "إنشاء وعرض وإلغاء المفاتيح مع إظهار البادئة فقط." },
    { icon: "message", title: "اختبار عبر الإنترنت", desc: "اختبار الرسائل والنماذج والردود قبل الإنتاج." },
    { icon: "settings", title: "إدارة الفريق", desc: "إدارة النماذج والمستخدمين والطلبات والمالية والطلبات غير الطبيعية." },
  ],
  startSteps: [
    { icon: "users", title: "تسجيل حساب", desc: "أنشئ حساباً بالبريد واربط المفاتيح والاستخدام والفوترة." },
    { icon: "key", title: "إنشاء API Key", desc: "أنشئ المفتاح في لوحة التحكم واحفظه بأمان." },
    { icon: "code", title: "ربط النماذج", desc: "اضبط النموذج ونقطة النهاية الموحدة والمصادقة." },
    { icon: "receipt", title: "مراجعة الاستخدام والفوترة والرصيد", desc: "راجع الحالة والنموذج وtokens والتكلفة والوقت وتغيّر الرصيد." },
  ],
  pages: {
    features: { hero: { eyebrow: "الميزات", title: "منصة للمطورين للوصول إلى AI API وإدارتها وفوترتها", desc: "نماذج، مفاتيح، اختبارات، استخدام، رصيد وتشغيل في لوحة واضحة." } },
    pricing: { hero: { eyebrow: "الأسعار والفوترة", title: "تسوية حسب الاستخدام مع رصيد حساب مسبق", desc: "تعتمد التكلفة على استدعاءات AI API واستخدام النماذج وفوترة الحساب." }, billingLabel: "الفوترة: ", prepayLabel: "الرصيد المسبق: ", fitLabel: "مناسب لـ: " },
    docs: { hero: { eyebrow: "وثائق API", title: "اربط نماذج AI عبر Base URL واحد و API Key", desc: "تشرح الوثائق العامة مسار التكامل الأساسي." }, codeTitle: "مثال Python" },
    about: { hero: { eyebrow: "عن eelapi", title: "الوصول إلى AI API وإدارة الاستخدام وتجربة المطور", desc: "eelapi منصة AI API للمطورين والفرق والشركات." } },
    contact: { hero: { eyebrow: "اتصل بنا", title: "الدعم والتعاون والفوترة عبر البريد", desc: "أرسل بريد الحساب والوصف ورقم الطلب أو request_id." } },
    faq: { hero: { eyebrow: "الأسئلة الشائعة", title: "أسئلة حول التكامل والشحن والرصيد والفوترة", desc: "افهم خدمة eelapi والفوترة والدعم بسرعة." } },
    terms: { hero: { eyebrow: "شروط الخدمة", title: "شروط الخدمة", desc: "قواعد استخدام منصة eelapi و API ولوحة التحكم والرصيد والخدمات." } },
    privacy: { hero: { eyebrow: "سياسة الخصوصية", title: "سياسة الخصوصية", desc: "كيف تعالج eelapi معلومات الحساب واستخدام API والفوترة والدفع وسجلات الأمان." } },
    refund: { hero: { eyebrow: "سياسة الاسترداد", title: "سياسة الاسترداد", desc: "قواعد PayPal والشحن اليدوي والرصيد واستهلاك API والنزاعات." } },
  },
});

export const translations: Record<LanguageCode, MarketingCopy> = {
  zh,
  en,
  ja,
  ko,
  es,
  fr,
  de,
  pt,
  ru,
  ar,
};
