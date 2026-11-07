import test from "node:test";
import assert from "node:assert/strict";
import { SUB_ICON_PRIORITY } from "../src/event-icon.js";

test("representative icon priority remains fixed", () => {
  assert.deepEqual(SUB_ICON_PRIORITY, ["revolution","design","stage","communication","media","environment","industry","space","life","war","biomed","math","law","visual","economy","music","matter","rights","thought","art","politics","technology","literature"]);
});
