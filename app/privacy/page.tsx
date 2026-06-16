import type { Metadata } from "next";

import { MarketingStaticPage } from "@/components/marketing-site";

export const metadata: Metadata = {
  title: "隐私政策 | 电鳗 eelapi",
  description: "电鳗 eelapi 隐私政策，说明账号信息、API 使用数据、账单数据和安全日志的处理方式。",
};

export default function PrivacyPage() {
  return <MarketingStaticPage page="privacy" />;
}
