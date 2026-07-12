"use client";

import { useId } from "react";

export type WorldviewCharacterAxisValue = 0 | 1 | 2 | 3;

export interface WorldviewCharacterAxis {
  readonly key: string;
  readonly label?: string;
  readonly value: number;
  readonly stateName?: string;
}

export interface WorldviewCharacterProfile {
  readonly code: string;
  readonly name: string;
  readonly archetypeTitle: string;
  readonly archetypeFamily: string;
  readonly axes: readonly WorldviewCharacterAxis[];
  readonly emblem: readonly number[];
  readonly traits: readonly string[];
}

interface WorldviewCharacterProps {
  readonly profile: WorldviewCharacterProfile;
  readonly embedded?: boolean;
}

type CharacterAxisKey = "field" | "ontology" | "phenomenology" | "teleology";
type CharacterValues = readonly [
  WorldviewCharacterAxisValue,
  WorldviewCharacterAxisValue,
  WorldviewCharacterAxisValue,
  WorldviewCharacterAxisValue,
];

const CHARACTER_AXIS_ORDER = [
  "field",
  "ontology",
  "phenomenology",
  "teleology",
] as const satisfies readonly CharacterAxisKey[];

const CHARACTER_AXIS_LABELS = {
  field: "场",
  ontology: "本",
  phenomenology: "现",
  teleology: "目",
} as const satisfies Record<CharacterAxisKey, string>;

const CHARACTER_VARIANT_NAMES = {
  field: ["秩序庭", "张力台", "中心坛", "旷野门"],
  ontology: ["方碑冠", "裂片冠", "核心环", "未定帽"],
  phenomenology: ["澄明镜", "复调镜", "凝视镜", "游观眼"],
  teleology: ["守衡册", "破界叉", "归心灯", "创生图"],
} as const satisfies Record<CharacterAxisKey, readonly [string, string, string, string]>;

const SIGIL_SLOTS = [0, 1, 2, 3] as const;

function clampValue(value: number | undefined): WorldviewCharacterAxisValue {
  return Math.min(3, Math.max(0, Math.round(value ?? 0))) as WorldviewCharacterAxisValue;
}

function findAxisValue(
  profile: WorldviewCharacterProfile,
  key: CharacterAxisKey,
  fallbackIndex: number,
): WorldviewCharacterAxisValue {
  const axis =
    profile.axes.find((candidate) => candidate.key === key) ?? profile.axes[fallbackIndex];
  return clampValue(axis?.value ?? profile.emblem[fallbackIndex]);
}

function displayCode(code: string): string {
  const digits = code.match(/[1-4]/gu)?.slice(0, 4);
  return digits?.length === 4 ? digits.join("–") : code;
}

function radialPoints(
  centerX: number,
  centerY: number,
  lobes: number,
  outerRadius: number,
  innerRadius: number,
  rotation: number,
): string {
  return Array.from({ length: lobes * 2 }, (_, pointIndex) => {
    const angle = rotation + (pointIndex * Math.PI) / lobes;
    const radius = pointIndex % 2 === 0 ? outerRadius : innerRadius;
    return `${(centerX + Math.cos(angle) * radius).toFixed(1)},${(
      centerY + Math.sin(angle) * radius
    ).toFixed(1)}`;
  }).join(" ");
}

