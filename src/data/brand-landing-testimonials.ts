import type { Locale } from "@/i18n/config";
import type { Testimonial } from "@/data/testimonials";

/** Top marquee: culinary discoveries (taste, wine, food, places). */
const culinaryNl: Testimonial[] = [
  {
    name: "Yara",
    detail: "Rotterdam · proeverij",
    quote:
      "Chef's specials met wijn die verrassend goed op elkaar afgestemd waren. Geen keuzestress, wel gerechten waar je echt iets van proeft.",
    initials: "Y",
    avatar: "gold",
  },
  {
    name: "Joris",
    detail: "Utrecht · diner",
    quote:
      "Ging voor de wijn, bleef voor het gesprek. De chef's specials klopten. Ik vroeg nog iets vegetarisch en dat werd zonder gedoe geregeld.",
    initials: "J",
    avatar: "burgundy",
  },
  {
    name: "Anouk",
    detail: "Den Haag · proeverij",
    quote:
      "De bites bij de derde wijn waren echt een hoogtepunt, geen vulling. Pairings klopten van begin tot eind.",
    initials: "A",
    avatar: "wine",
  },
  {
    name: "Elise",
    detail: "Den Haag · restaurant",
    quote:
      "Fijn dat alles op één plek was. Een restaurant in mijn straat dat ik altijd zag maar nooit was binnengegaan, tot nu.",
    initials: "E",
    avatar: "rose",
  },
  {
    name: "Priya",
    detail: "Utrecht · groep",
    quote:
      "Vijf vriendinnen, één tafel, nul stress. De wijnen waren verrassend goed en we hoefden nergens over na te denken.",
    initials: "P",
    avatar: "gold",
  },
  {
    name: "Martijn",
    detail: "Rotterdam · met vrienden",
    quote:
      "Met drie vrienden van vroeger aan één tafel. Het voelde alsof we weer 25 waren, maar met betere wijn en gerechten van de chef.",
    initials: "M",
    avatar: "burgundy",
  },
  {
    name: "Carmen",
    detail: "Rotterdam · zondag",
    quote:
      "Ik dacht dat het misschien awkward zou worden met allemaal wijnpraat, maar het was vooral lachen. Niet te serieus, wel echt goede wijn.",
    initials: "C",
    avatar: "wine",
  },
  {
    name: "Britt",
    detail: "Utrecht · avond uit",
    quote:
      "Ik ken het restaurant niet, maar de sfeer en het tempo klopten meteen. Eén plek, één avond, geen gedoe.",
    initials: "B",
    avatar: "rose",
  },
];

/** Bottom marquee: people they met / company at the table. */
const peopleNl: Testimonial[] = [
  {
    name: "Noor",
    detail: "Utrecht · solo",
    quote:
      "Ik kwam solo en was echt nerveus. Maar aan tafel zaten groepen én anderen die alleen kwamen. Binnen tien minuten zat ik al hard te lachen.",
    initials: "N",
    avatar: "rose",
  },
  {
    name: "Sophie",
    detail: "Rotterdam · solo",
    quote:
      "Alleen komen voelde eerst spannend. Maar iedereen kwam alleen of met één vriendin. Binnen tien minuten zat ik al te kletsen.",
    initials: "S",
    avatar: "burgundy",
  },
  {
    name: "Pieter",
    detail: "Den Haag · solo",
    quote:
      "Eerste keer alleen naar zo'n middag. Ik dacht dat het awkward zou worden. Aan het einde zaten we met z'n vieren nog na te praten bij de bar.",
    initials: "P",
    avatar: "gold",
  },
  {
    name: "Naomi",
    detail: "Rotterdam · solo",
    quote:
      "Mijn vriendinnen konden niet, dus solo gegaan. En het voelde alsof ik met gezellige meiden uit eten was. Solo komen is hier echt normaal.",
    initials: "NA",
    avatar: "wine",
  },
  {
    name: "Fleur",
    detail: "Den Haag · nieuwe gezichten",
    quote:
      "Ik was sceptisch over sociale proeverijen, maar dit voelde gewoon als uit eten met onbekenden die toch een beetje voelden als vrienden.",
    initials: "F",
    avatar: "rose",
  },
  {
    name: "Isa",
    detail: "Utrecht · solo",
    quote:
      "Alleen binnengaan was het lastigste. Daarna was het alleen maar proeven, praten en mensen die ook zonder plus-one kwamen.",
    initials: "I",
    avatar: "burgundy",
  },
  {
    name: "Sanne",
    detail: "Den Haag · groep van 4",
    quote:
      "Met z'n vieren zelf geboekt. Binnen een kwartier zaten we al te lachen alsof we al jaren samen uit eten.",
    initials: "SA",
    avatar: "gold",
  },
  {
    name: "Mark",
    detail: "Rotterdam · gemengd",
    quote:
      "Ontspannen vanaf het eerste glas. Geen gedwongen introducties, wel mensen die ook gewoon zin hadden in een middag uit.",
    initials: "M",
    avatar: "wine",
  },
];

