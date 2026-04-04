import { describe, it, expect } from "vitest";
import { checkA11y } from "../a11y-check";

describe("checkA11y", () => {
  it("flags vague link text", () => {
    const issues = checkA11y('<a href="/page">click here</a>');
    expect(issues.some((i) => i.message.includes("Vague link text"))).toBe(true);
  });

  it("flags heading level skip", () => {
    const issues = checkA11y("<h1>Title</h1><h3>Subtitle</h3>");
    expect(issues.some((i) => i.message.includes("Heading level skipped"))).toBe(true);
  });
});
