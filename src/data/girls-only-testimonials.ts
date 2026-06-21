import type { Locale } from "@/i18n/config";
import type { Testimonial, TestimonialAvatar } from "@/data/testimonials";

const avatars: TestimonialAvatar[] = ["rose", "burgundy", "gold", "wine"];

function pickAvatar(index: number): TestimonialAvatar {
  return avatars[index % avatars.length]!;
}

/** 12 reviews: 9 western + 3 non-western female names (~25%). */
const girlsOnlyNl: Testimonial[] = [
  {
    name: "Lisa",
    detail: "Rotterdam · solo",
    quote:
      "Oké wacht… dit was echt véél leuker dan ik had verwacht. Ik stond even te twijfelen voor de deur, maar binnen tien minuten zat ik al hard te lachen.",
    initials: "L",
    avatar: pickAvatar(0),
  },
  {
    name: "Noor",
    detail: "Utrecht · solo",
    quote:
      "Join solo, leave with friends. Klopt echt. Iedereen kwam alleen en niemand keek raar op. Super open, super gezellig.",
    initials: "N",
    avatar: pickAvatar(1),
  },
  {
    name: "Emma",
    detail: "Amsterdam · net verhuisd",
    quote:
      "Net verhuisd en ken nog niemand in de stad. Na deze avond had ik meteen brunch plannen met twee girls. Precies wat ik zocht.",
    initials: "E",
    avatar: pickAvatar(2),
  },
  {
    name: "Sanne",
    detail: "Den Haag · met vriendin",
    quote:
      "Met mijn zus gegaan, maar we klikten ook met andere vrouwen aan tafel. Uitgekomen met nieuwe nummers en een groepsappje. Wat was dit leuk!",
    initials: "S",
    avatar: pickAvatar(3),
  },
  {
    name: "Meera",
    detail: "Rotterdam · solo",
    quote:
      "Ik ben introvert en vond het spannend om alleen te gaan. Maar alle girls zaten er met dezelfde reden. Geen awkwardness, alleen gezelligheid.",
    initials: "M",
    avatar: pickAvatar(4),
  },
  {
    name: "Fleur",
    detail: "Utrecht · solo",
    quote:
      "Mijn vriendinnen hebben allemaal kinderen of wonen ver weg. Hier ontmoette ik girls die ook zin hadden in een avond uit. We bleven nog hangen na afloop.",
    initials: "FL",
    avatar: pickAvatar(5),
  },
  {
    name: "Carmen",
    detail: "Maastricht · solo",
    quote:
      "Geen geforceerde introducties. Gewoon aan tafel schuiven, proeven en merken dat het gesprek vanzelf op gang komt. Heel laagdrempelig.",
    initials: "C",
    avatar: pickAvatar(6),
  },
  {
    name: "Naomi",
    detail: "Rotterdam · solo",
    quote:
      "Waarom heb ik dit niet veel eerder gedaan? Alleen binnenkomen was het enige spannende. Daarna voelde het als een avond met vriendinnen.",
    initials: "NA",
    avatar: pickAvatar(7),
  },
  {
    name: "Priya",
    detail: "Amsterdam · solo",
    quote:
      "Je hoeft echt alleen maar op te komen dagen, de rest gaat vanzelf. Met twee girls klikte het zo goed dat we direct een vervolgafspraak planden.",
    initials: "P",
    avatar: pickAvatar(8),
  },
  {
    name: "Anouk",
    detail: "Utrecht · solo",
    quote:
      "Ik dacht dat het vooral over wijn zou gaan. Het ging vooral over leven, werk en grappige verhalen. En ja, de wijn was ook echt goed.",
    initials: "A",
    avatar: pickAvatar(9),
  },
  {
    name: "Britt",
    detail: "Den Haag · solo",
    quote:
      "Girl, je bent niet de enige die solo komt. Dat voelde meteen safe. Je hoeft niet de luidste te zijn om het leuk te hebben.",
    initials: "B",
    avatar: pickAvatar(10),
  },
  {
    name: "Sophie",
    detail: "Rotterdam · solo",
    quote:
      "Ging naar huis met het gevoel dat ik eindelijk weer iets spontaans had gedaan. Met girls die ik graag nog een keer zie. Tot snel!",
    initials: "SO",
    avatar: pickAvatar(11),
  },
];

const girlsOnlyEn: Testimonial[] = [
  {
    name: "Lisa",
    detail: "Rotterdam · solo",
    quote:
      "Ok wait… this was way more fun than I expected. I hesitated at the door, but within ten minutes I was laughing hard with girls I'd never met.",
    initials: "L",
    avatar: pickAvatar(0),
  },
  {
    name: "Noor",
    detail: "Utrecht · solo",
    quote:
      "Join solo, leave with friends. So true. Everyone came alone and nobody batted an eye. Super open, super fun.",
    initials: "N",
    avatar: pickAvatar(1),
  },
  {
    name: "Emma",
    detail: "Amsterdam · new in town",
    quote:
      "Just moved and didn't know anyone in the city. After this evening I had brunch plans with two girls. Exactly what I needed.",
    initials: "E",
    avatar: pickAvatar(2),
  },
  {
    name: "Sanne",
    detail: "The Hague · with a friend",
    quote:
      "Went with my sister but clicked with other women at the table too. Left with new numbers and a group chat. So much fun!",
    initials: "S",
    avatar: pickAvatar(3),
  },
  {
    name: "Meera",
    detail: "Rotterdam · solo",
    quote:
      "I'm introverted and nervous about going alone. But every girl was there for the same reason. No awkwardness, just good vibes.",
    initials: "M",
    avatar: pickAvatar(4),
  },
  {
    name: "Fleur",
    detail: "Utrecht · solo",
    quote:
      "My friends all have kids or live far away. Here I met girls who wanted a night out too. We kept hanging around after it ended.",
    initials: "FL",
    avatar: pickAvatar(5),
  },
  {
    name: "Carmen",
    detail: "Maastricht · solo",
    quote:
      "No forced intros. Just sit down, taste, and watch the conversation flow on its own. Really low pressure.",
    initials: "C",
    avatar: pickAvatar(6),
  },
  {
    name: "Naomi",
    detail: "Rotterdam · solo",
    quote:
      "Why didn't I do this sooner? Walking in alone was the only scary part. After that it felt like a night out with friends.",
    initials: "NA",
    avatar: pickAvatar(7),
  },
  {
    name: "Priya",
    detail: "Amsterdam · solo",
    quote:
      "You really just need to show up, the rest happens on its own. I clicked with two girls and we planned a follow-up on the spot.",
    initials: "P",
    avatar: pickAvatar(8),
  },
  {
    name: "Anouk",
    detail: "Utrecht · solo",
    quote:
      "I thought it would be mostly about wine. It was mostly about life, work, and funny stories. And yes, the wine was really good.",
    initials: "A",
    avatar: pickAvatar(9),
  },
  {
    name: "Britt",
    detail: "The Hague · solo",
    quote:
      "Girl, you're not the only one coming solo. That felt safe straight away. You don't have to be the loudest to have a great time.",
    initials: "B",
    avatar: pickAvatar(10),
  },
  {
    name: "Sophie",
    detail: "Rotterdam · solo",
    quote:
      "Went home feeling like I'd finally done something spontaneous again. With girls I'd love to see again. See you soon!",
    initials: "SO",
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
