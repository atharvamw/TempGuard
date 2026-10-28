import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { verifyDeviceAuth } from "../device-auth";

describe("verifyDeviceAuth", () => {
  const originalEnv = process.env.DEVICE_API_TOKEN;

  beforeEach(() => {
    process.env.DEVICE_API_TOKEN = "super-secret-token-123";
  });

  afterEach(() => {
    process.env.DEVICE_API_TOKEN = originalEnv;
  });

  it("authenticates valid Bearer token", () => {
    expect(verifyDeviceAuth("Bearer super-secret-token-123")).toBe(true);
    expect(verifyDeviceAuth("bearer super-secret-token-123")).toBe(true);
  });

  it("authenticates raw token without Bearer prefix", () => {
    expect(verifyDeviceAuth("super-secret-token-123")).toBe(true);
  });

  it("rejects wrong token", () => {
    expect(verifyDeviceAuth("Bearer wrong-token-xyz")).toBe(false);
    expect(verifyDeviceAuth("wrong-token-xyz")).toBe(false);
  });

  it("rejects missing, null, or empty header", () => {
    expect(verifyDeviceAuth(null)).toBe(false);
    expect(verifyDeviceAuth(undefined)).toBe(false);
    expect(verifyDeviceAuth("")).toBe(false);
    expect(verifyDeviceAuth("Bearer ")).toBe(false);
  });

  it("rejects when server secret is unset", () => {
    delete process.env.DEVICE_API_TOKEN;
    expect(verifyDeviceAuth("Bearer super-secret-token-123")).toBe(false);
  });
});
