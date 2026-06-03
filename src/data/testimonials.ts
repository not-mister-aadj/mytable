import type { Locale } from "@/i18n/config";

export type TestimonialAvatar = "burgundy" | "gold" | "rose" | "wine";

export interface Testimonial {
  name: string;
  detail: string;
  quote: string;
  initials: string;
  avatar: TestimonialAvatar;
}

const testimonialsNl: Testimonial[] = [
  {
    name: "Sophie",
    detail: "Rotterdam · solo",
    quote:
      "Ik kwam alleen en durfde dat eerst even niet. Binnen tien minuten zat ik midden in een gesprek over wijn en bites alsof ik al jaren mee at.",
    initials: "S",
    avatar: "burgundy",
  },
  {
    name: "Mark",
    detail: "Amsterdam · gemengd",
    quote:
      "Ontspannen vanaf het eerste glas. Geen gedwongen introducties, wel echt lekker eten en mensen die ook gewoon zin hadden in een avond uit.",
    initials: "M",
    avatar: "gold",
  },
  {
    name: "Elise",
    detail: "Den Haag",
    quote:
      "Fijn dat alles op één plek was. Een restaurant in mijn straat dat ik altijd zag maar nooit was binnengegaan — tot nu.",
    initials: "E",
    avatar: "rose",
  },
  {
    name: "Sanne",
    detail: "Utrecht · girls only",
    quote:
      "Met mijn zus naar de girls only-tafel. Ruim twee uur proeven en praten, op ons tempo. We gingen pas weg toen we er klaar mee waren.",
    initials: "S",
    avatar: "wine",
  },
  {
    name: "Thomas",
    detail: "Rotterdam · date",
    quote:
      "Perfect voor een eerste date. We zaten er ruim twee uur, op ons tempo, en het voelde niet te formeel. Praten en even stil zijn ging allebei zonder awkwardness.",
    initials: "T",
    avatar: "burgundy",
  },
  {
    name: "Lisa & Noor",
    detail: "Amsterdam · met vriendinnen",
    quote:
      "Met z'n vieren geboekt aan een gemengde tafel. MyTable regelde de plek, wij hoefden alleen te komen. Voelde alsof iemand anders het feestje had georganiseerd.",
    initials: "LN",
    avatar: "gold",
  },
  {
    name: "Pieter",
    detail: "Groningen · solo",
    quote:
      "Eerste keer alleen naar zo'n avond. Host legde rustig uit wat de chef voor ons had bedacht. Aan het einde zaten we met z'n vieren nog na te praten bij de bar.",
    initials: "P",
    avatar: "rose",
  },
  {
    name: "Carmen",
    detail: "Maastricht · girls only",
    quote:
      "De girls only-proeverij was precies goed: één restaurant, lekker proeven, veel gelach. Niet te veel wijnpraat, wel mensen die ook nieuwsgierig waren.",
    initials: "C",
    avatar: "wine",
  },
  {
    name: "Joris",
    detail: "Utrecht · gemengd",
    quote:
      "Ging voor de wijn, bleef voor het gesprek. De chef's specials klopten. Ik vroeg nog iets vegetarisch en dat werd zonder gedoe geregeld.",
    initials: "J",
    avatar: "burgundy",
  },
  {
    name: "Naomi",
    detail: "Rotterdam · girls only",
    quote:
      "Girls only-avond was verrassend gezellig. Kleine tafel, veel gelach, en wijn die echt goed was. Ik kom terug met vriendinnen.",
    initials: "N",
    avatar: "gold",
  },
  {
    name: "Fam. De Vries",
    detail: "Den Haag · groep",
    quote:
      "Met z'n vijven geboekt voor een verjaardag. Alles liep op tijd, bediening wist wat we kwamen doen. Geen stress over de rekening aan het eind.",
    initials: "DV",
    avatar: "rose",
  },
  {
    name: "Anouk",
    detail: "Amsterdam",
    quote:
      "Proeverij was klein genoeg om iedereen te leren kennen. De bites bij de derde wijn waren echt een hoogtepunt, geen vulling.",
    initials: "A",
    avatar: "wine",
  },
  {
    name: "Mehmet & Sara",
    detail: "Rotterdam · date",
    quote:
      "We wilden iets anders dan Netflix. Makkelijk tweeënhalve uur, eigen tempo, en we gingen pas weg toen we er klaar mee waren. Zeker iets voor stellen.",
    initials: "MS",
    avatar: "burgundy",
  },
  {
    name: "Fleur",
    detail: "Leiden",
    quote:
      "Ik was sceptisch over 'sociale' proeverijen maar dit voelde gewoon als uit eten met onbekenden die toch een beetje voelden als vrienden.",
    initials: "F",
    avatar: "gold",
  },
  {
    name: "Robert",
    detail: "Amsterdam · gemengd",
    quote:
      "Gemengde tafel was precies wat ik zocht: goede wijn, chef's specials en mensen die ook zin hadden in een avond zonder gedoe.",
    initials: "R",
    avatar: "rose",
  },
  {
    name: "Isa",
    detail: "Utrecht · solo",
    quote:
      "Alleen binnengaan was het lastigste. Daarna was het alleen maar proeven, praten en mensen die ook zonder plus-one kwamen.",
    initials: "I",
    avatar: "wine",
  },
  {
    name: "Martijn",
    detail: "Rotterdam",
    quote:
      "Met drie vrienden van vroeger aan één tafel. Het voelde alsof we weer 25 waren, maar met betere wijn en gerechten van de chef.",
    initials: "M",
    avatar: "burgundy",
  },
  {
    name: "Yara",
    detail: "Amsterdam",
    quote:
      "Chef's specials met wijn die verrassend goed op elkaar afgestemd waren. Geen keuzestress, wel gerechten waar je echt iets van proeft.",
    initials: "Y",
    avatar: "gold",
  },
  {
    name: "Coen",
    detail: "Den Haag",
    quote:
      "Rustige avond, precies de juiste hoeveelheid mensen. Niet te luid, niet te stil. Mijn vrouw wil volgende maand weer.",
    initials: "C",
    avatar: "rose",
  },
  {
    name: "Britt",
    detail: "Maastricht",
    quote:
      "Ik ken het restaurant niet, maar de sfeer en het tempo klopten meteen. Eén plek, één avond, geen gedoe.",
    initials: "B",
    avatar: "wine",
  },
];

