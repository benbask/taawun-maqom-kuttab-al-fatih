import { describe, expect, it } from "vitest";
import { googleIdentityFromPayload } from "@/lib/google-identity";

const CLIENT_ID = "1234567890-example.apps.googleusercontent.com";
const future = Math.floor(Date.now() / 1000) + 600;

function payload(overrides: Record<string, unknown> = {}) {
  return {
    sub: "google-sub-123",
    iss: "https://accounts.google.com",
    aud: CLIENT_ID,
    exp: future,
    email: "Wali@Example.com",
    email_verified: true,
    name: "Uji Wali",
    ...overrides,
  };
}

describe("googleIdentityFromPayload", () => {
  it("menerima ID token Google yang valid", () => {
    const identity = googleIdentityFromPayload(payload(), CLIENT_ID);
    expect(identity).toEqual({
      sub: "google-sub-123",
      email: "wali@example.com",
      name: "Uji Wali",
      emailVerified: true,
    });
  });

  it("menolak audience yang tidak cocok", () => {
    expect(
      googleIdentityFromPayload(payload({ aud: "client-lain" }), CLIENT_ID),
    ).toBeNull();
  });

  it("menolak issuer yang tidak dikenal", () => {
    expect(
      googleIdentityFromPayload(payload({ iss: "https://evil.test" }), CLIENT_ID),
    ).toBeNull();
  });

  it("menolak token kedaluwarsa", () => {
    expect(
      googleIdentityFromPayload(payload({ exp: future - 1200 }), CLIENT_ID),
    ).toBeNull();
  });

  it("mengabaikan email yang belum terverifikasi", () => {
    const identity = googleIdentityFromPayload(
      payload({ email_verified: false }),
      CLIENT_ID,
    );
    expect(identity?.email).toBeNull();
    expect(identity?.emailVerified).toBe(false);
  });
});
