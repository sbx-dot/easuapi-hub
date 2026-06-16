import type { Metadata } from "next";

import { MarketingStaticPage } from "@/components/marketing-site";

export const metadata: Metadata = {
  title: "退款政策 | 电鳗 eelapi",
  description: "电鳗 eelapi 退款政策，说明 PayPal 支付、微信/支付宝人工审核充值、余额到账、已消耗余额和争议处理规则。",
};

export default function RefundPolicyPage() {
  return <MarketingStaticPage page="refund" />;
}