const culinaryEn: Testimonial[] = [
  {
    name: "Yara",
    detail: "Rotterdam · tasting",
    quote:
      "Chef's specials with wine that was surprisingly well paired. No decision fatigue, just dishes you actually taste.",
    initials: "Y",
    avatar: "gold",
  },
  {
    name: "Joris",
    detail: "Utrecht · dinner",
    quote:
      "Came for the wine, stayed for the conversation. The chef's specials landed. I asked for something vegetarian and it was handled without fuss.",
    initials: "J",
    avatar: "burgundy",
  },
  {
    name: "Anouk",
    detail: "The Hague · tasting",
    quote:
      "The bites with the third wine were a real highlight, not filler. Pairings worked from start to finish.",
    initials: "A",
    avatar: "wine",
  },
  {
    name: "Elise",
    detail: "The Hague · restaurant",
    quote:
      "Nice that everything was in one place. A restaurant on my street I'd always walked past and never entered, until now.",
    initials: "E",
    avatar: "rose",
  },
  {
    name: "Priya",
    detail: "Utrecht · group",
    quote:
      "Five friends, one table, zero stress. The wines were surprisingly good and we didn't have to think about a thing.",
    initials: "P",
    avatar: "gold",
  },
  {
    name: "Martijn",
    detail: "Rotterdam · with friends",
    quote:
      "Three old friends at one table. Felt like we were 25 again, but with better wine and chef dishes.",
    initials: "M",
    avatar: "burgundy",
  },
  {
    name: "Carmen",
    detail: "Rotterdam · Sunday",
    quote:
      "I thought it might get awkward with all the wine talk. Mostly laughing. Not too serious, genuinely good wine.",
    initials: "C",
    avatar: "wine",
  },
  {
    name: "Britt",
    detail: "Utrecht · night out",
    quote:
      "I didn't know the restaurant, but the vibe and pace clicked immediately. One place, one evening, no fuss.",
    initials: "B",
    avatar: "rose",
  },
];

const peopleEn: Testimonial[] = [
  {
    name: "Noor",
    detail: "Utrecht · solo",
    quote:
      "I came solo and was genuinely nervous. There were groups and others who came alone too. Within ten minutes I was laughing hard.",
    initials: "N",
    avatar: "rose",
  },
  {
    name: "Sophie",
    detail: "Rotterdam · solo",
    quote:
      "Showing up alone felt a bit scary at first. Everyone came alone or with one friend. Within ten minutes I was chatting away.",
    initials: "S",
    avatar: "burgundy",
  },
  {
    name: "Pieter",
    detail: "The Hague · solo",
    quote:
      "First time going alone to something like this. Thought it would be awkward. By the end four of us were still talking at the bar.",
    initials: "P",
    avatar: "gold",
  },
  {
    name: "Naomi",
    detail: "Rotterdam · solo",
    quote:
      "My friends couldn't make it, so I went solo. It felt like dinner with lovely girls. Coming alone is totally normal here.",
    initials: "NA",
    avatar: "wine",
  },
  {
    name: "Fleur",
    detail: "The Hague · new faces",
    quote:
      "I was sceptical about social tastings, but it just felt like dinner with strangers who somehow felt a bit like friends.",
    initials: "F",
    avatar: "rose",
  },
  {
    name: "Isa",
    detail: "Utrecht · solo",
    quote:
      "Walking in alone was the hardest part. After that it was tasting, talking, and people who also came without a plus-one.",
    initials: "I",
    avatar: "burgundy",
  },
  {
    name: "Sanne",
    detail: "The Hague · group of 4",
    quote:
      "We booked as four. Within fifteen minutes we were laughing like we'd been going out together for years.",
    initials: "SA",
    avatar: "gold",
  },
  {
    name: "Mark",
    detail: "Rotterdam · mixed",
    quote:
      "Relaxed from the first glass. No forced introductions, just people who also wanted a good afternoon out.",
    initials: "M",
    avatar: "wine",
  },
];

export function getBrandLandingTestimonialRows(locale: Locale): {
  culinary: Testimonial[];
  people: Testimonial[];
} {
  if (locale === "en") {
    return { culinary: culinaryEn, people: peopleEn };
  }
  return { culinary: culinaryNl, people: peopleNl };
}