function FieldScene({ value, gridId }: { value: WorldviewCharacterAxisValue; gridId: string }) {
  if (value === 0) {
    return (
      <g>
        <rect x="72" y="106" width="616" height="346" fill={`url(#${gridId})`} opacity="0.72" />
        <path
          d="M82 430H678V463H630V486H130V463H82Z"
          fill="var(--surface-solid)"
          stroke="var(--ink)"
          strokeWidth="3"
        />
        <path d="M130 463H630M190 430V463M570 430V463" stroke="var(--line-strong)" />
        <path d="M102 135H163V196H102ZM597 135H658V196H597Z" fill="var(--accent-soft)" />
        <path
          d="M102 135H163V196H102ZM597 135H658V196H597Z"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
        />
      </g>
    );
  }

  if (value === 1) {
    return (
      <g>
        <path d="M62 128L293 94L257 430L62 454Z" fill="var(--accent-soft)" />
        <path d="M698 128L467 94L503 430L698 454Z" fill="var(--surface)" />
        <path
          d="M67 151L255 122M63 206L250 174M59 262L246 229M701 151L510 122M703 206L515 174M706 262L520 229"
          stroke="var(--line-strong)"
          strokeWidth="2"
        />
        <path
          d="M83 431L337 413L362 476L119 490ZM677 431L423 413L398 476L641 490Z"
          fill="var(--surface-solid)"
          stroke="var(--ink)"
          strokeWidth="3"
        />
        <path
          d="M366 103L347 170L377 208L350 276L382 326L360 411"
          stroke="var(--accent)"
          strokeWidth="4"
        />
      </g>
    );
  }

  if (value === 2) {
    return (
      <g>
        <circle cx="380" cy="284" r="190" fill="var(--accent-soft)" />
        <circle cx="380" cy="284" r="142" fill="none" stroke="var(--line-strong)" strokeWidth="2" />
        <circle cx="380" cy="284" r="94" fill="none" stroke="var(--accent)" strokeWidth="2" />
        <path d="M380 76V126M380 442V492M172 284H222M538 284H588" stroke="var(--line-strong)" />
        <ellipse
          cx="380"
          cy="475"
          rx="226"
          ry="28"
          fill="var(--surface-solid)"
          stroke="var(--ink)"
          strokeWidth="3"
        />
        <ellipse
          cx="380"
          cy="470"
          rx="145"
          ry="15"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
        />
      </g>
    );
  }

  return (
    <g>
      <path
        d="M154 441V220C154 128 223 87 304 87H456C537 87 606 128 606 220V441"
        fill="var(--surface)"
        stroke="var(--line-strong)"
        strokeWidth="3"
      />
      <path
        d="M266 440C271 358 317 306 380 278C443 306 489 358 494 440"
        fill="var(--accent-soft)"
      />
      <path
        d="M239 480C282 431 329 401 380 391C431 401 478 431 521 480"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3"
      />
      <path d="M120 483H640" stroke="var(--ink)" strokeWidth="3" />
      <g className="worldview-character__motes" fill="var(--accent)">
        <rect x="117" y="170" width="10" height="10" />
        <circle cx="641" cy="205" r="6" />
        <path d="M588 120L596 136L580 136Z" />
      </g>
    </g>
  );
}

