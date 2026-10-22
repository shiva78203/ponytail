import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../../.claude/skills/anatomy/scripts/inline-kit.mjs";
import * as M from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 600;
const HEIGHT = 460;

const PLATE = { x: -66, y: -126, w: 132, d: 220, r: 10 };
const PLATE_H = 10;
const FOOT_H = 5;

// Meter: a 96 square bezel facing +y, the case behind it with its cover off and its +x wall cut down.
const BEZEL = { x: -48, y: 60, w: 96, d: 7, r: 2.5 };
const FRONT = BEZEL.y + BEZEL.d;
const BEZ_Z = [6, 102];
const CASE = { x: -45, y: -40, w: 90, d: 100 };
const CASE_Z = [12, 96];
const WALL = 2.4;
const FLOOR = CASE_Z[0] + WALL;
const SIDE = CASE.x + CASE.w;
const CUT_Z = FLOOR + 6;
const BACK_Z = 42;
const CUT_Y = 40;
const BOARD = { x: -41, y: -23, w: 82, d: 74, r: 2 };
const BOARD_Z = FLOOR + 3.6;
const BT = BOARD_Z + 1.6;

const TB = { x: -42, y: -37.6, w: 84, d: 12, r: 1 };
const TB_TOP = 36;
const TB_FACE = TB.y + TB.d;
const TERMS = ["I1", "I1'", "I2", "I2'", "I3", "I3'", "V1", "V2", "V3", "VN"];
const termX = (i) => -36 + i * 8;
const TERM_Y = TB.y + 6;

const TOROIDS = [-32, -16, 0].map((x) => ({ x, y: -14, r: 6.5, h: 6 }));
const RES_X = [14, 22, 30];
const IC = { x: 18, y: 2, w: 12, d: 12, r: 0.6 };
const MCU = { x: -4, y: 4, w: 10, d: 10, r: 0.6 };
const XTAL = { x: 8, y: 22.6, w: 6, d: 2.8, r: 1.4 };
const EEPROM = { x: 30, y: 22, w: 5, d: 4, r: 0.4 };
const XFMR = { x: -36, y: 30, w: 13, d: 11, r: 1 };
const CAPS = [[24, 36], [34, 36]];
const HEADER = { x: -18, y: 45.4, w: 36, d: 4, r: 0.6 };
const DISP = { x: -38, y: 46.6, w: 76, d: 1.6, r: 0.4 };

// Bus bars behind the meter: L1, L2, L3 with a CT each, and N.
const BUS = { x: -56, y: -114, w: 112, d: 20, r: 3 };
const BUS_H = 12;
const BARS = [-36, -12, 12, 36];
const BAR_Y = -106;
const BAR_TOP = 132;
const N_TOP = 112;
const CT_Z = [48, 60];
const CT_R = 10;
const TAP_Z = [124, 124, 124, 104];

