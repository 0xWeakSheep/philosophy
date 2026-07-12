import { LandingPage } from "@/components/landing/landing-page";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "意识形态镜室",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  inLanguage: "zh-CN",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  description:
    "从一个具体判断出发，回答四个可选择、可改写的哲学问题，生成思想角色、临时主义名、四位坐标与独特卡通画像。",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "CNY",
  },
  featureList: [
    "可编辑的动态候选回答",
    "16 个可认领的思想角色",
    "4⁴ 共 256 种世界观坐标",
    "四轴组合生成的卡通角色画像",
    "唯一主义名与几何徽记",
    "原话证据与反例",
    "可撤回的私密会话",
  ],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      <LandingPage />
    </>
  );
}
