/** Stable Unsplash URLs (verified reachable) — food/wine close-ups are location-neutral. */
export const images = {
  wineGlasses:
    "https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=800&q=80",
  heroMain:
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900&q=80",
  longTable:
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
  restaurantDining:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
  cityWalk:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
  cheers:
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
  brunch:
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80",
  mysteryDinner:
    "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80",
  wineBar:
    "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=80",
  restaurantInterior:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
} as const;

/**
 * Blog heroes: only wine, food pairing, or Dutch restaurant scenes.
 * No canals, meadows, spa, or whiskey barrels.
 */
export const blogImages = {
  wineTasting:
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=80",
  winePour:
    "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&q=80",
  friendsTable: images.wineGlasses,
  friendsOutdoor: "/blog/amsterdam-restaurant.jpg",
  dinnerTable: images.restaurantDining,
  wineBar: images.wineBar,
  cityCanal:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
  cityStreet: "/blog/amsterdam-restaurant.jpg",
  cafeCoffee: "/blog/amsterdam-restaurant.jpg",
  soloCoffee:
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80",
  brunch: images.brunch,
  restaurant: "/blog/amsterdam-restaurant.jpg",
  socialIdeas: images.longTable,
  clayWorkshop:
    "https://images.unsplash.com/photo-1493106819501-66d381c466f1?w=1200&q=80",
  spaCalm:
    "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=1200&q=80",
  outdoorWalk:
    "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=1200&q=80",
  wineCellar:
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=80",
  amsterdamSunset:
    "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200&q=80",
  foodPairing:
    "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=1200&q=80",
  wineFlight:
    "https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=1200&q=80",
} as const;