// Display window in the bezel face, in face coordinates (x, z).
const WIN = { x0: -40, x1: 40, z0: 36, z1: 96, r: 3, depth: 2.2 };
const ROWS_Z = [84, 66, 48];
const DIG = { w: 6.6, h: 12, t: 1.3, skew: 0.12, pitch: 10.4, x0: -25 };
const BARS_N = 14;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [BARS[0], BAR_Y, BAR_TOP], [BARS[3], BAR_Y, BAR_TOP], [-48, FRONT, BEZ_Z[1]], [48, FRONT, BEZ_Z[1]]],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 46, elevation: 38 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const depth = ([x, y, z = 0]) => k.depthOf([x, y, z], P);
const byDepth = (points) => [...points].sort((a, b) => depth(a) - depth(b));
const planeOf = (y) => k.sideMatrix([0, y], 0, P, "left");
const flat = (x0, z0, x1, z1, r, steps = 6) => k.pathOf(k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z]), true);
const box = (plan, z, h, tone, extra = {}) => S(k.slabOf(plan, z, h, P, 4, extra.bevel ?? 0.4), { tone, ...extra });

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 20))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  const strip = { x: PLATE.x + 12, y: PLATE.y + PLATE.d - 14, w: 60, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 3, 5, strip.y + 0.6, 0.6, [1.6, 3], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  const label = { x: PLATE.x + PLATE.w - 46, y: PLATE.y + PLATE.d - 16, w: 34, d: 9, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(L([26, 18, 22].map((w, i) => k.lineOnTop([label.x + 3, label.y + 2.4 + i * 2.2], [label.x + 3 + w, label.y + 2.4 + i * 2.2], 0.8, P)).join(""), { tone: "lo", free: true }));
  return out.join("");
}

function busbars() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BUS, 0, 4, P)}"/>`];
  out.push(box(BUS, 0, BUS_H, "lo", { bevel: 1 }));
  out.push(L(k.planOutline(k.insetPlan(BUS, 3), BUS_H, P, 4), { tone: "faint" }));
  out.push(D([BUS.x + 5, BUS.x + BUS.w - 5].flatMap((x) => [at([x, BUS.y + 4, BUS_H]), at([x, BUS.y + BUS.d - 4, BUS_H])]), { size: 0.5 }));
  const bar = (x, z0, z1) => box({ x: x - 4, y: BAR_Y - 2, w: 8, d: 4, r: 0.6 }, z0, z1 - z0, "mid", { crease: "lo" });
  BARS.forEach((x, i) => {
    out.push(S(k.cylinder(x, BAR_Y, 6, BUS_H, 3, P, 24), { tone: "mid" }));
    if (i === 3) {
      out.push(bar(x, BUS_H + 3, N_TOP));
    } else {
      out.push(bar(x, BUS_H + 3, CT_Z[0]));
      out.push(S(k.cylinder(x, BAR_Y, CT_R, CT_Z[0], CT_Z[1] - CT_Z[0], P, 48), { tone: "mid", crease: "lo" }));
      out.push(L(k.knurl(x, BAR_Y, CT_R, CT_Z[0], CT_Z[1], 40, P), { tone: "faint" }));
      out.push(`<path class="em-hole" d="${k.onTop(k.circleRing(x, BAR_Y, 5.4, 28), CT_Z[1], P, true)}"/>`);
      out.push(L(k.ring(x, BAR_Y, 5.4, CT_Z[1], P, 28), { tone: "lo" }));
      out.push(bar(x, CT_Z[1] - 1, BAR_TOP));
      for (const dx of [-4.5, 4.5]) {
        out.push(S(k.cylinder(x + dx, BAR_Y + 7, 1.7, CT_Z[1], 1.2, P, 14), { tone: "hi" }));
      }
    }
    out.push(box({ x: x - 2.6, y: BAR_Y + 2, w: 5.2, d: 4, r: 0.8 }, TAP_Z[i] - 2.6, 5.2, "hi", { crease: "lo" }));
    out.push(D([at([x, BAR_Y + 4, TAP_Z[i] + 2.6])], { size: 0.45, tone: "lo" }));
  });
  return out.join("");
}

function caseBack() {
  const out = [`<path class="iso-halo" d="${k.haloOf({ ...CASE, r: 3 }, 0, 10, P)}"/>`];
  out.push(box({ x: -36, y: -34, w: 72, d: 14, r: 2 }, 0, CASE_Z[0], "lo"));
  out.push(box({ x: -54, y: 54, w: 108, d: 20, r: 3 }, 0, BEZ_Z[0], "lo", { bevel: 0.8 }));
  out.push(L(k.lineOnTop([-54, 58], [54, 58], BEZ_Z[0], P), { tone: "faint" }));
  out.push(D([at([-50, 70, BEZ_Z[0]]), at([50, 70, BEZ_Z[0]])], { size: 0.5 }));
  out.push(box({ x: CASE.x, y: CASE.y, w: CASE.w, d: CASE.d, r: 2 }, CASE_Z[0], WALL, "mid"));
  out.push(box({ x: CASE.x, y: CASE.y, w: WALL, d: CUT_Y - CASE.y, r: 0.3 }, FLOOR, BACK_Z - FLOOR, "mid", { bevel: 0 }));
  out.push(box({ x: CASE.x, y: CUT_Y, w: WALL, d: BEZEL.y - CUT_Y, r: 0.3 }, FLOOR, CASE_Z[1] - FLOOR, "mid", { bevel: 0 }));
  out.push(box({ x: CASE.x + WALL, y: CASE.y, w: CASE.w - WALL * 2, d: WALL, r: 0.3 }, FLOOR, BACK_Z - FLOOR, "mid", { bevel: 0 }));
  return out.join("");
}

