import type { EventFormState } from "@/app/admin/(dashboard)/events/actions";

export function validateEventForm(form: EventFormState): string | null {
  if (!form.nameNl?.trim()) {
    return "Vul een eventnaam (NL) in onder stap Basis.";
  }
  if (!form.nameEn?.trim()) {
    return "Vul een eventnaam (EN) in onder stap Basis.";
  }
  if (!form.city?.trim()) {
    return "Vul een stad in onder stap Basis.";
  }
  if (!form.startsAt?.trim()) {
    return "Vul een startdatum in onder stap Basis.";
  }
  const priceEuros = Number.parseFloat(form.priceEuros.replace(",", "."));
  if (!Number.isFinite(priceEuros) || priceEuros < 0) {
    return "Vul een geldige prijs in onder stap Basis.";
  }
  const startsAt = new Date(form.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return "De startdatum is ongeldig.";
  }
  if (form.endsAt?.trim()) {
    const endsAt = new Date(form.endsAt);
    if (Number.isNaN(endsAt.getTime())) {
      return "De einddatum is ongeldig.";
    }
  }
  return null;
}

export function formatEventSaveError(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: string }).code);
    if (code === "23505") {
      return "Deze URL bestaat al voor een ander event. Pas tafelnaam, stad of datum aan.";
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Opslaan mislukt. Probeer het opnieuw.";
}
