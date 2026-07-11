import { ImageResponse } from "next/og";

export const alt = "意识形态镜室，四面镜子，一扇窗";
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
          opacity: 0.28,
          backgroundImage:
            "linear-gradient(rgba(230,232,229,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(230,232,229,.16) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
        }}
      />
      <div
        style={{
          width: "62%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", color: "#cf6a5b", fontSize: 22 }}>四面镜子，一扇窗</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 68, lineHeight: 1.18 }}>
          <div style={{ display: "flex" }}>你反复遇到的，</div>
          <div style={{ display: "flex" }}>可能是同一个世界</div>
        </div>
        <div style={{ display: "flex", color: "#a5aaa7", fontSize: 23 }}>
          看见自己的话，怎样一步步变成一个世界。
        </div>
      </div>
      <div
        style={{
          width: "38%",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          position: "relative",
        }}
      >
        <div style={{ width: 330, height: 370, display: "flex", flexWrap: "wrap", gap: 10 }}>
          {["场域", "本体", "现象", "目的"].map((label, index) => (
            <div
              key={label}
              style={{
                width: 160,
                height: 180,
                display: "flex",
                alignItems: "flex-end",
                padding: 18,
                border: "1px solid rgba(230,232,229,.28)",
                background: index === 1 ? "#252b29" : "rgba(29,33,31,.7)",
                color: index === 3 ? "#cf6a5b" : "#e6e8e5",
                fontSize: 20,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>,
    size,
  );
}