function terminals() {
  const out = [];
  out.push(box(TB, FLOOR, TB_TOP - FLOOR, "mid", { crease: "lo" }));
  const seams = TERMS.slice(1).map((_, i) => termX(i) + 4);
  out.push(L(seams.map((x) => k.segment([x, TB_FACE, TB_TOP], [x, TB_FACE, FLOOR], P)).join(""), { tone: "faint" }));
  out.push(L(k.segment([TB.x, TB_FACE, 22], [TB.x + TB.w, TB_FACE, 22], P), { tone: "faint" }));
  for (const x of [TB.x, ...seams, TB.x + TB.w - 1]) out.push(box({ x: x - 0.5, y: TB.y, w: 1, d: TB.d, r: 0.2 }, TB_TOP, 3, "mid", { bevel: 0 }));
  TERMS.forEach((_, i) => {
    const x = termX(i);
    out.push(S(k.cylinder(x, TERM_Y, 2.5, TB_TOP, 1.2, P, 20), { tone: "hi" }));
    out.push(L(k.lineOnTop([x - 2.5, TERM_Y], [x + 2.5, TERM_Y], TB_TOP + 1.2, P), { tone: "lo" }));
  });
  return out.join("");
}

function board() {
  const out = [];
  for (const [x, y] of byDepth(k.corners(BOARD, 3))) out.push(S(k.cylinder(x, y, 1.6, FLOOR, BOARD_Z - FLOOR, P, 14), { tone: "lo" }));
  out.push(box(BOARD, BOARD_Z, 1.6, "lo", { bevel: 0.2 }));
  out.push(D(k.corners(BOARD, 3).map(([x, y]) => at([x, y, BT])), { size: 0.5 }));
  // Traces: CT outputs and the divider taps run to the metering IC, the IC to the MCU, the MCU to the EEPROM and the display header.
  const trace = (points) => k.onTop(points, BT, P);
  const traces = [
    // Nested so no two traces cross: the farthest CT takes the outermost path and the highest IC pin.
    ...TOROIDS.map((t, i) => trace([[t.x + 2, t.y + t.r], [t.x + 2, -2 * i], [8 + 2 * i, -2 * i], [8 + 2 * i, IC.y + 6 - 2 * i], [IC.x, IC.y + 6 - 2 * i]])),
    trace([[RES_X[0], -4], [RES_X[0], -1], [IC.x + 2, -1], [IC.x + 2, IC.y]]),
    trace([[RES_X[1], -4], [RES_X[1], IC.y]]),
    trace([[RES_X[2], -4], [RES_X[2], -1], [IC.x + 8, -1], [IC.x + 8, IC.y]]),
    trace([[MCU.x + MCU.w, 9], [IC.x, 9]]),
    trace([[MCU.x + MCU.w, 12], [IC.x, 12]]),
    trace([[MCU.x + 8, MCU.y + MCU.d], [MCU.x + 8, XTAL.y + 1.4], [XTAL.x, XTAL.y + 1.4]]),
    trace([[MCU.x + 9.5, MCU.y + MCU.d], [MCU.x + 9.5, 19], [EEPROM.x + 2.5, 19], [EEPROM.x + 2.5, EEPROM.y]]),
    ...[[-12, 37], [-4, 38], [4, 38], [12, 37]].map(([x, y], i) => trace([[x, HEADER.y], [x, y], [MCU.x + 1 + i * 1.5, y], [MCU.x + 1 + i * 1.5, MCU.y + MCU.d]])),
  ].filter(Boolean);
  out.push(L(traces.join(""), { tone: "faint" }));
  return out.join("");
}

