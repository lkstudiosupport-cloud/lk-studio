import assert from "node:assert/strict";
import { test } from "node:test";
import {
  computeSalaryAmount,
  defaultOvertimeRate,
  formatDateOnly,
  mondayOfWeekIst,
  parseDateOnly,
  sundayOfWeekIst,
} from "./shop-attendance";

test("default overtime is dailyWage / 8", () => {
  assert.equal(defaultOvertimeRate(800), 100);
  assert.equal(defaultOvertimeRate(500), 62.5);
});

test("weekly amount = presentDays * wage + OT hours * rate", () => {
  assert.equal(
    computeSalaryAmount({ presentDays: 5, dailyWage: 800, overtimeHours: 3, overtimeRate: 100 }),
    4300
  );
  assert.equal(
    computeSalaryAmount({ presentDays: 0, dailyWage: 800, overtimeHours: 2, overtimeRate: 50 }),
    100
  );
});

test("Mon–Sun week from midweek date", () => {
  // Wednesday 2026-03-18 IST calendar → Mon 16 – Sun 22
  const mon = mondayOfWeekIst("2026-03-18");
  const sun = sundayOfWeekIst(mon);
  assert.equal(formatDateOnly(mon), "2026-03-16");
  assert.equal(formatDateOnly(sun), "2026-03-22");
  assert.equal(parseDateOnly("2026-03-16")!.getUTCDay(), 1);
});
