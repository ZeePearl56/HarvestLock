import { describe, it, expect, vi } from "vitest";
import { withRetry } from "./retry";

// Same four cases as api/test/retry.test.ts's suite for the helper this
// was mirrored from — kept in lockstep so the two copies of the shape
// can't silently diverge.
describe("withRetry", () => {
  it("returns the result on the first try if it succeeds", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, { baseDelayMs: 1 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries after a transient error and succeeds if a later attempt works", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch timeout"))
      .mockResolvedValueOnce("ok");
    const result = await withRetry(fn, { baseDelayMs: 1 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("gives up after 3 attempts on a non-transient error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("400 Bad request"));
    await expect(withRetry(fn, { attempts: 3, baseDelayMs: 1 })).rejects.toThrow("400 Bad request");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("stops after 1 attempt on a non-transient error when unspecified attempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("403 Forbidden"));
    await expect(withRetry(fn, { baseDelayMs: 1 })).rejects.toThrow("403 Forbidden");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