function chip(plan, tone, pins) {
  const out = [];
  const pad = k.insetPlan(plan, -1.8);
  out.push(L(k.planOutline(pad, BT, P, 2), { tone: "faint" }));
  const lines = [];
  for (let i = 0; i < pins; i++) {
    const s = (i + 0.5) / pins;
    const x = plan.x + 1 + s * (plan.w - 2);
    const y = plan.y + 1 + s * (plan.d - 2);
    lines.push(k.lineOnTop([x, plan.y], [x, pad.y], BT, P), k.lineOnTop([x, plan.y + plan.d], [x, pad.y + pad.d], BT, P));
    lines.push(k.lineOnTop([plan.x, y], [pad.x, y], BT, P), k.lineOnTop([plan.x + plan.w, y], [pad.x + pad.w, y], BT, P));
  }
  out.push(L(lines.join(""), { tone: "lo" }));
  out.push(box(plan, BT, 1.8, tone, { crease: "lo", bevel: 0.3 }));
  out.push(D([at([plan.x + 1.8, plan.y + 1.8, BT + 1.8])], { size: 0.45, tone: "lo" }));
  return out.join("");
}

function parts() {
  const items = [];
  const add = (x, y, svg) => items.push({ key: depth([x, y, BT]), svg });
  TOROIDS.forEach((t) => {
    add(t.x, t.y, [
      S(k.cylinder(t.x, t.y, t.r, BT, t.h, P, 40, 0.5), { tone: "hi", crease: "lo" }),
      L(k.knurl(t.x, t.y, t.r, BT + 0.8, BT + t.h - 0.8, 30, P), { tone: "lo" }),
      `<path class="em-hole" d="${k.onTop(k.circleRing(t.x, t.y, 2.6, 24), BT + t.h, P, true)}"/>`,
      L(k.ring(t.x, t.y, 2.6, BT + t.h, P, 24), { tone: "lo" }),
    ].join(""));
  });
  RES_X.forEach((x) => {
    for (const y of [-20, -11]) {
      const plan = { x: x - 1.3, y, w: 2.6, d: 7, r: 1.3 };
      add(x, y + 3.5, [
        box(plan, BT, 2.6, "mid", { bevel: 0 }),
        L([1.6, 2.8, 5.4].map((dy) => k.lineOnTop([plan.x, y + dy], [plan.x + plan.w, y + dy], BT + 2.6, P)).join(""), { tone: "lo" }),
      ].join(""));
    }
  });
  add(IC.x + 6, IC.y + 6, chip(IC, "hi", 9));
  add(MCU.x + 5, MCU.y + 5, chip(MCU, "mid", 7));
  add(XTAL.x + 3, XTAL.y, box(XTAL, BT, 3, "mid", { bevel: 0.3 }));
  add(EEPROM.x + 2, EEPROM.y + 2, chip(EEPROM, "mid", 3));
  add(XFMR.x + 6, XFMR.y + 5, [
    box(XFMR, BT, 3, "lo"),
    box(k.insetPlan(XFMR, 1.5), BT + 3, 7, "mid"),
    L([2, 3.5, 5].map((z) => k.segment([XFMR.x + XFMR.w - 1.5, XFMR.y + 1.5, BT + 3 + z], [XFMR.x + XFMR.w - 1.5, XFMR.y + XFMR.d - 1.5, BT + 3 + z], P)).join(""), { tone: "faint" }),
  ].join(""));
  CAPS.forEach(([x, y]) => {
    add(x, y, [
      S(k.cylinder(x, y, 3, BT, 9, P, 28, 0.5), { tone: "mid" }),
      L(k.sideArc(x, y, 3, BT + 7.4, P, 16), { tone: "lo" }),
      L(k.lineOnTop([x - 3, y], [x + 3, y], BT + 9, P) + k.lineOnTop([x, y - 3], [x, y + 3], BT + 9, P), { tone: "lo" }),
    ].join(""));
  });
  add(0, HEADER.y + 2, [
    box(HEADER, BT, 4, "mid"),
    D(Array.from({ length: 12 }, (_, i) => at([HEADER.x + 1.5 + i * 3, HEADER.y + 3.2, BT + 4])), { size: 0.35 }),
  ].join(""));
  items.sort((a, b) => a.key - b.key);
  return items.map((item) => item.svg).join("");
}

