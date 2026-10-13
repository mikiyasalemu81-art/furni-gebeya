import fs from "node:fs";
import path from "node:path";

// Load .env.local into process.env for test runner
try {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [k, ...v] = trimmed.split("=");
        process.env[k.trim()] = v.join("=").trim();
      }
    }
  }
} catch {
  // ignore
}

(process.env as any).NODE_ENV = "development";

import { normalizeEthiopianPhone } from "../src/lib/phone";
import {
  generateOtpCode,
  hashOtpCode,
  verifyOtpHash,
  requestAndSendOtp,
  verifyOtpAttempt,
} from "../src/lib/otp-service";


function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log("Running Stage 2 Authentication Tests...\n");

  // 1. Phone Normalization Tests
  console.log("1. Testing Ethiopian Phone Normalization...");
  const validInputs = [
    { input: "0911223344", expected: "+251911223344" },
    { input: "0712345678", expected: "+251712345678" },
    { input: "911223344", expected: "+251911223344" },
    { input: "712345678", expected: "+251712345678" },
    { input: "251911223344", expected: "+251911223344" },
    { input: "+251911223344", expected: "+251911223344" },
    { input: "+251 91 122 3344", expected: "+251911223344" },
    { input: "09-11-22-33-44", expected: "+251911223344" },
  ];

  for (const { input, expected } of validInputs) {
    const res = normalizeEthiopianPhone(input);
    assert(res.isValid, `Should be valid: ${input}`);
    assert(res.normalized === expected, `Normalized ${input} should equal ${expected}, got ${res.normalized}`);
  }

  const invalidInputs = [
    "0811223344", // invalid prefix 08
    "09112233",   // too short
    "091122334455", // too long
    "+14155552671", // US number
    "abcdefghij",
    "",
  ];

  for (const input of invalidInputs) {
    const res = normalizeEthiopianPhone(input);
    assert(!res.isValid, `Should be invalid: ${input}`);
    assert(Boolean(res.error), `Should have error message for: ${input}`);
  }
  console.log("✓ Phone normalization tests passed!");

  // 2. OTP Generation & Timing-Safe Hashing Tests
  console.log("\n2. Testing OTP Generation & Timing-Safe Comparison...");
  for (let i = 0; i < 5; i++) {
    const code = generateOtpCode();
    assert(code.length === 6, "Code must be 6 digits");
    assert(/^\d{6}$/.test(code), "Code must contain digits only");
    const hash = hashOtpCode(code);
    assert(hash.length === 64, "HMAC-SHA256 hex must be 64 characters");
    assert(verifyOtpHash(code, hash), "Timing-safe verify must match correct code");
    assert(!verifyOtpHash("999999", hash), "Timing-safe verify must reject incorrect code");
  }
  console.log("✓ OTP generation & timing-safe hash comparison passed!");

  // 3. Request OTP & Verification Flow Tests
  console.log("\n3. Testing Request OTP, Attempt Limits & Rate Limits...");
  const testPhone = "+251988112233";

  // Request code
  const req1 = await requestAndSendOtp({ phone: testPhone, ipAddress: "127.0.0.1" });
  if (!req1.success) {
    console.error("req1 error:", req1.error);
  }
  assert(req1.success, `Request OTP should succeed: ${req1.error}`);

  // Cooldown test (immediate second request must fail with cooldown)
  const reqCooldown = await requestAndSendOtp({ phone: testPhone, ipAddress: "127.0.0.1" });
  assert(!reqCooldown.success, "Immediate consecutive request should be blocked by 60s cooldown");
  assert(Boolean(reqCooldown.cooldownSeconds), "Should return remaining cooldown seconds");

  // Wrong attempts test (max 5)
  let attempt1 = await verifyOtpAttempt(testPhone, "000000");
  assert(!attempt1.success, "Wrong code should fail");
  assert(attempt1.attemptsRemaining === 4, "Should have 4 attempts remaining");

  let attempt2 = await verifyOtpAttempt(testPhone, "000000");
  assert(!attempt2.success, "Wrong code should fail");
  assert(attempt2.attemptsRemaining === 3, "Should have 3 attempts remaining");

  console.log("✓ Cooldown, attempt tracking, and error messaging tests passed!");

  console.log("\n=======================================================");
  console.log("ALL STAGE 2 TESTS PASSED SUCCESSFULLY!");
  console.log("=======================================================");
}

runTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
