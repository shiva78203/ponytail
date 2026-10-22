import assert from "node:assert/strict";
import { displayOf, powerW, START_WH } from "./model.mjs";

const start = displayOf(START_WH);
assert.equal(start.lamp, "M");
assert.equal(start.digits.slice(0, 4) + "/" + start.digits.slice(4), "2583/9468");
assert.equal(start.point, 2);
assert.equal(start.value, "258.39468");

const small = displayOf(1234567.8);
assert.deepEqual([small.lamp, small.value], ["K", "1234.5678"]);
assert.equal(displayOf(10000000).lamp, "M");
assert.equal(Math.round(powerW(400)), 248400);
console.log("model ok");
