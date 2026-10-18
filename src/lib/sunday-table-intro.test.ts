import assert from "node:assert/strict";
import test from "node:test";
import { signSundayTableIntroToken, verifySundayTableIntroToken } from "@/lib/sunday-table-intro";

const BOOKING = "d2c1f624-7d5d-4ee8-8ea6-af379ab9c5d6";

function withEnv(env: Record<string, string | undefined>, run: () => Promise<void>) {
  return async () => {
    const saved: Record<string, string | undefined> = {};
    for (const key of ["INTRO_TOKEN_SECRET", "REVIEW_TOKEN_SECRET", "CRON_SECRET", "AUTH_SECRET"]) {
      saved[key] = process.env[key];
      if (key in env) {
        if (env[key] === undefined) delete process.env[key];
        else process.env[key] = env[key];
      } else delete process.env[key];
    }
    try {
      await run();
    } finally {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  };
}

test(
  "a link signed with the general secret still opens once INTRO_TOKEN_SECRET is set",
  withEnv({ CRON_SECRET: "general" }, async () => {
    const old = await signSundayTableIntroToken(BOOKING);
    process.env.INTRO_TOKEN_SECRET = "intro";
    assert.equal(await verifySundayTableIntroToken(old), BOOKING);
  }),
);

test(
  "a link signed with INTRO_TOKEN_SECRET opens on a server that has both keys",
  withEnv({ INTRO_TOKEN_SECRET: "intro" }, async () => {
    const handSent = await signSundayTableIntroToken(BOOKING);
    process.env.CRON_SECRET = "general";
    assert.equal(await verifySundayTableIntroToken(handSent), BOOKING);
  }),
);

test(
  "a link signed with an unknown key does not open",
  withEnv({ INTRO_TOKEN_SECRET: "someone-else" }, async () => {
    const foreign = await signSundayTableIntroToken(BOOKING);
    process.env.INTRO_TOKEN_SECRET = "intro";
    process.env.CRON_SECRET = "general";
    assert.equal(await verifySundayTableIntroToken(foreign), null);
  }),
);

test("a new booking takes the guest's earlier answers but keeps its own", async () => {
  const { mergeIntro } = await import("@/lib/sunday-table-intro");
  const booking = { conversationStyle: null, askMeAbout: "", favoriteSpot: "Cinerama", wine: null, intoNow: "", plusOneName: "Rob", shareConsent: false };
  const saved = { conversationStyle: "listener" as const, askMeAbout: "Frankrijk", favoriteSpot: "Juni", wine: "red" as const, intoNow: "", shareConsent: true };
  assert.deepEqual(mergeIntro(booking, saved), {
    conversationStyle: "listener",
    askMeAbout: "Frankrijk",
    favoriteSpot: "Cinerama",
    wine: "red",
    intoNow: "",
    plusOneName: "Rob",
    shareConsent: true,
  });
  assert.deepEqual(mergeIntro(booking, null), booking);
});
