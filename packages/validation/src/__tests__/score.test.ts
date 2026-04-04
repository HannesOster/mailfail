import { describe, it, expect } from "vitest";
import { calculateScore } from "../score";

describe("calculateScore", () => {
  it("returns green for 0 errors and ≤3 warnings", () => {
    expect(calculateScore([])).toBe("green");
    expect(
      calculateScore([
        { severity: "warning", message: "w1" },
        { severity: "warning", message: "w2" },
        { severity: "info", message: "i1" },
      ]),
    ).toBe("green");
  });

  it("returns yellow for 1-2 errors", () => {
    expect(
      calculateScore([{ severity: "error", message: "e1" }]),
    ).toBe("yellow");
  });

  it("returns yellow for 0 errors but >3 warnings", () => {
    expect(
      calculateScore([
        { severity: "warning", message: "w1" },
        { severity: "warning", message: "w2" },
        { severity: "warning", message: "w3" },
        { severity: "warning", message: "w4" },
      ]),
    ).toBe("yellow");
  });

  it("returns red for 3+ errors", () => {
    expect(
      calculateScore([
        { severity: "error", message: "e1" },
        { severity: "error", message: "e2" },
        { severity: "error", message: "e3" },
      ]),
    ).toBe("red");
  });
});