function leads() {
  const out = [];
  TOROIDS.forEach((t, i) => {
    for (const j of [0, 1]) {
      out.push(k.wireSvg(at([termX(i * 2 + j), TB_FACE, 29]), at([t.x + (j ? 1 : -1), t.y, BT + t.h]), { tone: "mid", size: 0.8 }));
    }
  });
  RES_X.forEach((x, i) => out.push(k.wireSvg(at([termX(6 + i), TB_FACE, 29]), at([x, -20, BT + 2.6]), { tone: "mid", size: 0.8 })));
  return `<g class="em-lead">${out.join("")}</g>`;
}

function displayBoard() {
  const out = [];
  out.push(box(DISP, BT + 4, CASE_Z[1] - 4 - BT - 4, "lo", { bevel: 0 }));
  ROWS_Z.forEach((z) => out.push(box({ x: -28, y: DISP.y + DISP.d, w: 42, d: FRONT - BEZEL.d - DISP.y - DISP.d, r: 0.4 }, z - 7, 14, "mid", { bevel: 0 })));
  return out.join("");
}

function nearWall() {
  return box({ x: SIDE - WALL, y: CASE.y, w: WALL, d: BEZEL.y - CASE.y, r: 0.3 }, FLOOR, CUT_Z - FLOOR, "mid", { bevel: 0 });
}

let clips = 0;
function recess({ x0, x1, z0, z1, r, depth: deep }, y, back, backClass) {
  const id = `em-clip-${clips++}`;
  const ring = k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, 6);
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const { sinA } = k.cameraOf(P);
  const tops = [];
  const sides = [[], [], [], []];
  ring.forEach(([ax, az], index) => {
    const [bx, bz] = ring[(index + 1) % ring.length];
    const length = Math.hypot(bx - ax, bz - az) || 1;
    let [nx, nz] = [(bz - az) / length, -(bx - ax) / length];
    if (nx * (cx - (ax + bx) / 2) + nz * (cz - (az + bz) / 2) < 0) [nx, nz] = [-nx, -nz];
    if (nx <= 0 && nz <= 0) return;
    const quad = k.pathOf([at([ax, y, az]), at([bx, y, bz]), at([bx, y - deep, bz]), at([ax, y - deep, az])], true);
    if (nz >= nx) tops.push(quad);
    else sides[Math.min(3, Math.max(0, Math.floor(((nx * -sinA + 1) / 2) * 4)))].push(quad);
  });
  const shape = flat(x0, z0, x1, z1, r);
  return [
    `<clipPath id="${id}"><path transform="${planeOf(y)}" d="${shape}"/></clipPath>`,
    `<g clip-path="url(#${id})">`,
    `<path class="iso-top" d="${tops.join("")}"/>`,
    ...sides.map((d, shade) => (d.length ? `<path class="iso-shade" data-shade="${shade}" d="${d.join("")}"/>` : "")),
    `<g transform="${planeOf(y - deep)}"><path class="${backClass}" d="${shape}"/>${back}<path class="iso-line" data-tone="faint" d="${shape}"/></g>`,
    `</g>`,
    `<g transform="${planeOf(y)}"><path class="iso-line" data-tone="lo" d="${shape}"/></g>`,
  ].join("");
}