function HeadVariant({ value }: { value: WorldviewCharacterAxisValue }) {
  if (value === 0) {
    return (
      <g>
        <rect
          x="322"
          y="153"
          width="116"
          height="126"
          rx="37"
          fill="var(--paper)"
          stroke="var(--ink)"
          strokeWidth="4"
        />
        <path d="M318 177H442V206L422 183H338L318 206Z" fill="var(--ink)" />
        <path
          d="M313 146H447V169H420V145H340V169H313Z"
          fill="var(--accent)"
          stroke="var(--ink)"
          strokeWidth="4"
        />
        <path
          d="M340 132H420V151H340Z"
          fill="var(--surface-solid)"
          stroke="var(--ink)"
          strokeWidth="4"
        />
      </g>
    );
  }

  if (value === 1) {
    return (
      <g>
        <path
          d="M380 146C421 146 447 175 443 218C440 251 420 280 380 284C340 280 320 251 317 218C313 175 339 146 380 146Z"
          fill="var(--paper)"
          stroke="var(--ink)"
          strokeWidth="4"
        />
        <path d="M380 145C340 136 316 150 300 178L348 174L380 198Z" fill="var(--ink)" />
        <path d="M380 145C420 136 444 150 460 178L412 174L380 198Z" fill="var(--accent)" />
        <path d="M380 132V188" stroke="var(--paper)" strokeWidth="3" />
        <path
          d="M319 204L301 225L323 232M441 204L459 225L437 232"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="4"
        />
      </g>
    );
  }

  if (value === 2) {
    return (
      <g>
        <circle cx="380" cy="216" r="64" fill="var(--paper)" stroke="var(--ink)" strokeWidth="4" />
        <path d="M329 187C342 142 418 142 431 187C407 173 353 173 329 187Z" fill="var(--ink)" />
        <circle cx="380" cy="139" r="35" fill="none" stroke="var(--accent)" strokeWidth="5" />
        <circle cx="380" cy="139" r="7" fill="var(--accent)" />
        <path d="M353 133H407" stroke="var(--ink)" strokeWidth="4" />
      </g>
    );
  }

  return (
    <g>
      <path
        d="M309 221C305 169 332 133 382 137C431 127 458 159 451 208C464 250 430 287 380 286C329 289 298 255 309 221Z"
        fill="var(--surface-solid)"
        stroke="var(--ink)"
        strokeWidth="4"
      />
      <ellipse
        cx="380"
        cy="218"
        rx="57"
        ry="64"
        fill="var(--paper)"
        stroke="var(--ink)"
        strokeWidth="3"
      />
      <path
        d="M318 181C329 137 379 111 436 143C409 148 389 157 377 180C361 163 342 164 318 181Z"
        fill="var(--accent)"
      />
      <path d="M436 143C452 153 458 176 455 198" fill="none" stroke="var(--ink)" strokeWidth="4" />
      <path
        d="M434 160L472 139L455 188Z"
        fill="var(--paper-deep)"
        stroke="var(--ink)"
        strokeWidth="3"
      />
    </g>
  );
}