const testimonialsEn: Testimonial[] = [
  {
    name: "Sophie",
    detail: "Rotterdam · solo",
    quote:
      "I came alone and was nervous at first. Within ten minutes I was in the middle of a conversation about wine and bites like I had been there for years.",
    initials: "S",
    avatar: "burgundy",
  },
  {
    name: "Mark",
    detail: "Amsterdam · mixed",
    quote:
      "Relaxed from the first glass. No forced intros, just genuinely good food and people who wanted a proper night out.",
    initials: "M",
    avatar: "gold",
  },
  {
    name: "Elise",
    detail: "The Hague",
    quote:
      "Nice that everything was in one place. A restaurant on my street I'd always noticed but never gone into — until now.",
    initials: "E",
    avatar: "rose",
  },
  {
    name: "Sanne",
    detail: "Utrecht · girls only",
    quote:
      "Went with my sister to the girls-only table. Well over two hours of tasting and talking at our pace. We left when we were ready.",
    initials: "S",
    avatar: "wine",
  },
  {
    name: "Thomas",
    detail: "Rotterdam · date",
    quote:
      "Great for a first date. We were there for well over two hours at our own pace, and it never felt stiff. Talking and sitting in silence both worked without awkwardness.",
    initials: "T",
    avatar: "burgundy",
  },
  {
    name: "Lisa & Noor",
    detail: "Amsterdam · with friends",
    quote:
      "Booked for four at a mixed table. MyTable handled the venue, we just showed up. Felt like someone else had organised the party.",
    initials: "LN",
    avatar: "gold",
  },
  {
    name: "Pieter",
    detail: "Groningen · solo",
    quote:
      "First time going alone to something like this. The host calmly explained what the chef had planned for us. By the end four of us were still chatting at the bar.",
    initials: "P",
    avatar: "rose",
  },
  {
    name: "Carmen",
    detail: "Maastricht · girls only",
    quote:
      "The girls-only tasting was just right: one restaurant, great pours, lots of laughter. Not too much wine talk, just curious people.",
    initials: "C",
    avatar: "wine",
  },
  {
    name: "Joris",
    detail: "Utrecht · mixed",
    quote:
      "Went for the wine, stayed for the conversation. The chef's specials worked. I asked for a vegetarian tweak and they handled it easily.",
    initials: "J",
    avatar: "burgundy",
  },
  {
    name: "Naomi",
    detail: "Rotterdam · girls only",
    quote:
      "The girls-only evening was surprisingly social. Small table, lots of laughter, and wine that was actually good. Coming back with friends.",
    initials: "N",
    avatar: "gold",
  },
  {
    name: "The De Vries family",
    detail: "The Hague · group",
    quote:
      "Booked for five of us for a birthday. Everything ran on time and staff knew why we were there. No stress about the bill at the end.",
    initials: "DV",
    avatar: "rose",
  },
  {
    name: "Anouk",
    detail: "Amsterdam",
    quote:
      "The tasting was small enough to meet everyone. The bites with the third wine were a real highlight, not just filler.",
    initials: "A",
    avatar: "wine",
  },
  {
    name: "Mehmet & Sara",
    detail: "Rotterdam · date",
    quote:
      "We wanted something other than Netflix. Easily two and a half hours at our own pace, and we only left when we were ready. Great for couples.",
    initials: "MS",
    avatar: "burgundy",
  },
  {
    name: "Fleur",
    detail: "Leiden",
    quote:
      "I was sceptical about social tastings but this just felt like eating out with strangers who kind of felt like friends.",
    initials: "F",
    avatar: "gold",
  },
  {
    name: "Robert",
    detail: "Amsterdam · mixed",
    quote:
      "The mixed table was exactly what I wanted: good wine, chef's specials, and people who wanted an easy evening out.",
    initials: "R",
    avatar: "rose",
  },
  {
    name: "Isa",
    detail: "Utrecht · solo",
    quote:
      "Going in alone was the hardest part. After that it was just tasting, talking, and people who also came without a plus-one.",
    initials: "I",
    avatar: "wine",
  },
  {
    name: "Martijn",
    detail: "Rotterdam",
    quote:
      "With three old friends at one table. It felt like we were 25 again, but with better wine and dishes from the chef.",
    initials: "M",
    avatar: "burgundy",
  },
  {
    name: "Yara",
    detail: "Amsterdam",
    quote:
      "Chef's specials with wine that were surprisingly well matched. No decision fatigue, just dishes you could actually taste.",
    initials: "Y",
    avatar: "gold",
  },
  {
    name: "Coen",
    detail: "The Hague",
    quote:
      "A calm evening, exactly the right number of people. Not too loud, not too quiet. My wife wants to go again next month.",
    initials: "C",
    avatar: "rose",
  },
  {
    name: "Britt",
    detail: "Maastricht",
    quote:
      "I didn't know the restaurant, but the vibe and pace clicked right away. One place, one evening, no hassle.",
    initials: "B",
    avatar: "wine",
  },
];

export function getTestimonials(locale: Locale): Testimonial[] {
  return locale === "nl" ? testimonialsNl : testimonialsEn;
}

export function splitTestimonialRows(items: Testimonial[]): {
  top: Testimonial[];
  bottom: Testimonial[];
} {
  const top = items.filter((_, i) => i % 2 === 0);
  const bottom = items.filter((_, i) => i % 2 === 1);
  return { top, bottom };
}
