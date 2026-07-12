import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "意识形态镜室｜4 个问题生成你的思想角色",
    template: "%s｜意识形态镜室",
  },
  description:
    "回答 4 个可选择、可改写的问题，生成思想角色、临时主义名、四位坐标和独特卡通画像；结果只描述本次议题，不是固定人格。",
  applicationName: "意识形态镜室",
  keywords: [
    "世界观测试",
    "世界观坐标",
    "思想角色",
    "哲学角色",
    "哲学人格测试",
    "唯心主义测试",
    "唯物主义测试",
    "哲学测试",
    "认知偏见",
    "因果判断",
    "思想实验",
  ],
  authors: [{ name: "意识形态镜室" }],
  creator: "意识形态镜室",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    title: "意识形态镜室｜生成你的思想角色",
    description: "16 个思想角色，256 种卡通画像：一个称号、一种临时主义、一枚四位坐标。",
    siteName: "意识形态镜室",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "意识形态镜室" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "意识形态镜室｜生成你的思想角色",
    description: "四个问题，生成角色称号、临时主义、四位坐标与独特卡通画像。",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f3f1" },
    { media: "(prefers-color-scheme: dark)", color: "#151817" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body className="paper-grain">
        <a className="skip-link" href="#main-content">
          跳到主要内容
        </a>
        {children}
      </body>
    </html>
  );
}
