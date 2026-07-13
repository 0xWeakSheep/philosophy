"use client";

import { type CSSProperties, useId } from "react";
import {
  type CharacterAxisValue,
  type CharacterStructureSpec,
  createCharacterRenderSpec,
  resolveCharacterValues,
} from "@/lib/worldview-character-model";

export type WorldviewCharacterAxisValue = CharacterAxisValue;

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

function FaceShape({ value }: { value: WorldviewCharacterAxisValue }) {
  if (value === 0) {
    return (
      <g>
        <rect
          x="319"
          y="151"
          width="122"
          height="132"
          rx="24"
          fill="var(--paper)"
          stroke="var(--ink)"
          strokeWidth="4"
        />
        <path d="M318 177H442V204L423 183H337L318 204Z" fill="var(--ink)" />
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
          d="M380 139L438 171L450 218L421 270L380 289L335 268L310 216L329 165Z"
          fill="var(--paper)"
          stroke="var(--ink)"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M380 139L329 165L306 190L354 177L380 200Z" fill="var(--ink)" />
        <path d="M380 139L438 171L459 196L409 177L380 200Z" fill="var(--accent)" />
        <path d="M380 128V197" stroke="var(--paper)" strokeWidth="3" />
        <path
          d="M314 202L294 224L319 235M445 202L465 224L440 235"
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
        <circle cx="380" cy="216" r="68" fill="var(--paper)" stroke="var(--ink)" strokeWidth="4" />
        <path d="M325 190C337 139 423 139 435 190C406 167 354 167 325 190Z" fill="var(--ink)" />
        <circle cx="380" cy="135" r="39" fill="none" stroke="var(--accent)" strokeWidth="6" />
        <circle cx="380" cy="135" r="9" fill="var(--accent)" />
        <path d="M347 128H413" stroke="var(--ink)" strokeWidth="4" />
      </g>
    );
  }

  return (
    <g>
      <path
        d="M306 223C301 166 333 127 385 137C438 123 463 160 450 207C467 255 426 292 376 285C327 294 293 256 306 223Z"
        fill="var(--surface-solid)"
        stroke="var(--ink)"
        strokeWidth="4"
      />
      <ellipse
        cx="378"
        cy="220"
        rx="54"
        ry="69"
        fill="var(--paper)"
        stroke="var(--ink)"
        strokeWidth="3"
      />
      <path
        d="M313 184C322 135 379 105 443 142C411 148 390 158 376 183C359 162 337 165 313 184Z"
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

function BrowVariant({ value }: { value: WorldviewCharacterAxisValue }) {
  const paths = [
    "M334 191H367M393 191H426",
    "M332 188L366 178M394 198L427 202",
    "M333 183L367 195M393 195L427 183",
    "M332 193Q349 174 368 189M392 189Q411 174 428 193",
  ] as const;
  return (
    <path
      d={paths[value]}
      fill="none"
      stroke="var(--ink)"
      strokeLinecap="round"
      strokeWidth={value === 3 ? 3 : 5}
    />
  );
}

function EyesVariant({
  value,
  gaze,
}: {
  value: WorldviewCharacterAxisValue;
  gaze: WorldviewCharacterAxisValue;
}) {
  const gazeOffsets = [-2, -7, 0, 7] as const;
  const offset = gazeOffsets[gaze];
  if (value === 0) {
    return (
      <g>
        <path d="M327 202H433V232H327Z" fill="var(--surface)" stroke="var(--ink)" strokeWidth="4" />
        <path d="M380 203V231" stroke="var(--ink)" strokeWidth="3" />
        <g
          className="worldview-character__blink"
          stroke="var(--ink)"
          strokeLinecap="round"
          strokeWidth="5"
        >
          <path d={`M340 217H${359 + offset}`} />
          <path d={`M394 217H${413 + offset}`} />
        </g>
      </g>
    );
  }
  if (value === 1) {
    return (
      <g>
        <circle
          cx="352"
          cy="215"
          r="24"
          fill="var(--accent-soft)"
          stroke="var(--ink)"
          strokeWidth="4"
        />
        <rect
          x="394"
          y="202"
          width="27"
          height="27"
          rx="6"
          fill="var(--surface)"
          stroke="var(--ink)"
          strokeWidth="4"
          transform="rotate(12 407 215)"
        />
        <g className="worldview-character__blink" fill="var(--ink)">
          <circle cx={352 + offset} cy="215" r="6" />
          <circle cx={407 - offset * 0.55} cy="215" r="4" />
        </g>
      </g>
    );
  }
  if (value === 2) {
    return (
      <g>
        <circle
          cx="351"
          cy="214"
          r="29"
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeWidth="5"
        />
        <path d="M330 235L313 264" stroke="var(--accent)" strokeLinecap="round" strokeWidth="6" />
        <g className="worldview-character__blink" fill="var(--ink)">
          <circle cx={351 + offset} cy="214" r="7" />
          <path d="M393 220Q408 207 424 220Q408 226 393 220Z" />
        </g>
      </g>
    );
  }
  return (
    <g fill="none" stroke="var(--ink)" strokeLinecap="round" strokeWidth="4">
      <path d="M334 216Q352 198 370 216Q352 228 334 216Z" />
      <circle
        className="worldview-character__blink"
        cx={352 + offset}
        cy="215"
        r="5"
        fill="var(--ink)"
      />
      <path d="M392 214Q408 228 426 211" />
      <path d="M398 205L392 197M408 203V194M418 205L424 197" strokeWidth="2.5" />
    </g>
  );
}

function NoseVariant({ value }: { value: WorldviewCharacterAxisValue }) {
  const paths = [
    "M380 220V240",
    "M374 238L382 221L391 239L382 235Z",
    "M374 232Q380 241 388 232Q381 227 374 232Z",
    "M376 224Q385 230 384 240",
  ] as const;
  return (
    <path
      d={paths[value]}
      fill={value === 2 ? "var(--accent-soft)" : "none"}
      stroke="var(--line-strong)"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
    />
  );
}

function MouthVariant({ value }: { value: WorldviewCharacterAxisValue }) {
  if (value === 0) {
    return (
      <path
        d="M366 253H395M363 250L367 253L363 256M398 250L394 253L398 256"
        fill="none"
        stroke="var(--ink)"
        strokeLinecap="round"
        strokeWidth="3"
      />
    );
  }
  if (value === 1) {
    return (
      <g>
        <path
          d="M364 249L380 239L399 251L381 265Z"
          fill="var(--accent)"
          stroke="var(--ink)"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <path d="M371 249H392" stroke="var(--paper)" strokeWidth="3" />
      </g>
    );
  }
  if (value === 2) {
    return (
      <g fill="none" stroke="var(--ink)" strokeLinecap="round">
        <path d="M364 258Q380 242 398 258" strokeWidth="4" />
        <path d="M372 260H391" stroke="var(--accent)" strokeWidth="2" />
      </g>
    );
  }
  return (
    <g>
      <path
        d="M361 246Q380 270 403 243Q384 262 361 246Z"
        fill="var(--accent)"
        stroke="var(--ink)"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path d="M370 252Q383 258 394 249" fill="none" stroke="var(--paper)" strokeWidth="2.5" />
    </g>
  );
}

function FaceMarks({ value }: { value: WorldviewCharacterAxisValue }) {
  if (value === 0)
    return <path d="M334 243H352M408 243H426" stroke="var(--accent)" strokeWidth="3" />;
  if (value === 1) {
    return (
      <g fill="var(--accent)">
        <path d="M332 238L341 250L351 238Z" />
        <path d="M409 238L418 250L428 238Z" />
      </g>
    );
  }
  if (value === 2) return <path d="M337 244L344 232L351 244L344 241Z" fill="var(--accent)" />;
  return (
    <g fill="var(--accent)">
      <circle cx="334" cy="240" r="3" />
      <circle cx="345" cy="244" r="3" />
      <circle cx="416" cy="244" r="3" />
      <circle cx="427" cy="240" r="3" />
    </g>
  );
}

function HeadAssembly({ structure }: { structure: CharacterStructureSpec }) {
  return (
    <g
      transform={structure.pose.headTransform}
      data-face-variant={`${structure.faceShape}-${structure.expression.eyes}-${structure.expression.mouth}`}
    >
      <FaceShape value={structure.faceShape} />
      <BrowVariant value={structure.expression.brow} />
      <EyesVariant value={structure.expression.eyes} gaze={structure.expression.gaze} />
      <NoseVariant value={structure.expression.nose} />
      <MouthVariant value={structure.expression.mouth} />
      <FaceMarks value={structure.expression.cheek} />
    </g>
  );
}

function PurposeArms({
  field,
  purpose,
}: {
  field: WorldviewCharacterAxisValue;
  purpose: WorldviewCharacterAxisValue;
}) {
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

  const paths = [
    [
      { left: "M326 330Q338 365 353 389", right: "M434 330Q422 365 407 389" },
      { left: "M326 330Q282 354 353 389", right: "M434 330Q478 354 407 389" },
      { left: "M326 330Q390 349 407 389", right: "M434 330Q370 349 353 389" },
      { left: "M326 330Q294 400 353 389", right: "M434 330Q466 400 407 389" },
    ],
    [
      { left: "M326 333Q299 298 287 249", right: "M434 333Q466 344 493 372" },
      { left: "M326 333Q264 304 287 249", right: "M434 333Q499 327 493 372" },
      { left: "M326 333Q352 285 287 249", right: "M434 333Q449 392 493 372" },
      { left: "M326 333Q268 345 287 249", right: "M434 333Q484 296 493 372" },
    ],
    [
      { left: "M326 339Q300 377 321 411", right: "M434 338Q459 360 474 397" },
      { left: "M326 339Q273 390 321 411", right: "M434 338Q496 352 474 397" },
      { left: "M326 339Q364 373 321 411", right: "M434 338Q420 382 474 397" },
      { left: "M326 339Q286 344 321 411", right: "M434 338Q489 334 474 397" },
    ],
    [
      { left: "M326 334Q290 330 255 351", right: "M434 334Q469 317 497 287" },
      { left: "M326 334Q274 293 255 351", right: "M434 334Q503 349 497 287" },
      { left: "M326 334Q294 389 255 351", right: "M434 334Q454 278 497 287" },
      { left: "M326 334Q266 370 255 351", right: "M434 334Q482 286 497 287" },
    ],
  ] as const;
  const armPath = paths[purpose][field];

  return (
    <g data-arm-variant={`${field}-${purpose}`}>
      <path d={armPath.left} style={outlineStyle} />
      <path d={armPath.right} style={outlineStyle} />
      <path d={armPath.left} style={sleeveStyle} />
      <path d={armPath.right} style={sleeveStyle} />
    </g>
  );
}

type HandKind = "grip" | "point" | "chest" | "open";

function HandShape({
  kind,
  x,
  y,
  rotation = 0,
}: {
  kind: HandKind;
  x: number;
  y: number;
  rotation?: number;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotation})`}
      stroke="var(--ink)"
      strokeLinejoin="round"
    >
      {kind === "grip" ? (
        <g>
          <rect x="-11" y="-10" width="22" height="20" rx="6" fill="var(--paper)" strokeWidth="3" />
          <path d="M-6 -3H7M-6 3H6" stroke="var(--accent)" strokeLinecap="round" strokeWidth="2" />
        </g>
      ) : null}
      {kind === "point" ? (
        <g fill="var(--paper)" strokeWidth="3">
          <path d="M-9 8L-8-6L0-10L6-6L7 0L25-7L28-2L7 10Z" />
          <path d="M-3-6V3M2-7V3" fill="none" strokeWidth="2" />
        </g>
      ) : null}
      {kind === "chest" ? (
        <g fill="var(--paper)" strokeWidth="3">
          <path d="M-12 9L-10-7L-5-13L0-5L4-14L8-10L10 6L3 12Z" />
          <path d="M-5-4L4 5" fill="none" stroke="var(--accent)" strokeWidth="2" />
        </g>
      ) : null}
      {kind === "open" ? (
        <g fill="var(--paper)" strokeLinecap="round" strokeWidth="3">
          <path d="M-8 10L-11-5L-7-14L-2-5L1-16L5-6L10-14L10 5L4 12Z" />
          <path
            d="M-18-9L-25-14M-16 0L-26 1M-13-17L-16-26"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
          />
        </g>
      ) : null}
    </g>
  );
}

function PurposeHands({ value }: { value: WorldviewCharacterAxisValue }) {
  if (value === 0) {
    return (
      <g>
        <HandShape kind="grip" x={351} y={391} rotation={-8} />
        <HandShape kind="grip" x={409} y={391} rotation={8} />
      </g>
    );
  }
  if (value === 1) {
    return (
      <g>
        <HandShape kind="grip" x={287} y={249} />
        <HandShape kind="point" x={493} y={372} rotation={-18} />
      </g>
    );
  }
  if (value === 2) {
    return (
      <g>
        <HandShape kind="chest" x={321} y={411} rotation={-18} />
        <HandShape kind="grip" x={474} y={397} rotation={8} />
      </g>
    );
  }
  return (
    <g>
      <HandShape kind="open" x={255} y={351} rotation={-34} />
      <HandShape kind="grip" x={497} y={287} rotation={14} />
    </g>
  );
}

function PurposeProp({ value }: { value: WorldviewCharacterAxisValue }) {
  if (value === 0) {
    return (
      <g>
        <rect
          x="340"
          y="350"
          width="80"
          height="88"
          rx="4"
          fill="var(--paper)"
          stroke="var(--ink)"
          strokeWidth="4"
        />
        <path
          d="M353 371H407M353 389H394M353 407H404M380 351V438"
          stroke="var(--accent)"
          strokeWidth="3"
        />
      </g>
    );
  }

  if (value === 1) {
    return (
      <g>
        <path
          d="M287 240V172M268 166V191M306 166V191M268 190Q287 207 306 190"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="5"
          strokeLinecap="square"
        />
      </g>
    );
  }

  if (value === 2) {
    return (
      <g>
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
      <path
        d="M458 302L515 313L507 360L451 348Z"
        fill="var(--paper)"
        stroke="var(--ink)"
        strokeWidth="4"
      />
      <path
        d="M464 315L480 329L494 319L510 337M476 347L488 336L501 348"
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

function BodyVariant({
  structure,
  gradientId,
}: {
  structure: CharacterStructureSpec;
  gradientId: string;
}) {
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
  const symbolX = 330 + structure.garment.markX * 32;
  const symbolY = 413 - structure.garment.markY * 11;

  return (
    <g>
      <path
        d={bodyPaths[structure.body]}
        fill={`url(#${gradientId})`}
        stroke="var(--ink)"
        strokeWidth="4"
      />
      <path
        d={seamPaths[structure.garment.seam]}
        fill="none"
        stroke="var(--line-strong)"
        strokeWidth="3"
      />
      <path
        d={collarPaths[structure.garment.collar]}
        fill="var(--accent)"
        stroke="var(--ink)"
        strokeWidth="3"
      />
      <g opacity={0.75}>
        <rect
          x={symbolX}
          y={symbolY}
          width={18 + structure.garment.markWidth * 4}
          height={18 + structure.garment.markHeight * 3}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <path
          d={`M${symbolX + 5} ${symbolY + 14}Q${symbolX + 14 + structure.garment.markY * 2} ${
            symbolY - 3
          } ${symbolX + 25 + structure.garment.markWidth * 2} ${symbolY + 14}`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
        />
      </g>
    </g>
  );
}

function ChestSigil({ sigil }: { sigil: CharacterStructureSpec["sigil"] }) {
  const rotation = -Math.PI / 2 + sigil.rotationStep * (Math.PI / 8);
  const outerRadius = 17 + sigil.outerRadiusStep * 2;
  const innerRadius = 7 + sigil.innerRadiusStep * 1.8;

  return (
    <g>
      <circle cx="380" cy="373" r="34" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
      <polygon
        points={radialPoints(380, 373, sigil.lobes, outerRadius, innerRadius, rotation)}
        fill="var(--accent)"
        stroke="var(--ink)"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle cx="380" cy="373" r={3.5 + sigil.outerRadiusStep * 1.4} fill="var(--paper)" />
      {SIGIL_SLOTS.slice(0, sigil.satellites).map((slot) => {
        const angle = rotation + (slot * Math.PI * 2) / sigil.satellites;
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

  const values = resolveCharacterValues(profile);
  const renderSpec = createCharacterRenderSpec(values);
  const { structure, palette } = renderSpec;
  const paletteStyle = {
    "--accent": palette.accent,
    "--accent-soft": palette.soft,
    "--surface-solid": palette.coat,
    "--surface": palette.lens,
  } as CSSProperties;

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
      data-character-palette={palette.name}
      data-character-pose={structure.pose.key}
      data-character-fingerprint={renderSpec.fingerprint}
      style={paletteStyle}
    >
      <svg
        viewBox={embedded ? "104 92 552 468" : "0 0 760 560"}
        className="block h-auto w-full"
        role="img"
        focusable="false"
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

        <FieldScene value={structure.scene} gridId={gridId} />

        <ellipse cx="380" cy="486" rx="116" ry="17" fill="var(--ink)" opacity="0.1" />

        <g className="worldview-character__float">
          <g transform={structure.pose.bodyTransform} data-pose={structure.pose.key}>
            <LegVariant field={structure.stance} teleology={structure.pose.purpose} />
            <PurposeArms field={structure.pose.field} purpose={structure.pose.purpose} />
            <BodyVariant structure={structure} gradientId={coatGradientId} />
            <ChestSigil sigil={structure.sigil} />
            <PurposeProp value={structure.prop} />
            <PurposeHands value={structure.pose.purpose} />
            <HeadAssembly structure={structure} />
          </g>
        </g>

        {embedded ? null : (
          <path
            d="M28 28H48M28 28V48M732 28H712M732 28V48M28 532H48M28 532V512M732 532H712M732 532V512"
            stroke="var(--accent)"
            strokeWidth="2"
          />
        )}
      </svg>

      <figcaption aria-hidden="true" className="sr-only">
        {profile.archetypeTitle}，{profile.name}，世界观坐标 {displayCode(profile.code)}。
        {variantDescriptions}。
      </figcaption>
    </figure>
  );
}
