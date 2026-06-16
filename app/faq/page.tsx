import type { Metadata } from "next";

import { MarketingStaticPage } from "@/components/marketing-site";

export const metadata: Metadata = {
  title: "常见问题 | 电鳗 eelapi",
  description: "电鳗 eelapi 常见问题，说明平台定位、API 接入、API Key、充值方式、到账时间、用量账单、支持和退款规则。",
};

export default function FaqPage() {
  return <MarketingStaticPage page="faq" />;
}
