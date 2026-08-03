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
  /** Upcoming Sunday Table date label (trial email). */
  nextTableDateLabel?: string;
  /** When true, copy can say "next week". */
  nextTableIsSoon?: boolean;
  /** Shown on trial upsell (e.g. "€10"). */
  plan5mPerMonthLabel?: string;
  /** Shown on trial upsell (e.g. "€8,33"). */
  plan12mPerMonthLabel?: string;
  plan5mTotalLabel?: string;
  plan12mTotalLabel?: string;
  /** Trial month one-time price (e.g. "€21"). */
  plan1mTotalLabel?: string;
};

export function MembershipRenewalReminderEmail({
  locale,
  firstName,
  variant,
  planLabel,
  amountLabel,
  renewalDateLabel,
  manageUrl,
  nextTableDateLabel,
  nextTableIsSoon = false,
  plan5mPerMonthLabel = "€10",
  plan12mPerMonthLabel = "€8,33",
  plan5mTotalLabel = "€50",
  plan12mTotalLabel = "€100",
  plan1mTotalLabel = "€21",
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
    const tableLine = nextTableDateLabel
      ? nl
        ? nextTableIsSoon
          ? `De volgende Sunday Table is volgende week: ${nextTableDateLabel}.`
          : `De volgende Sunday Table is op ${nextTableDateLabel}.`
        : nextTableIsSoon
          ? `The next Sunday Table is next week: ${nextTableDateLabel}.`
          : `The next Sunday Table is on ${nextTableDateLabel}.`
      : null;

    return (
      <EmailLayout
        preview={
          nl
            ? "De volgende Sunday Table komt eraan. Blijf je erbij?"
            : "Your next Sunday Table is coming up. Are you staying?"
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
            lineHeight: 1.55,
          }}
        >
          {nl
            ? `Je trialmaand loopt af op ${renewalDateLabel}. Geen automatische verlenging: je hoeft niks te stopzetten.`
            : `Your trial month ends on ${renewalDateLabel}. No auto-renewal: nothing to cancel.`}
        </p>
        {tableLine ? (
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 16,
              color: "#2b0d12",
              lineHeight: 1.55,
            }}
          >
            {tableLine}
          </p>
        ) : null}
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 15,
            color: "#5c3a42",
            lineHeight: 1.6,
          }}
        >
          {nl
            ? "Vond je het wat? Dan heb je twee manieren om door te gaan:"
            : "If it clicked for you, you have two ways to stay:"}
        </p>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 15,
            color: "#2b0d12",
            lineHeight: 1.65,
          }}
        >
          {nl ? (
            <>
              <strong>Nog een trialmaand</strong>: {plan1mTotalLabel}, eenmalig.
              Weer een maand Sunday Tables, opnieuw zonder verlenging.
              <br />
              <br />
              <strong>Of doe zoals de meeste Clubmembers</strong>: 5 maanden
              voor {plan5mTotalLabel} ({plan5mPerMonthLabel}/maand). Je zit er
              een half seizoen in, zonder elke maand opnieuw te kiezen.
            </>
          ) : (
            <>
              <strong>Another trial month</strong>: {plan1mTotalLabel}, one-time.
              Another month of Sunday Tables, again with no auto-renewal.
              <br />
              <br />
              <strong>Or do what most Clubmembers do</strong>: 5 months for{" "}
              {plan5mTotalLabel} ({plan5mPerMonthLabel}/month). A half season in,
              without deciding again every month.
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
            ? `Liever het hele jaar? 12 maanden is ${plan12mTotalLabel} (${plan12mPerMonthLabel}/maand).`
            : `Prefer the full year? 12 months is ${plan12mTotalLabel} (${plan12mPerMonthLabel}/month).`}
        </p>
        <Button href={manageUrl}>
          {nl ? "Kies hoe je doorgaat" : "Choose how you continue"}
        </Button>
        <p style={{ margin: "20px 0 0", fontSize: 13, color: "#8a6a72" }}>
          {nl
            ? "Was het niks? Helemaal oké. Je toegang stopt vanzelf, geen verrassing op je rekening."
            : "Not for you? Totally fine. Access ends on its own, no surprise on your bill."}
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
