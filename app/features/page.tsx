import type { Metadata } from "next";

import { MarketingStaticPage } from "@/components/marketing-site";

export const metadata: Metadata = {
  title: "功能 | 电鳗 eelapi",
  description: "了解电鳗 eelapi 的统一 API 接入、模型管理、API Key 管理、接口调试、用量记录、充值账单和后台运营能力。",
};

export default function FeaturesPage() {
  return <MarketingStaticPage page="features" />;
}
