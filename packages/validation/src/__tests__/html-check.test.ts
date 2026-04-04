import { describe, it, expect } from "vitest";
import { checkHtml } from "../html-check";

describe("checkHtml", () => {
  it("flags missing alt attributes", () => {
    const issues = checkHtml('<img src="test.jpg">');
    expect(issues.some((i) => i.message.includes("alt"))).toBe(true);
  });

  it("does not flag images with alt", () => {
    const issues = checkHtml('<img src="test.jpg" alt="description">');
    expect(issues.some((i) => i.message.includes("missing alt"))).toBe(false);
  });

  it("flags deprecated elements", () => {
    const issues = checkHtml("<center>Hello</center>");
    expect(issues.some((i) => i.message.includes("Deprecated"))).toBe(true);
  });
});