// Seven segments plus a centre stroke for W, in a digit box with its origin at bottom left, z up.
const SEGS = { a: ["h", 1], b: ["v", 1, 1], c: ["v", 1, 0], d: ["h", 0], e: ["v", 0, 0], f: ["v", 0, 1], g: ["h", 0.5], m: ["v", 0.5, 0] };
const FONT = { 0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg", 5: "acdfg", 6: "acdefg", 7: "abc", 8: "abcdefg", 9: "abcdfg", W: "bcdefm", h: "cefg", " ": "" };
function segPath(name, ox, oz) {
  const { w, h, t, skew } = DIG;
  const [kind, a, b] = SEGS[name];
  const gap = 0.35;
  let points;
  if (kind === "h") {
    const z = a * h, u0 = gap, u1 = w - gap;
    points = [[u0, z], [u0 + t / 2, z + t / 2], [u1 - t / 2, z + t / 2], [u1, z], [u1 - t / 2, z - t / 2], [u0 + t / 2, z - t / 2]];
  } else {
    const u = a * w, z0 = b * h / 2 + gap, z1 = (b + 1) * h / 2 - gap;
    points = [[u, z0], [u + t / 2, z0 + t / 2], [u + t / 2, z1 - t / 2], [u, z1], [u - t / 2, z1 - t / 2], [u - t / 2, z0 + t / 2]];
  }
  return k.pathOf(points.map(([u, z]) => [ox + u + skew * z, -(oz + z)]), true);
}

function displayFace(rows, lamp, barCount) {
  const out = [];
  const labels = ["L1", "L2", "L3"];
  ROWS_Z.forEach((cz, r) => {
    const oz = cz - DIG.h / 2;
    out.push(`<text class="em-legend" x="${WIN.x0 + 3}" y="${(-(cz - 1.4)).toFixed(1)}" font-size="3.6">${labels[r]}</text>`);
    for (let i = 0; i < 4; i++) {
      const ox = DIG.x0 + i * DIG.pitch;
      const on = FONT[rows[r].chars[i]] || "";
      const segs = Object.keys(SEGS).map((s) => `<path data-s="${s}"${on.includes(s) ? " data-on" : ""} d="${segPath(s, ox, oz)}"/>`);
      const dp = `<circle data-s="p"${rows[r].point === i ? " data-on" : ""} cx="${(ox + DIG.w + 1.3).toFixed(2)}" cy="${(-(oz + 0.5)).toFixed(2)}" r="0.85"/>`;
      out.push(`<g class="em-digit" data-d="${r}-${i}">${segs.join("")}${dp}</g>`);
    }
    for (const [name, dz] of [["K", 2.6], ["M", -2.6]]) {
      const lit = r > 0 && lamp === name;
      out.push(`<g class="em-lamp" data-lamp="${r}-${name}"${lit ? " data-on" : ""}><path d="${flat(16.5, cz + dz - 2, 21.5, cz + dz + 2, 0.6, 2)}"/><text x="19" y="${(-(cz + dz - 1.1)).toFixed(1)}" font-size="3" text-anchor="middle">${name}</text></g>`);
    }
  });
  for (let i = 0; i < BARS_N; i++) {
    const z0 = 40 + i * 3.7;
    out.push(`<path class="em-bar" data-bar="${i}"${i < barCount ? " data-on" : ""} d="${flat(29, z0, 35, z0 + 2.6, 0.4, 2)}"/>`);
  }
  out.push(`<text class="em-legend" x="32" y="${(-37.4).toFixed(1)}" font-size="2.6" text-anchor="middle">%A</text>`);
  return out.join("");
}

function rowsOf(wh) {
  const shown = M.displayOf(wh);
  return [
    { chars: "  Wh", point: -1 },
    { chars: shown.digits.slice(0, 4), point: shown.point < 4 ? shown.point : -1 },
    { chars: shown.digits.slice(4), point: shown.point >= 4 ? shown.point - 4 : -1 },
  ];
}

const START_AMPS = 300;
const startShown = M.displayOf(M.START_WH);

function front() {
  const out = [];
  out.push(box(BEZEL, BEZ_Z[0], BEZ_Z[1] - BEZ_Z[0], "mid", { bevel: 1.2 }));
  out.push(`<g transform="${planeOf(FRONT)}"><path class="iso-line" data-tone="faint" d="${flat(BEZEL.x + 3.5, BEZ_Z[0] + 3.5, BEZEL.x + BEZEL.w - 3.5, BEZ_Z[1] - 3.5, 2)}"/></g>`);
  out.push(recess(WIN, FRONT, displayFace(rowsOf(M.START_WH), startShown.lamp, Math.round((START_AMPS / M.CT[0]) * BARS_N)), "em-glass"));
  for (const cx of [-27, -9, 9, 27]) {
    out.push(box({ x: cx - 6, y: FRONT, w: 12, d: 1.8, r: 0.9 }, 16, 10, "mid", { bevel: 0.3 }));
  }
  out.push(D([-27, -9, 9, 27].map((cx) => at([cx, FRONT + 1.8, 28.6])), { size: 0.35, tone: "lo" }));
  return out.join("");
}

function wires() {
  const out = [];
  const route = (from, to, lift) => {
    const via = [];
    for (let i = 1; i < 12; i++) {
      const s = i / 12;
      const x = from[0] + (to[0] - from[0]) * s;
      const y = from[1] + (to[1] - from[1]) * s;
      const z = from[2] + (to[2] - from[2]) * s + Math.sin(Math.PI * s) * lift;
      via.push(at([x, y, z]));
    }
    return via;
  };
  const ct = [];
  for (let p = 0; p < 3; p++) {
    for (const j of [0, 1]) {
      const from = [BARS[p] + (j ? 4.5 : -4.5), BAR_Y + 7, CT_Z[1] + 1.2];
      const to = [termX(p * 2 + j), TERM_Y, TB_TOP + 1.2];
      ct.push(k.wireSvg(at(from), at(to), { via: route(from, to, 10), tone: "hi", flow: true, size: 0.9 }));
    }
  }
  const taps = BARS.map((x, i) => {
    const from = [x, BAR_Y + 6, TAP_Z[i]];
    const to = [termX(6 + i), TERM_Y, TB_TOP + 1.2];
    return k.wireSvg(at(from), at(to), { via: route(from, to, 8), tone: "mid", size: 0.9 });
  });
  out.push(`<g class="em-taps">${taps.join("")}</g>`, `<g class="em-ct">${ct.join("")}</g>`);
  return out.join("");
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A three-phase panel energy meter on a bench with its cover off and one side cut away. Behind it three bus bars, each through a current transformer, and a neutral bar feed ten wires to the rear terminal block. Inside, three small CTs and a resistor divider feed a metering chip on the main board, which an MCU and EEPROM count into the display board behind the front. The front window shows Wh on the top row and the running energy across the middle and bottom rows, with the M lamp lit.",
  body: [plate(), busbars(), caseBack(), terminals(), board(), parts(), leads(), displayBoard(), nearWall(), front(), wires()],
});

