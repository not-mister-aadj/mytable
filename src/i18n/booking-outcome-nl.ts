import type { BookingOutcomeLabels } from "./types";

export const bookingOutcomeNl: BookingOutcomeLabels = {
  success: {
    eyebrow: "Bevestigd",
    headline: "Je tafel staat klaar",
    subtext:
      "Je betaling is verwerkt. Binnen enkele minuten ontvang je alle details per e-mail.",
    primaryCta: "Aan tafel bekijken",
    secondaryCta: "Bekijk meer tafels",
  },
  failed: {
    eyebrow: "Geen reservering",
    headline: "Betaling niet gelukt",
    subtext:
      "Er ging iets mis tijdens het afrekenen. Geen zorgen, je tafel is nog niet definitief geboekt.",
    primaryCta: "Probeer opnieuw",
    secondaryCta: "Terug naar agenda",
  },
  pending: {
    eyebrow: "Even geduld",
    headline: "Je betaling wordt bevestigd",
    subtext: "We halen je boeking op. Dit duurt meestal maar een paar seconden.",
    timeoutSubtext:
      "Dit duurt langer dan verwacht. Ververs de pagina of wacht op de bevestigingsmail — je betaling is waarschijnlijk al verwerkt.",
  },
  summary: {
    title: "Je reservering",
    date: "Datum & tijd",
    city: "Stad",
    guests: "Gasten",
    amount: "Betaald",
    code: "Reserveringscode",
    guestLabel: "{count} gast | {count} gasten",
  },
  nextSteps: {
    title: "Wat gebeurt er nu?",
    items: [
      {
        title: "Bevestiging per e-mail",
        description:
          "Je ontvangt binnen enkele minuten een e-mail met je boeking en praktische info.",
      },
      {
        title: "Dieetwensen",
        description:
          "Heb je dieetwensen? Het is altijd verstandig om die te melden bij de venue, ook als je ze al bij je boeking hebt doorgegeven.",
      },
      {
        title: "Tot aan tafel",
        description:
          "Kom op tijd, ontspan en geniet van je avond. Dat is waar MyTable om draait.",
      },
    ],
  },
  community: {
    title: "Superlekkere wijnen en gerechten",
    body: "Je avond draait om culinaire ontdekkingen: bijzondere restaurants, zorgvuldig gekozen wijnen en gerechten die je laten proeven, verrassen en genieten.",
    galleryAlt: "Sfeerimpressie",
  },
};
