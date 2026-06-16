import type { Metadata } from "next";

import { MarketingStaticPage } from "@/components/marketing-site";

export const metadata: Metadata = {
  title: "价格 | 电鳗 eelapi",
  description: "电鳗 eelapi 提供入门版、开发者版和团队版，支持按量计费与预充值账户余额。",
};

export default function PricingPage() {
  return <MarketingStaticPage page="pricing" />;
}
