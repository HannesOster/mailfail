import { describe, it, expect } from "vitest";
import { checkSpam } from "../spam-check";

describe("checkSpam", () => {
  it("flags missing unsubscribe link", () => {
    const result = checkSpam("<p>Hello</p>");
    expect(result.details.some((d) => d.message.includes("unsubscribe"))).toBe(true);
  });

  it("does not flag when unsubscribe link exists", () => {
    const result = checkSpam('<a href="/unsubscribe">Unsubscribe</a>');
    expect(result.details.some((d) => d.message.includes("unsubscribe"))).toBe(false);
  });

  it("flags ALL CAPS subject", () => {
    const result = checkSpam("<p>Hello</p>", { subject: "BUY NOW FREE" });
    expect(result.details.some((d) => d.message.includes("ALL CAPS"))).toBe(true);
  });
});
