import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "意识形态镜室｜看见一句话如何成为一个世界",
    template: "%s｜意识形态镜室",
  },
  description:
    "带一件反复发生的关系困境进来。用几次克制的追问，看见你话里的规则、真实、感受与方向。",
  applicationName: "意识形态镜室",
  keywords: ["自我探索", "关系困境", "哲学", "意义结构", "反思工具"],
  authors: [{ name: "意识形态镜室" }],
  creator: "意识形态镜室",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    title: "意识形态镜室",
    description: "不是告诉你是谁，而是让你看见自己怎样理解正在发生的事。",
    siteName: "意识形态镜室",
  },
  robots: {
    index: true,
    follow: true,
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
