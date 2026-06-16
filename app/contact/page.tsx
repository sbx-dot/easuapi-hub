import type { Metadata } from "next";

import { MarketingStaticPage } from "@/components/marketing-site";

export const metadata: Metadata = {
  title: "联系我们 | 电鳗 eelapi",
  description: "联系电鳗 eelapi 获取客户支持、商务合作和账户账单协助。",
};

export default function ContactPage() {
  return <MarketingStaticPage page="contact" />;
}
