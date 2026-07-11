import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#151817",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          transform: "rotate(-2deg)",
        }}
      >
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            style={{
              width: 17,
              height: 17,
              border: `1px solid ${index === 3 ? "#cf6a5b" : "#e6e8e5"}`,
              background: index === 1 ? "#313735" : "transparent",
            }}
          />
        ))}
      </div>
    </div>,
    size,
  );
}
