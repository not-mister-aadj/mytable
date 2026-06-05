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
      "Er ging iets mis tijdens het afrekenen. Geen zorgen — je tafel is nog niet definitief geboekt.",
    primaryCta: "Probeer opnieuw",
    secondaryCta: "Terug naar agenda",
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
        title: "Details volgen later",
        description:
          "Venues en route-informatie kunnen later worden vrijgegeven — je hoort het van ons.",
      },
      {
        title: "Dieetwensen",
        description:
          "Heb je dieetwensen doorgegeven? Die nemen we mee en bevestigen we in je mail.",
      },
      {
        title: "Tot aan tafel",
        description:
          "Kom op tijd, ontspan en laat het gesprek vanzelf ontstaan — dat is waar MyTable om draait.",
      },
    ],
  },
  community: {
    title: "Aan tafel ontstaat het vanzelf",
    body: "Veel gasten komen alleen. Anderen nemen vrienden mee. Aan tafel ontstaat het vanzelf — nieuwe gesprekken, goede wijn, en een avond die anders loopt dan je dacht.",
    galleryAlt: "Sfeerbeeld MyTable avond",
  },
};
