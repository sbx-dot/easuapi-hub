import type { Metadata } from "next";

import { MarketingStaticPage } from "@/components/marketing-site";

export const metadata: Metadata = {
  title: "关于我们 | 电鳗 eelapi",
  description: "电鳗 eelapi 是专注 AI API 接入、用量管理和开发者工具体验的平台。",
};

export default function AboutPage() {
  return <MarketingStaticPage page="about" />;
}
