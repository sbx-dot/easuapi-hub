import type { Metadata } from "next";

import { MarketingStaticPage } from "@/components/marketing-site";

export const metadata: Metadata = {
  title: "模型目录 | 电鳗 eelapi",
  description: "浏览电鳗 eelapi 支持的 AI 模型目录，按厂商、能力、平台标签和接入特性筛选模型。",
};

export default function ModelsPage() {
  return <MarketingStaticPage page="models" />;
}
