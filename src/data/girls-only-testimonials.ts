import type { Locale } from "@/i18n/config";
import type { Testimonial, TestimonialAvatar } from "@/data/testimonials";

const avatars: TestimonialAvatar[] = ["rose", "burgundy", "gold", "wine"];

function pickAvatar(index: number): TestimonialAvatar {
  return avatars[index % avatars.length]!;
}

/** 12 reviews: ~50% group outings, ~50% solo, wine-first tone throughout. */
const girlsOnlyNl: Testimonial[] = [
  {
    name: "Lisa",
    detail: "Rotterdam · met 3 vriendinnen",
    quote:
      "Precies zo'n avond als we zochten. Vier wijnen, lekkere bites en nergens over hoeven nadenken. Onze nieuwe vaste girls' night.",
    initials: "L",
    avatar: pickAvatar(0),
  },
  {
    name: "Sanne",
    detail: "Den Haag · groep van 4",
    quote:
      "Met mijn zus en twee vriendinnen gereserveerd. Eigen tafel, alles geregeld. We zaten de hele avond te proeven, lachen en bij te kletsen.",
    initials: "S",
    avatar: pickAvatar(1),
  },
  {
    name: "Fleur",
    detail: "Utrecht · met vriendinnen",
    quote:
      "Eindelijk een avond uit zonder dat iemand 'waar gaan we eten?' hoeft te bedenken. Wijn en bites waren top, sfeer ook.",
    initials: "FL",
    avatar: pickAvatar(2),
  },
  {
    name: "Carmen",
    detail: "Maastricht · verjaardag met meiden",
    quote:
      "Verjaardag gevierd met mijn meiden. Voelde als uit eten, maar dan met proeverij en zonder gedoe. Iedereen was enthousiast.",
    initials: "C",
    avatar: pickAvatar(3),
  },
  {
    name: "Priya",
    detail: "Amsterdam · groep van 5",
    quote:
      "Vijf vriendinnen, één reservering, nul stress. De wijnen waren verrassend en de bites echt goed. We komen terug.",
    initials: "P",
    avatar: pickAvatar(4),
  },
  {
    name: "Sophie",
    detail: "Rotterdam · met beste vriendinnen",
    quote:
      "Ging met mijn twee beste vriendinnen. Precies de mix van gezelligheid en iets speciaals die we zochten voor onze maandelijkse avond.",
    initials: "SO",
    avatar: pickAvatar(5),
  },
  {
    name: "Noor",
    detail: "Utrecht · solo",
    quote:
      "Geen groep beschikbaar, dus solo gegaan. Binnen tien minuten zat ik al hard te lachen. Fijne tafel, geen awkward vibe.",
    initials: "N",
    avatar: pickAvatar(6),
  },
  {
    name: "Emma",
    detail: "Amsterdam · net verhuisd",
    quote:
      "Net verhuisd en nog geen vaste groep hier. Toch een hele fijne avond gehad, en ja, ik heb ook twee girls leren kennen.",
    initials: "E",
    avatar: pickAvatar(7),
  },
  {
    name: "Meera",
    detail: "Rotterdam · solo",
    quote:
      "Ik ben introvert en ging alleen. Maar het draaide vooral om de wijn en de sfeer, niet om 'nieuwe vriendinnen maken'. Dat maakte het relaxed.",
    initials: "M",
    avatar: pickAvatar(8),
  },
  {
    name: "Naomi",
    detail: "Rotterdam · solo",
    quote:
      "Solo geboekt omdat mijn vriendinnen niet konden. Uiteindelijk voelde het als een avond uit met gezellige meiden aan tafel.",
    initials: "NA",
    avatar: pickAvatar(9),
  },
  {
    name: "Anouk",
    detail: "Utrecht · met vriendin",
    quote:
      "Ik dacht dat het vooral over wijn zou gaan, en dat klopte. Het ging over leven, werk en grappige verhalen. En ja, de wijn was echt goed.",
    initials: "A",
    avatar: pickAvatar(10),
  },
  {
    name: "Britt",
    detail: "Den Haag · solo",
    quote:
      "Geen volledige groep, dus alleen gegaan. MyTable zorgde dat ik aan een fijne tafel belandde. Gewoon opdagen en genieten. Precies goed.",
    initials: "B",
    avatar: pickAvatar(11),
  },
];

