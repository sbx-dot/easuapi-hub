import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "电鳗 eelapi | AI API 开发者平台",
    template: "%s | 电鳗 eelapi",
  },
  description:
    "电鳗 eelapi 是面向开发者、团队和企业的 AI API 聚合接入与管理平台，提供模型接入、API Key、AI Console、用量记录、余额账单和控制台管理能力。",
  icons: {
    icon: "/logo-eelapi.png",
    shortcut: "/logo-eelapi.png",
    apple: "/logo-eelapi.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
