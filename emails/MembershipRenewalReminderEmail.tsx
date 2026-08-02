import { EmailLayout } from "./components/EmailLayout";
import { Button } from "./components/Button";

export type MembershipRenewalReminderEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  /** Trial (1m) gets an upsell; longer plans get a plain renewal note. */
  variant: "trial_upsell" | "renewal";
  planLabel: string;
  amountLabel: string;
  renewalDateLabel: string;
  manageUrl: string;
  /** Shown on trial upsell (e.g. "€10"). */
  plan5mPerMonthLabel?: string;
  /** Shown on trial upsell (e.g. "€8,33"). */
  plan12mPerMonthLabel?: string;
  plan5mTotalLabel?: string;
  plan12mTotalLabel?: string;
};

export function MembershipRenewalReminderEmail({
  locale,
  firstName,
  variant,
  planLabel,
  amountLabel,
  renewalDateLabel,
  manageUrl,
  plan5mPerMonthLabel = "€10",
  plan12mPerMonthLabel = "€8,33",
  plan5mTotalLabel = "€50",
  plan12mTotalLabel = "€100",
}: MembershipRenewalReminderEmailProps) {
  const nl = locale !== "en";
  const greeting = firstName
    ? nl
      ? `Hoi ${firstName},`
      : `Hi ${firstName},`
    : nl
      ? "Hoi,"
      : "Hi,";

  if (variant === "trial_upsell") {
    return (
      <EmailLayout
        preview={
          nl
            ? "Je trial loopt bijna af. Kies een plan dat minder kost."
            : "Your trial is ending. Switch to a cheaper plan."
        }
      >
        <p style={{ margin: "0 0 16px", fontSize: 16, color: "#2b0d12" }}>
          {greeting}
        </p>
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 16,
            color: "#2b0d12",
            lineHeight: 1.5,
          }}
        >
          {nl
            ? `Over 7 dagen eindigt je trialmaand (${renewalDateLabel}).`
            : `In 7 days your trial month ends (${renewalDateLabel}).`}
        </p>
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 15,
            color: "#5c3a42",
            lineHeight: 1.55,
          }}
        >
          {nl
            ? `Doe je niks, dan betaal je opnieuw de trialprijs: ${amountLabel} voor nog een maand.`
            : `If you do nothing, you pay the trial price again: ${amountLabel} for another month.`}
        </p>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 15,
            color: "#5c3a42",
            lineHeight: 1.55,
          }}
        >
          {nl
            ? "Vond je Sunday Table wat? Stap dan over op een langer plan. Alleen dan wordt Clubmember een stuk goedkoper per maand."
            : "If Sunday Table clicked for you, switch to a longer plan. Only then does Clubmember get much cheaper per month."}
        </p>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 15,
            color: "#2b0d12",
            lineHeight: 1.6,
          }}
        >
          {nl ? (
            <>
              <strong>5 maanden:</strong> {plan5mTotalLabel} (
              {plan5mPerMonthLabel}/maand)
              <br />
              <strong>12 maanden:</strong> {plan12mTotalLabel} (
              {plan12mPerMonthLabel}/maand)
            </>
          ) : (
            <>
              <strong>5 months:</strong> {plan5mTotalLabel} (
              {plan5mPerMonthLabel}/month)
              <br />
              <strong>12 months:</strong> {plan12mTotalLabel} (
              {plan12mPerMonthLabel}/month)
            </>
          )}
        </p>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: 15,
            color: "#5c3a42",
            lineHeight: 1.55,
          }}
        >
          {nl
            ? "Als je upgrade, gaat die in na je trial. Je mist geen Sunday Table."
            : "If you upgrade, it starts after your trial. You will not miss a Sunday Table."}
        </p>
        <Button href={manageUrl}>
          {nl ? "Kies een voordeliger plan" : "Choose a cheaper plan"}
        </Button>
        <p style={{ margin: "20px 0 0", fontSize: 13, color: "#8a6a72" }}>
          {nl
            ? `Nu op: ${planLabel}. Liever stopzetten? Dat kan ook via dezelfde pagina.`
            : `Currently on: ${planLabel}. Prefer to cancel? You can do that on the same page.`}
        </p>
      </EmailLayout>
    );
  }

  return (
    <EmailLayout
      preview={
        nl
          ? `Je Clubmember verlengt op ${renewalDateLabel}`
          : `Your Clubmember plan renews on ${renewalDateLabel}`
      }
    >
      <p style={{ margin: "0 0 16px", fontSize: 16, color: "#2b0d12" }}>
        {greeting}
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 16, color: "#2b0d12" }}>
        {nl
          ? "Over 7 dagen verlengt je Clubmember-abonnement automatisch."
          : "In 7 days your Clubmember subscription renews automatically."}
      </p>
      <p
        style={{
          margin: "0 0 8px",
          fontSize: 15,
          color: "#5c3a42",
          lineHeight: 1.5,
        }}
      >
        {nl ? (
          <>
            Plan: <strong style={{ color: "#2b0d12" }}>{planLabel}</strong>
            <br />
            Bedrag: <strong style={{ color: "#2b0d12" }}>{amountLabel}</strong>
            <br />
            Verlengdatum:{" "}
            <strong style={{ color: "#2b0d12" }}>{renewalDateLabel}</strong>
          </>
        ) : (
          <>
            Plan: <strong style={{ color: "#2b0d12" }}>{planLabel}</strong>
            <br />
            Amount: <strong style={{ color: "#2b0d12" }}>{amountLabel}</strong>
            <br />
            Renews on:{" "}
            <strong style={{ color: "#2b0d12" }}>{renewalDateLabel}</strong>
          </>
        )}
      </p>
      <p
        style={{
          margin: "0 0 24px",
          fontSize: 15,
          color: "#5c3a42",
          lineHeight: 1.5,
        }}
      >
        {nl
          ? "Geen actie nodig als je wilt doorgaan. Wil je stopzetten of je betaling beheren? Dat kan via je account."
          : "No action needed if you want to continue. Want to cancel or manage billing? You can do that from your account."}
      </p>
      <Button href={manageUrl}>
        {nl ? "Betaling beheren" : "Manage billing"}
      </Button>
    </EmailLayout>
  );
}
