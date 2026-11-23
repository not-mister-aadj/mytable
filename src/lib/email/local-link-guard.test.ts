import assert from "node:assert/strict";
import { test } from "node:test";
import { localLinkProblem } from "./local-link-guard";

test("refuses a localhost link to a real guest", () => {
  assert.ok(localLinkProblem({ to: "guest@gmail.com", html: '<a href="http://localhost:3001/auth/in?t=x">Bekijk</a>' }));
  assert.ok(localLinkProblem({ to: ["guest@gmail.com"], text: "Open http://127.0.0.1:3000/x" }));
});

test("lets a test inbox and normal mails through", () => {
  assert.equal(localLinkProblem({ to: "delivered@resend.dev", html: '<a href="http://localhost:3001/x">x</a>' }), null);
  assert.equal(localLinkProblem({ to: "guest@gmail.com", html: '<a href="https://www.mytable.club/sunday-social">x</a>' }), null);
  assert.equal(localLinkProblem({ to: "guest@gmail.com", text: "We zitten bij een localhostbar" }), null);
});

test("a mix of a test inbox and a real guest is refused", () => {
  assert.ok(localLinkProblem({ to: ["delivered@resend.dev", "guest@gmail.com"], html: "http://localhost:3001/" }));
});