const girlsOnlyEn: Testimonial[] = [
  {
    name: "Lisa",
    detail: "Rotterdam · with 3 friends",
    quote:
      "Exactly the kind of night we were looking for. Four wines, great bites, and zero planning stress. Our new go-to girls' night.",
    initials: "L",
    avatar: pickAvatar(0),
  },
  {
    name: "Sanne",
    detail: "The Hague · group of 4",
    quote:
      "Booked with my sister and two friends. Our own table, everything sorted. We spent the whole evening tasting, laughing, and catching up.",
    initials: "S",
    avatar: pickAvatar(1),
  },
  {
    name: "Fleur",
    detail: "Utrecht · with friends",
    quote:
      "Finally a night out without anyone asking 'where should we eat?' Wine and bites were great, vibe too.",
    initials: "FL",
    avatar: pickAvatar(2),
  },
  {
    name: "Carmen",
    detail: "Maastricht · birthday with the girls",
    quote:
      "Celebrated my birthday with my crew. Felt like dinner out, but with a tasting and no hassle. Everyone loved it.",
    initials: "C",
    avatar: pickAvatar(3),
  },
  {
    name: "Priya",
    detail: "Amsterdam · group of 5",
    quote:
      "Five friends, one reservation, zero stress. The wines were a surprise and the bites were really good. We're coming back.",
    initials: "P",
    avatar: pickAvatar(4),
  },
  {
    name: "Sophie",
    detail: "Rotterdam · with best friends",
    quote:
      "Went with my two best friends. Exactly the mix of cozy and something special we wanted for our monthly night out.",
    initials: "SO",
    avatar: pickAvatar(5),
  },
  {
    name: "Noor",
    detail: "Utrecht · solo",
    quote:
      "No group available, so I went solo. Within ten minutes I was laughing hard. Great table, no awkward vibe.",
    initials: "N",
    avatar: pickAvatar(6),
  },
  {
    name: "Emma",
    detail: "Amsterdam · new in town",
    quote:
      "Just moved and don't have a regular crew here yet. Still had a lovely evening, and yes, I met two girls I liked too.",
    initials: "E",
    avatar: pickAvatar(7),
  },
  {
    name: "Meera",
    detail: "Rotterdam · solo",
    quote:
      "I'm introverted and went alone. But it was mostly about the wine and the vibe, not 'making new friends.' That made it relaxed.",
    initials: "M",
    avatar: pickAvatar(8),
  },
  {
    name: "Naomi",
    detail: "Rotterdam · solo",
    quote:
      "Booked solo because my friends couldn't make it. Still felt like a night out with fun girls at the table.",
    initials: "NA",
    avatar: pickAvatar(9),
  },
  {
    name: "Anouk",
    detail: "Utrecht · with a friend",
    quote:
      "I thought it would be mostly about wine, and it was. Life, work, funny stories. And yes, the wine was really good.",
    initials: "A",
    avatar: pickAvatar(10),
  },
  {
    name: "Britt",
    detail: "The Hague · solo",
    quote:
      "Didn't have a full group, so I went alone. MyTable made sure I landed at a great table. Just show up and enjoy. Perfect.",
    initials: "B",
    avatar: pickAvatar(11),
  },
];

export function getGirlsOnlyTestimonials(locale: Locale): Testimonial[] {
  return locale === "nl" ? girlsOnlyNl : girlsOnlyEn;
}

export function splitGirlsOnlyTestimonialRows(items: Testimonial[]): {
  top: Testimonial[];
  bottom: Testimonial[];
} {
  const top = items.filter((_, i) => i % 2 === 0);
  const bottom = items.filter((_, i) => i % 2 === 1);
  return { top, bottom };
}
