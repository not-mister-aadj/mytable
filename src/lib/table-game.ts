/**
 * The table game on the table page (26 Nov 2026): no host, everyone on their
 * own phone, the same cards in the same order on every phone of the table.
 *
 * Round 1, "Raad wie": answers from "Meet your table" without a name; the
 * table guesses who said it, then that person tells about it.
 * Round 2: light questions anyone can answer, wherever they live.
 */

export type GameLocale = "nl" | "en";

type Answers = { askMeAbout?: string; favoriteSpot?: string; intoNow?: string } | null;
export type GameMate = { bookingId: string; firstName: string; answers: Answers };

export type GuessCard = { bookingId: string; name: string; prompt: string; answer: string };
export type TableGame = { guesses: GuessCard[]; names: string[]; questions: string[] };

const FIELDS = ["intoNow", "askMeAbout", "favoriteSpot"] as const;

function prompts(locale: GameLocale, city: string): Record<(typeof FIELDS)[number], string> {
  return locale === "en"
    ? { intoNow: "What are you really into right now?", askMeAbout: "What can people ask you about?", favoriteSpot: `Favourite spot in ${city}?` }
    : { intoNow: "Waar ben je nu helemaal into?", askMeAbout: "Waar mogen mensen je naar vragen?", favoriteSpot: `Favoriete plek in ${city}?` };
}

/** Four groups of five; a table gets two from each. */
const QUESTIONS: Record<GameLocale, string[][]> = {
  nl: [
    [
      "Waar neem je een vriend mee die bij je op bezoek komt?",
      "Wat is de leukste plek die je dit jaar ontdekte?",
      "Stad, dorp of strand: waar breng je het liefst een vrije dag door?",
      "Wat is je vaste adres voor een snelle hap?",
      "Welke reis staat nog bovenaan je lijstje?",
    ],
    [
      "Wat bestel je als je een zaak niet kent?",
      "Wat at je als kind het liefst, en eet je het nog steeds?",
      "Zoet of hartig, als je moet kiezen?",
      "Welk gerecht kook je als er vrienden komen eten?",
      "Wat is iets dat je pas later in je leven lekker bent gaan vinden?",
    ],
    [
      "Wat doe je het liefst op een zondagmiddag?",
      "Welk uitje raad je iedereen aan?",
      "Welke serie of podcast mag niemand aan tafel missen?",
      "Wat doe je als je een middag helemaal niets hoeft?",
      "Waar kun je uren over praten?",
    ],
    [
      "Welke kleine gewoonte maakt jouw week beter?",
      "Wat wil je ooit nog leren?",
      "Ochtendmens of avondmens?",
      "Waar keek je deze week naar uit?",
      "Welk liedje zet jij op als jij de muziek mag kiezen?",
    ],
  ],
  en: [
    [
      "Where do you take a friend who comes to visit?",
      "What's the best place you discovered this year?",
      "City, village or beach: where do you spend a free day?",
      "What's your go-to spot for a quick bite?",
      "Which trip is still at the top of your list?",
    ],
    [
      "What do you order when you don't know a place?",
      "What did you love eating as a child, and do you still eat it?",
      "Sweet or savoury, if you have to choose?",
      "What do you cook when friends come over?",
      "What's something you only started to like later in life?",
    ],
    [
      "What do you most like doing on a Sunday afternoon?",
      "Which outing do you recommend to everyone?",
      "Which series or podcast should nobody at this table miss?",
      "What do you do when you have an afternoon with nothing to do?",
      "What could you talk about for hours?",
    ],
    [
      "Which small habit makes your week better?",
      "What would you still like to learn one day?",
      "Morning person or evening person?",
      "What were you looking forward to this week?",
      "Which song do you put on when you get to pick the music?",
    ],
  ],
};

/** A small seeded random, so every phone at the table shuffles the same way. */
function seeded(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * The cards for one phone. Whoever holds the phone plays: they choose to
 * point (guess whose answer this is) or to answer a question, then pass the
 * turn on. So phones need not match: each draws its own order (`seed`), and
 * never shows its owner their own answers.
 */
export function buildTableGame(input: { mates: GameMate[]; locale: GameLocale; city: string; seed: string; myBookingId: string }): TableGame {
  const random = seeded(input.seed);
  const label = prompts(input.locale, input.city);
  const mates = [...input.mates].sort((a, b) => a.bookingId.localeCompare(b.bookingId));
  const names = [...new Set(mates.map((m) => m.firstName.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const mine = (id: string) => id === input.myBookingId || id === `${input.myBookingId}+1`;

  const cards: GuessCard[] = [];
  mates.forEach((m, index) => {
    if (!m.answers || !m.firstName.trim() || mine(m.bookingId)) return;
    // A different question first for each person, so the cards vary.
    for (let k = 0; k < FIELDS.length; k += 1) {
      const field = FIELDS[(index + k) % FIELDS.length]!;
      const answer = m.answers[field]?.trim();
      if (answer) {
        cards.push({ bookingId: m.bookingId, name: m.firstName.trim(), prompt: label[field], answer });
        return;
      }
    }
  });
  return { guesses: shuffle(cards, random), names, questions: shuffle(QUESTIONS[input.locale].flat(), random) };
}