const live = `
const V_LN = ${M.V_LN}, PF = ${M.PF}, CT = ${JSON.stringify(M.CT)}, START_WH = ${M.START_WH};
const powerW = ${M.powerW.toString()};
const displayOf = ${M.displayOf.toString()};
const FONT = ${JSON.stringify(FONT)};
const BARS_N = ${BARS_N}, MAX_A = CT[0];
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const status = document.querySelector("[data-status]");
const digits = [...svg.querySelectorAll(".em-digit")];
const bars = [...svg.querySelectorAll(".em-bar")];
const lamps = [...svg.querySelectorAll(".em-lamp")];
const flows = [...svg.querySelectorAll(".em-ct .iso-line")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const TOUR = [300, 400, 120, 40];
let wh = START_WH, amps = ${START_AMPS}, target = amps, warp = 1;
let frame = 0, last = 0, clock = 0, refresh = 0, touring = !still.matches, visible = false, idle = 0;
function paint() {
  const shown = displayOf(wh);
  const rows = ["  Wh", shown.digits.slice(0, 4), shown.digits.slice(4)];
  digits.forEach((g) => {
    const [r, i] = g.dataset.d.split("-").map(Number);
    const on = FONT[rows[r][i]] || "";
    const point = r === 0 ? -1 : shown.point - (r - 1) * 4;
    for (const seg of g.children) seg.toggleAttribute("data-on", seg.dataset.s === "p" ? point === i : on.includes(seg.dataset.s));
  });
  lamps.forEach((g) => { const [r, name] = g.dataset.lamp.split("-"); g.toggleAttribute("data-on", r !== "0" && name === shown.lamp); });
  const lit = Math.round((amps / MAX_A) * BARS_N);
  bars.forEach((b, i) => b.toggleAttribute("data-on", i < lit));
  const kw = powerW(amps) / 1000;
  const text = Math.round(amps) + " A · " + kw.toFixed(1) + " kW · " + shown.value + " " + shown.lamp + "Wh" + (warp > 1 ? " · 1 s = 1 h" : "");
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(amps)));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
  last = now;
  if (touring) { clock += dt; target = TOUR[Math.floor(clock / 4) % TOUR.length]; }
  amps = still.matches ? target : amps + (target - amps) * (1 - Math.exp(-dt / 0.6));
  if (Math.abs(target - amps) < 0.05) amps = target;
  wh += powerW(amps) * dt * warp / 3600;
  const period = (1600 * 60 / Math.max(amps, 1)).toFixed(0) + "ms";
  for (const f of flows) if (f.style.animationDuration !== period) f.style.animationDuration = period;
  refresh -= dt;
  if (refresh <= 0) { refresh = 0.5; paint(); }
  frame = visible ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; target = clamp(Math.round(next), 0, MAX_A); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; clock = 0; }, 6000); run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => {
  const b = svg.getBoundingClientRect();
  steer(clamp(((event.clientX - b.left) / b.width - 0.15) / 0.7, 0, 1) * MAX_A);
});
const toggleWarp = () => { warp = warp > 1 ? 1 : 3600; status.textContent = warp > 1 ? "Fast: one second is one hour." : "Real time."; paint(); };
stage.addEventListener("click", () => { toggleWarp(); stage.focus({ preventScroll: true }); });
stage.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "ArrowUp") steer(target + 20);
  else if (event.key === "ArrowLeft" || event.key === "ArrowDown") steer(target - 20);
  else if (event.key === "Home") steer(0);
  else if (event.key === "End") steer(MAX_A);
  else if (event.key === " " || event.key === "Enter") toggleWarp();
  else return;
  event.preventDefault();
});
paint();
`;

