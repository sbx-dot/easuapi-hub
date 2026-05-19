import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "电鳗 eelapi",
  description: "电鳗 eelapi 多模型 AI API 聚合网关演示控制台",
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
