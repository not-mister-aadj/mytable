// Run with: npx tsx --test src/lib/jouw-tafel/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  classifySendCodeError,
  classifyVerifyCodeError,
  isGoogleSignInAllowed,
  isInAppBrowser,
  isNewAuthUser,
  sanitizeAuthCode,
  validateAuthEmail,
} from "./auth-logic";

const IN_APP: Record<string, string> = {
  instagramIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 337.0.3.23.54 (iPhone15,2; iOS 17_5; nl_NL; nl; scale=3.00; 1179x2556; 614405651)",
  instagramAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A.240605.024; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.71 Mobile Safari/537.36 Instagram 337.0.0.36.111 Android (34/14; 420dpi; 1080x2400; Google/google; Pixel 8; shiba; shiba; nl_NL; 614405651)",
  facebookIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0.0.37.106;FBBV/617441440;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.5;FBSS/3;FBID/phone;FBLC/nl_NL;FBOP/5;FBRV/0]",
  facebookAndroid:
    "Mozilla/5.0 (Linux; Android 14; SM-S911B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.71 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/470.0.0.40.94;]",
  messengerIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 LightSpeed [FBAN/MessengerLiteForiOS;FBAV/466.0.0.31.107;FBBV/609766617;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.5;FBSS/3;FBCR/;FBID/phone;FBLC/nl_NL;FBOP/0]",
  tiktok:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_35.1.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/nl Region/NL",
  snapchat:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Snapchat/13.0.0.40 (like Safari/8618.2.12.10.9, panda)",
  linkedin:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.30.1",
  line: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/14.9.0",
  pinterest:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [Pinterest/iOS]",
  androidWebView:
    "Mozilla/5.0 (Linux; Android 13; SM-A536B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.6422.165 Mobile Safari/537.36",
  iosWebView:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
};

const NORMAL: Record<string, string> = {
  safariIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  chromeIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1",
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  samsungInternet:
    "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",
  chromeDesktop:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  safariMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  firefoxDesktop:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
};

test("detects in-app browsers and webviews", () => {
  for (const [name, ua] of Object.entries(IN_APP)) {
    assert.equal(isInAppBrowser(ua), true, name);
  }
});

test("treats normal browsers as normal", () => {
  for (const [name, ua] of Object.entries(NORMAL)) {
    assert.equal(isInAppBrowser(ua), false, name);
  }
  assert.equal(isInAppBrowser(""), false);
  assert.equal(isInAppBrowser(null), false);
  assert.equal(isInAppBrowser(undefined), false);
});

test("Google sign-in needs the flag and a normal browser", () => {
  assert.equal(isGoogleSignInAllowed({ flag: "true", userAgent: NORMAL.safariIos }), true);
  assert.equal(isGoogleSignInAllowed({ flag: "true", userAgent: IN_APP.instagramIos }), false);
  assert.equal(isGoogleSignInAllowed({ flag: undefined, userAgent: NORMAL.safariIos }), false);
  assert.equal(isGoogleSignInAllowed({ flag: "false", userAgent: NORMAL.chromeDesktop }), false);
  assert.equal(isGoogleSignInAllowed({ flag: "1", userAgent: NORMAL.chromeDesktop }), false);
});

test("validates the email field", () => {
  assert.equal(validateAuthEmail(""), "empty");
  assert.equal(validateAuthEmail("   "), "empty");
  assert.equal(validateAuthEmail("anna"), "invalid");
  assert.equal(validateAuthEmail("anna@gmail"), "invalid");
  assert.equal(validateAuthEmail("anna @gmail.com"), "invalid");
  assert.equal(validateAuthEmail(" Anna@Gmail.com "), null);
});

test("keeps only the digits of a code", () => {
  assert.equal(sanitizeAuthCode("123 456"), "123456");
  assert.equal(sanitizeAuthCode("12-34-56-78"), "123456");
  assert.equal(sanitizeAuthCode("abc"), "");
});

test("new account window", () => {
  const now = Date.parse("2026-10-02T12:00:00Z");
  assert.equal(isNewAuthUser("2026-10-02T11:58:00Z", now), true);
  assert.equal(isNewAuthUser("2026-10-01T11:58:00Z", now), false);
  assert.equal(isNewAuthUser(null, now), false);
  assert.equal(isNewAuthUser("nonsense", now), false);
});

test("maps Supabase errors", () => {
  assert.equal(
    classifySendCodeError({ code: "otp_disabled", status: 422, message: "Signups not allowed for otp" }),
    "unknown_email",
  );
  assert.equal(classifySendCodeError({ message: "Signups not allowed for otp" }), "unknown_email");
  assert.equal(classifySendCodeError({ code: "over_email_send_rate_limit", status: 429 }), "rate_limited");
  assert.equal(
    classifySendCodeError({ message: "For security purposes, you can only request this after 42 seconds." }),
    "rate_limited",
  );
  assert.equal(classifySendCodeError({ code: "email_address_invalid" }), "invalid_email");
  assert.equal(classifySendCodeError({ message: "fetch failed" }), "other");

  assert.equal(
    classifyVerifyCodeError({ code: "otp_expired", status: 403, message: "Token has expired or is invalid" }),
    "wrong_or_expired",
  );
  assert.equal(classifyVerifyCodeError({ status: 403 }), "wrong_or_expired");
  assert.equal(classifyVerifyCodeError({ code: "over_request_rate_limit", status: 429 }), "rate_limited");
  assert.equal(classifyVerifyCodeError({ message: "Failed to fetch" }), "other");
});
