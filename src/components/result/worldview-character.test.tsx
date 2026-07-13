import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createWorldviewProfile, type WorldviewSignal } from "@/lib/worldview-profile";
import { WorldviewCharacter } from "./worldview-character";

const SIGNALS = [
  "order",
  "conflict",
  "center",
  "open",
] as const satisfies readonly WorldviewSignal[];

function allProfiles() {
  return SIGNALS.flatMap((field) =>
    SIGNALS.flatMap((ontology) =>
      SIGNALS.flatMap((phenomenology) =>
        SIGNALS.map((teleology) =>
          createWorldviewProfile([
            { dimension: "field", signal: field },
            { dimension: "ontology", signal: ontology },
            { dimension: "phenomenology", signal: phenomenology },
            { dimension: "teleology", signal: teleology },
          ]),
        ),
      ),
    ),
  );
}

describe("WorldviewCharacter", () => {
  it("renders every combination with finite SVG geometry and a unique consumed fingerprint", () => {
    const fingerprints = new Set<string>();

    for (const profile of allProfiles()) {
      const markup = renderToStaticMarkup(<WorldviewCharacter embedded profile={profile} />);
      expect(markup).not.toMatch(/(?:NaN|undefined)/u);
      expect(markup).toContain(
        `data-character-pose="pose-${profile.emblem[0]}-${profile.emblem[3]}"`,
      );
      const fingerprint = markup.match(/data-character-fingerprint="([^"]+)"/u)?.[1];
      expect(fingerprint).toBeDefined();
      if (fingerprint !== undefined) fingerprints.add(fingerprint);
    }

    expect(fingerprints).toHaveLength(256);
  });
});
