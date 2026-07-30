/** Fire-and-forget CRM sync after client-side OTP login or onboarding. */
export async function syncMemberCustomerClient(
  locale: string,
  options?: { recordOnboarding?: boolean },
): Promise<void> {
  try {
    await fetch("/api/auth/member/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        recordOnboarding: options?.recordOnboarding === true,
      }),
    });
  } catch {
    // non-blocking
  }
}