function ExpressionVariant({ value }: { value: WorldviewCharacterAxisValue }) {
  if (value === 0) {
    return (
      <g>
        <g fill="var(--surface)" stroke="var(--ink)" strokeWidth="3">
          <rect x="337" y="203" width="38" height="29" rx="8" />
          <rect x="385" y="203" width="38" height="29" rx="8" />
          <path d="M375 213H385" />
        </g>
        <g className="worldview-character__blink" fill="var(--ink)">
          <circle cx="357" cy="217" r="4" />
          <circle cx="404" cy="217" r="4" />
        </g>
        <path
          d="M364 251C374 256 386 256 397 251"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (value === 1) {
    return (
      <g>
        <g fill="var(--accent-soft)" stroke="var(--ink)" strokeWidth="3">
          <circle cx="354" cy="217" r="18" />
          <circle cx="407" cy="217" r="18" />
          <path d="M372 213C377 209 382 209 389 213" fill="none" />
        </g>
        <g className="worldview-character__blink" fill="var(--ink)">
          <circle cx="359" cy="218" r="4" />
          <circle cx="402" cy="218" r="4" />
        </g>
        <path
          d="M337 191L364 187M393 188L421 194"
          stroke="var(--ink)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M370 249C378 242 389 244 394 254C385 258 376 257 370 249Z"
          fill="var(--accent)"
          stroke="var(--ink)"
          strokeWidth="2"
        />
      </g>
    );
  }

  if (value === 2) {
    return (
      <g>
        <circle
          cx="354"
          cy="214"
          r="25"
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeWidth="4"
        />
        <path d="M336 232L322 260" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
        <g className="worldview-character__blink" fill="var(--ink)">
          <circle cx="354" cy="214" r="5" />
          <path d="M394 216Q407 206 420 216Q407 224 394 216Z" />
        </g>
        <path d="M393 190L421 187" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
        <path d="M369 252H397" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  }

  return (
    <g>
      <g
        className="worldview-character__blink"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="4"
        strokeLinecap="round"
      >
        <path d="M340 216Q354 204 368 216" />
        <path d="M392 216Q406 204 420 216" />
      </g>
      <path
        d="M365 246Q380 263 397 246"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <g fill="var(--accent)">
        <circle cx="338" cy="239" r="2.5" />
        <circle cx="347" cy="242" r="2.5" />
        <circle cx="414" cy="239" r="2.5" />
        <circle cx="423" cy="242" r="2.5" />
      </g>
    </g>
  );
}

function PurposeArms({ value }: { value: WorldviewCharacterAxisValue }) {
  const sleeveStyle = {
    fill: "none",
    stroke: "var(--surface-solid)",
    strokeLinecap: "round" as const,
    strokeWidth: 27,
  };
  const outlineStyle = {
    fill: "none",
    stroke: "var(--ink)",
    strokeLinecap: "round" as const,
    strokeWidth: 35,
  };

  if (value === 0) {
    return (
      <g>
        <path d="M326 330Q338 365 353 389" style={outlineStyle} />
        <path d="M434 330Q422 365 407 389" style={outlineStyle} />
        <path d="M326 330Q338 365 353 389" style={sleeveStyle} />
        <path d="M434 330Q422 365 407 389" style={sleeveStyle} />
      </g>
    );
  }

  if (value === 1) {
    return (
      <g>
        <path d="M326 333Q299 298 287 249" style={outlineStyle} />
        <path d="M434 333Q466 344 493 372" style={outlineStyle} />
        <path d="M326 333Q299 298 287 249" style={sleeveStyle} />
        <path d="M434 333Q466 344 493 372" style={sleeveStyle} />
      </g>
    );
  }

  if (value === 2) {
    return (
      <g>
        <path d="M326 339Q300 377 321 411" style={outlineStyle} />
        <path d="M434 338Q459 360 474 397" style={outlineStyle} />
        <path d="M326 339Q300 377 321 411" style={sleeveStyle} />
        <path d="M434 338Q459 360 474 397" style={sleeveStyle} />
      </g>
    );
  }

  return (
    <g>
      <path d="M326 334Q290 330 255 351" style={outlineStyle} />
      <path d="M434 334Q469 317 497 287" style={outlineStyle} />
      <path d="M326 334Q290 330 255 351" style={sleeveStyle} />
      <path d="M434 334Q469 317 497 287" style={sleeveStyle} />
    </g>
  );
}

function PurposeProp({ value }: { value: WorldviewCharacterAxisValue }) {
  if (value === 0) {
    return (
      <g>
        <rect
          x="345"
          y="357"
          width="70"
          height="76"
          rx="4"
          fill="var(--paper)"
          stroke="var(--ink)"
          strokeWidth="4"
        />
        <path d="M357 376H403M357 391H389M357 406H398" stroke="var(--accent)" strokeWidth="3" />
        <circle cx="351" cy="391" r="9" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
        <circle cx="409" cy="391" r="9" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
      </g>
    );
  }

  if (value === 1) {
    return (
      <g>
        <circle cx="287" cy="246" r="10" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
        <path
          d="M287 240V172M268 166V191M306 166V191M268 190Q287 207 306 190"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="5"
          strokeLinecap="square"
        />
        <circle cx="493" cy="372" r="10" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
        <path
          d="M503 367L536 347L527 384Z"
          fill="var(--accent)"
          stroke="var(--ink)"
          strokeWidth="3"
        />
      </g>
    );
  }

  if (value === 2) {
    return (
      <g>
        <circle cx="321" cy="411" r="10" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
        <circle cx="474" cy="397" r="10" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
        <path d="M474 405V421" stroke="var(--ink)" strokeWidth="4" />
        <path
          d="M445 423H503L491 471H457Z"
          fill="var(--accent-soft)"
          stroke="var(--ink)"
          strokeWidth="4"
        />
        <circle cx="474" cy="445" r="15" fill="var(--accent)" />
        <path d="M462 423Q474 406 486 423" fill="none" stroke="var(--ink)" strokeWidth="4" />
      </g>
    );
  }

  return (
    <g>
      <circle cx="255" cy="351" r="10" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
      <path
        d="M201 333L256 341L228 356L246 374Z"
        fill="var(--paper)"
        stroke="var(--ink)"
        strokeWidth="3"
      />
      <circle cx="497" cy="287" r="10" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
      <path d="M500 279L528 246" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
      <path d="M524 242L535 231L530 247Z" fill="var(--ink)" />
      <path
        d="M465 305L510 315L504 351L459 341Z"
        fill="var(--paper)"
        stroke="var(--ink)"
        strokeWidth="3"
      />
      <path
        d="M469 316L482 326L493 319L505 332"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
      />
    </g>
  );
}

function LegVariant({
  field,
  teleology,
}: {
  field: WorldviewCharacterAxisValue;
  teleology: WorldviewCharacterAxisValue;
}) {
  const legStyle = {
    fill: "none",
    stroke: "var(--ink)",
    strokeLinecap: "round" as const,
    strokeWidth: 20,
  };
  const shoeStyle = {
    stroke: "var(--accent)",
    strokeLinecap: "square" as const,
    strokeWidth: 16,
  };

  if (field === 0) {
    return (
      <g>
        <path d="M350 430L342 484" style={legStyle} />
        <path d="M410 430L418 484" style={legStyle} />
        <path d="M322 489H354" style={shoeStyle} />
        <path d="M406 489H438" style={shoeStyle} />
      </g>
    );
  }

  if (field === 1) {
    return (
      <g>
        <path d="M349 429Q324 454 308 483" style={legStyle} />
        <path d="M413 429Q449 451 470 479" style={legStyle} />
        <path d="M286 486H324" style={shoeStyle} />
        <path d="M454 484H492" style={shoeStyle} />
      </g>
    );
  }

  if (field === 2) {
    return (
      <g>
        <path d="M350 430Q369 454 362 487" style={legStyle} />
        <path d="M410 430Q389 455 399 487" style={legStyle} />
        <path d="M341 491H374" style={shoeStyle} />
        <path d="M388 491H422" style={shoeStyle} />
        <circle cx="380" cy={teleology === 2 ? 463 : 475} r="5" fill="var(--accent)" />
      </g>
    );
  }

  return (
    <g>
      <path d="M351 430Q320 448 286 466" style={legStyle} />
      <path d="M409 430Q449 438 486 457" style={legStyle} />
      <path d="M263 468H300" style={shoeStyle} />
      <path d="M471 460H508" style={shoeStyle} />
      <path
        d="M311 471Q380 501 450 471"
        fill="none"
        stroke="var(--line-strong)"
        strokeWidth="2"
        strokeDasharray="5 8"
      />
    </g>
  );
}

function BodyVariant({ values, gradientId }: { values: CharacterValues; gradientId: string }) {
  const [field, ontology, phenomenology, teleology] = values;
  const bodyPaths = [
    "M324 307Q380 281 436 307L454 448Q380 472 306 448Z",
    "M311 316Q381 274 449 316L432 456Q382 468 329 456Z",
    "M333 300Q380 271 427 300L468 435Q381 484 292 435Z",
    "M305 326Q380 282 455 326L485 439Q380 459 275 439Z",
  ] as const;
  const seamPaths = [
    "M323 308L380 352L437 308M380 352V451",
    "M314 318L375 342L448 318M375 342L362 454",
    "M334 302Q380 341 426 302M380 342V458M315 418Q380 446 445 418",
    "M304 329Q380 359 456 329M351 346L330 443M408 346L432 443",
  ] as const;
  const collarPaths = [
    "M335 295Q380 319 425 295L418 319Q380 338 342 319Z",
    "M329 302L380 329L432 302L421 333Q380 349 339 333Z",
    "M344 291Q380 315 416 291L432 314Q380 350 328 314Z",
    "M319 309L380 289L441 309L421 329Q380 317 339 329Z",
  ] as const;
  const symbolX = 330 + ontology * 32;
  const symbolY = 413 - phenomenology * 11;

  return (
    <g>
      <path d={bodyPaths[field]} fill={`url(#${gradientId})`} stroke="var(--ink)" strokeWidth="4" />
      <path d={seamPaths[teleology]} fill="none" stroke="var(--line-strong)" strokeWidth="3" />
      <path d={collarPaths[ontology]} fill="var(--accent)" stroke="var(--ink)" strokeWidth="3" />
      <g opacity={0.75}>
        <rect
          x={symbolX}
          y={symbolY}
          width={18 + field * 4}
          height={18 + teleology * 3}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <path
          d={`M${symbolX + 5} ${symbolY + 14}Q${symbolX + 14 + phenomenology * 2} ${
            symbolY - 3
          } ${symbolX + 25 + field * 2} ${symbolY + 14}`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
        />
      </g>
    </g>
  );
}

function ChestSigil({ values }: { values: CharacterValues }) {
  const [field, ontology, phenomenology, teleology] = values;
  const lobes = 3 + field;
  const rotation = -Math.PI / 2 + ontology * (Math.PI / 8);
  const outerRadius = 17 + phenomenology * 2;
  const innerRadius = 7 + ontology * 1.8;
  const satelliteCount = teleology + 1;

  return (
    <g>
      <circle cx="380" cy="373" r="34" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
      <polygon
        points={radialPoints(380, 373, lobes, outerRadius, innerRadius, rotation)}
        fill="var(--accent)"
        stroke="var(--ink)"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle cx="380" cy="373" r={3.5 + phenomenology * 1.4} fill="var(--paper)" />
      {SIGIL_SLOTS.slice(0, satelliteCount).map((slot) => {
        const angle = rotation + (slot * Math.PI * 2) / satelliteCount;
        return (
          <circle
            key={`sigil-satellite-${slot}`}
            cx={380 + Math.cos(angle) * 27}
            cy={373 + Math.sin(angle) * 27}
            r="2.5"
            fill="var(--accent)"
          />
        );
      })}
    </g>
  );
}

export function WorldviewCharacter({ profile, embedded = false }: WorldviewCharacterProps) {
  const reactId = useId().replaceAll(":", "");
  const titleId = `${reactId}-worldview-character-title`;
  const descriptionId = `${reactId}-worldview-character-description`;
  const gridId = `${reactId}-worldview-character-grid`;
  const coatGradientId = `${reactId}-worldview-character-coat`;

  const values: CharacterValues = [
    findAxisValue(profile, "field", 0),
    findAxisValue(profile, "ontology", 1),
    findAxisValue(profile, "phenomenology", 2),
    findAxisValue(profile, "teleology", 3),
  ];

  const variantDescriptions = CHARACTER_AXIS_ORDER.map((key, axisIndex) => {
    const axis = profile.axes.find((candidate) => candidate.key === key) ?? profile.axes[axisIndex];
    const value = values[axisIndex] ?? 0;
    return `${axis?.label ?? CHARACTER_AXIS_LABELS[key]}：${
      axis?.stateName ?? CHARACTER_VARIANT_NAMES[key][value]
    }`;
  }).join("；");

  return (
    <figure
      className={`relative isolate w-full overflow-hidden bg-[var(--paper-deep)] ${
        embedded ? "" : "border border-[var(--line-strong)]"
      }`}
    >
      <svg
        viewBox={embedded ? "104 92 552 468" : "0 0 760 560"}
        className="block h-auto w-full"
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <title
          id={titleId}
        >{`${profile.archetypeTitle}，${profile.name}，${displayCode(profile.code)} 型哲学漫游者`}</title>
        <desc
          id={descriptionId}
        >{`${variantDescriptions}。四个造型维度共同组成此角色；${profile.traits.join("；")}。`}</desc>

        <defs>
          <pattern id={gridId} width="38" height="38" patternUnits="userSpaceOnUse">
            <path d="M38 0H0V38" fill="none" stroke="var(--line)" strokeWidth="1" />
            <circle cx="1" cy="1" r="1.5" fill="var(--accent)" />
          </pattern>
          <linearGradient id={coatGradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--surface-solid)" />
            <stop offset="1" stopColor="var(--paper-deep)" />
          </linearGradient>
        </defs>

        <style>{`
          .worldview-character__float {
            animation: worldview-character-float 4.8s ease-in-out infinite;
            transform-origin: 380px 390px;
          }

          .worldview-character__blink {
            animation: worldview-character-blink 6.4s steps(1, end) infinite;
            transform-origin: center;
          }

          .worldview-character__motes {
            animation: worldview-character-motes 5.8s ease-in-out infinite alternate;
          }

          @keyframes worldview-character-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }

          @keyframes worldview-character-blink {
            0%, 44%, 48%, 100% { opacity: 1; }
            45%, 47% { opacity: 0; }
          }

          @keyframes worldview-character-motes {
            from { transform: translateY(0); }
            to { transform: translateY(-8px); }
          }

          @media (prefers-reduced-motion: reduce) {
            .worldview-character__float,
            .worldview-character__blink,
            .worldview-character__motes {
              animation: none;
            }
          }
        `}</style>

        <rect width="760" height="560" fill="var(--paper-deep)" />
        {embedded ? null : (
          <>
            <rect x="12" y="12" width="736" height="536" fill="none" stroke="var(--line-strong)" />
            <path d="M12 92H748M559 12V92" stroke="var(--line)" />
          </>
        )}

        {embedded ? null : (
          <g>
            <text
              x="38"
              y="41"
              fill="var(--muted)"
              fontFamily="var(--mono)"
              fontSize="11"
              letterSpacing="2.1"
            >
              {profile.archetypeFamily} · 256 型
            </text>
            <text x="38" y="72" fill="var(--ink)" fontFamily="var(--serif)" fontSize="23">
              {profile.archetypeTitle}
            </text>
            <text
              x="582"
              y="46"
              fill="var(--accent)"
              fontFamily="var(--serif)"
              fontSize="24"
              letterSpacing="3"
            >
              {displayCode(profile.code)}
            </text>

            {CHARACTER_AXIS_ORDER.map((key, axisIndex) => {
              const value = values[axisIndex] ?? 0;
              return (
                <g key={key} transform={`translate(${582 + axisIndex * 39} 63)`}>
                  <rect width="31" height="20" fill="var(--surface)" stroke="var(--line-strong)" />
                  <rect y="18" width={(value + 1) * 7.75} height="2" fill="var(--accent)" />
                  <text
                    x="15.5"
                    y="14"
                    fill="var(--muted)"
                    fontFamily="var(--mono)"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {CHARACTER_AXIS_LABELS[key]}
                    {value + 1}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        <FieldScene value={values[0]} gridId={gridId} />

        <ellipse cx="380" cy="486" rx="116" ry="17" fill="var(--ink)" opacity="0.1" />

        <g className="worldview-character__float">
          <LegVariant field={values[0]} teleology={values[3]} />

          <PurposeArms value={values[3]} />

          <BodyVariant values={values} gradientId={coatGradientId} />
          <ChestSigil values={values} />
          <PurposeProp value={values[3]} />
          <HeadVariant value={values[1]} />
          <ExpressionVariant value={values[2]} />
        </g>

        {embedded ? null : (
          <path
            d="M28 28H48M28 28V48M732 28H712M732 28V48M28 532H48M28 532V512M732 532H712M732 532V512"
            stroke="var(--accent)"
            strokeWidth="2"
          />
        )}
      </svg>

      <figcaption className="sr-only">
        {profile.archetypeTitle}，{profile.name}，世界观坐标 {displayCode(profile.code)}。
        {variantDescriptions}。
      </figcaption>
    </figure>
  );
}
