import type { Metadata } from "next";

import { MarketingStaticPage } from "@/components/marketing-site";

export const metadata: Metadata = {
  title: "接入代码 / 文档 | 电鳗 eelapi",
  description: "电鳗 eelapi 的基础 API 接入说明、鉴权方式、模型调用示例和用量账单说明。",
};

export default function DocsPage() {
  return <MarketingStaticPage page="docs" />;
}
