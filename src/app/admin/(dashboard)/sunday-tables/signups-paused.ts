/** Sign-ups are paused site-wide — /join was deleted and /login is now a
 * coming-soon page. Flip this back once sign-ups reopen; until then, invite
 * emails would link people to a page that no longer exists.
 *
 * Lives outside actions.ts on purpose: a "use server" file may only export
 * async functions, so a plain constant can't live there (broke the Vercel
 * build — invisible to `tsc --noEmit`, only caught by a real `next build`). */
export const SIGNUPS_PAUSED = true;
