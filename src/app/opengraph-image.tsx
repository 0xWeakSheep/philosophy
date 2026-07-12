import { ImageResponse } from "next/og";

export const alt = "意识形态镜室，四个问题生成你的思想角色与卡通画像";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#151817",
        color: "#e6e8e5",
        padding: 64,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          opacity: 0.25,
          backgroundImage:
            "linear-gradient(rgba(230,232,229,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(230,232,229,.14) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
        }}
      />

      <div
        style={{
          width: "64%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          paddingRight: 40,
        }}
      >
        <div style={{ display: "flex", color: "#cf6a5b", fontSize: 24 }}>
          世界观角色生成器 · 约 5 分钟
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", color: "#a5aaa7", fontSize: 31 }}>我的思想角色</div>
          <div style={{ display: "flex", marginTop: 12, fontSize: 78, lineHeight: 1.08 }}>
            意义守灯人
          </div>
          <div style={{ display: "flex", marginTop: 24, color: "#cf6a5b", fontSize: 28 }}>
            枢域实核·澄镜守衡主义 · 3–1–1–1
          </div>
        </div>
        <div style={{ display: "flex", color: "#a5aaa7", fontSize: 23 }}>
          16 个角色 · 256 种画像 · 每次只描述一个议题
        </div>
      </div>

      <div
        style={{
          width: "36%",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "flex-end",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 360,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
            border: "1px solid rgba(230,232,229,.32)",
            background: "rgba(29,33,31,.88)",
            padding: "24px 24px 20px",
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              color: "#a5aaa7",
              fontSize: 17,
            }}
          >
            <div style={{ display: "flex" }}>星核家族</div>
            <div style={{ display: "flex", color: "#cf6a5b" }}>4⁴ / 256</div>
          </div>

          <div
            style={{
              width: 290,
              height: 350,
              display: "flex",
              position: "relative",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 250,
                height: 250,
                border: "2px solid rgba(207,106,91,.55)",
                borderRadius: 999,
                background: "rgba(207,106,91,.13)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 12,
                width: 250,
                height: 34,
                border: "2px solid rgba(230,232,229,.72)",
                borderRadius: "50%",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 30,
                width: 145,
                height: 160,
                border: "4px solid #e6e8e5",
                background: "#222725",
                clipPath: "polygon(12% 0,88% 0,100% 100%,0 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 58,
                width: 112,
                height: 112,
                border: "4px solid #e6e8e5",
                borderRadius: 38,
                background: "#1b201e",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 36,
                width: 132,
                height: 26,
                border: "4px solid #e6e8e5",
                background: "#151817",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 25,
                width: 72,
                height: 22,
                border: "4px solid #e6e8e5",
                background: "#151817",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 86,
                left: 87,
                width: 48,
                height: 35,
                border: "4px solid #e6e8e5",
                borderRadius: 9,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 86,
                right: 87,
                width: 48,
                height: 35,
                border: "4px solid #e6e8e5",
                borderRadius: 9,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 100,
                left: 105,
                width: 7,
                height: 7,
                borderRadius: 99,
                background: "#cf6a5b",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 100,
                right: 105,
                width: 7,
                height: 7,
                borderRadius: 99,
                background: "#cf6a5b",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 140,
                width: 42,
                height: 12,
                borderBottom: "4px solid #e6e8e5",
                borderRadius: "0 0 50% 50%",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 78,
                width: 55,
                height: 55,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "3px solid #e6e8e5",
                borderRadius: 99,
                color: "#cf6a5b",
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  display: "flex",
                  border: "3px solid #cf6a5b",
                  transform: "rotate(45deg)",
                }}
              />
            </div>
          </div>

          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(230,232,229,.2)",
              paddingTop: 16,
            }}
          >
            <div style={{ display: "flex", fontSize: 25 }}>意义守灯人</div>
            <div style={{ display: "flex", color: "#cf6a5b", fontSize: 20 }}>3–1–1–1</div>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
