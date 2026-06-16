import type { Metadata } from "next";

import { MarketingStaticPage } from "@/components/marketing-site";

export const metadata: Metadata = {
  title: "服务条款 | 电鳗 eelapi",
  description: "电鳗 eelapi 服务条款，说明账号、API 使用、账单、禁止行为、服务变更和责任限制。",
};

export default function TermsPage() {
  return <MarketingStaticPage page="terms" />;
}