const css = `<style>
.iso{--em-ground:#0b0b0c;--em-seg:#ffffff;--em-ghost:#1d1d1f;--em-legend:#5a5a5e}
.iso[data-theme="light"]{--em-ground:#232326;--em-seg:#f6f6f3;--em-ghost:#36363a;--em-legend:#8a8a8f}
.em-glass{fill:var(--em-ground)}
.em-hole{fill:var(--anatomy-shade-0)}
.em-digit path,.em-digit circle,.em-bar{fill:var(--em-ghost)}
.em-digit [data-on],.em-bar[data-on]{fill:var(--em-seg)}
.em-legend{fill:var(--em-legend);font-family:var(--anatomy-mono);letter-spacing:.02em}
.em-lamp path{fill:var(--em-ghost)}
.em-lamp text{fill:var(--em-ground);font-family:var(--anatomy-mono);font-weight:600}
.em-lamp[data-on] path{fill:var(--em-seg)}
.em-ct .iso-line{stroke-width:1px}
.em-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.iso-stage{touch-action:pan-y;cursor:pointer}
.iso-stage:focus{outline:none}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
</style>`;

const body =
  css +
  k.plateHtml({
    fig: "Fig 1",
    title: "Energy meter, opened",
    hint: "Hover to set the load · click for 1 s = 1 h",
    readout: `${START_AMPS} A · ${(M.powerW(START_AMPS) / 1000).toFixed(1)} kW · ${startShown.value} ${startShown.lamp}Wh`,
    keys: [
      { mark: "lit", label: "The window: Wh on top; rows 2 + 3 are one 8-digit number, the lit K or M lamp gives kWh or MWh" },
      { mark: "raised", label: "Three CTs on the bars, three inside, a divider, the metering chip, MCU and EEPROM" },
      { mark: "edge", label: "CT secondaries (moving) and voltage taps to the rear terminals" },
    ],
    caption: `Current in each bar is stepped down 400 : 5 by its CT and again by a small CT inside; the voltage taps go through a resistor divider. The metering chip multiplies V × I × cos φ (230 V, PF ${M.PF}) for all three phases and the MCU adds it up, saving the total to EEPROM. The window starts at 258.3 / 9468 with M lit: 258.39468 MWh, which is 2,58,394.68 kWh. Rows 2 and 3 are read as one number and refresh twice a second; at 300 A the meter adds about 52 Wh a second, so the last digit (10 Wh) climbs about 5 counts each second.`,
    body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Energy meter: arrow keys set the load current, Space switches 1 second to 1 hour" aria-valuemin="0" aria-valuemax="${M.CT[0]}" aria-valuenow="${START_AMPS}">${svg}<span class="em-sr" role="status" aria-live="polite" data-status></span></div>`,
  });

const name = theme === "light" ? "energy-meter-light.html" : "energy-meter.html";
writeFileSync(join(HERE, name), k.pageHtml({ title: "Energy meter", theme, body, script: kitScript() + live }));
console.log("wrote", name);
