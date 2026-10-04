import { SIGNUP_CONCEPT_LABEL, type SignupConcept } from "@/lib/signup-concept";

/** "Wachtlijst" (old waitlist funnel) or "Account" (/jouw-tafel), with
 * "+ account" when a waitlist person later made an account too. */
export function ConceptBadge({ concept, hasAccount = false }: { concept: SignupConcept; hasAccount?: boolean }) {
  const tone =
    concept === "account"
      ? "bg-burgundy/[0.08] text-burgundy ring-burgundy/20"
      : "bg-gold/15 text-[#7d5c2c] ring-gold/30";
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tone}`}>
      {SIGNUP_CONCEPT_LABEL[concept]}
      {concept === "waitlist" && hasAccount ? " + account" : ""}
    </span>
  );
}

export type ConceptFilter = "all" | SignupConcept | "overlap";

/** Filter options shared by the admin lists. */
export const CONCEPT_FILTER_OPTIONS: { value: ConceptFilter; label: string }[] = [
  { value: "all", label: "Alle concepten" },
  { value: "waitlist", label: "Wachtlijst" },
  { value: "account", label: "Account" },
  { value: "overlap", label: "Wachtlijst + account" },
];

export function matchesConceptFilter(filter: ConceptFilter, concept: SignupConcept, hasAccount: boolean): boolean {
  if (filter === "all") return true;
  if (filter === "overlap") return concept === "waitlist" && hasAccount;
  return concept === filter;
}
