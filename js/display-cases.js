// Display cases in the store and what sits in each one, row by row,
// left to right as a customer faces the case. Items are menu-data.js ids.
window.DISPLAY_CASES = [
  {
    id: "flat",
    name: "Flat display case",
    note: "Open-top case by the World Journal newspaper rack",
    photo: "incoming/42-flat-case.webp",
    rows: [
      {
        name: "Back row",
        items: ["choco-triangle", "strawberry-angel", "cheese-cake-stick", "hazelnut-roll",
                "sesame-walnut-roll", "orange-roll", "dark-choco-roll",
                "sesame-mochi-box", "peanut-mochi-box"],
      },
      {
        name: "Front row",
        items: ["marble-cake", "swiss-choco", "watermelon-cake", "coffee-hurricane", "slice-chess",
                "choco-hurricane", "hokkaido-chiffon-2", "mini-pancake", "double-cheese",
                "strawberry-mousse", "bake-pudding", "mango-pudding", "caramel-pudding-1"],
      },
    ],
  },
  {
    id: "drink",
    name: "Drink case",
    note: "Refrigerated open case with the drinks, sauces and pickled mustard",
    photo: "incoming/43-drink-case.webp",
    rows: [
      {
        name: "Shelf",
        items: ["bottled-water", "mr-brown-blue-mtn", "apple-juice", "bottled-milk-tea",
                "green-bean-soup", "iced-rice-milk", "iced-soy-milk", "iced-jasmine",
                "egg-salad-bun", "peanut-douhua", "garlic-soy", "pickled-mustard"],
      },
    ],
  },
  {
    id: "cake",
    name: "Cake case",
    note: "Tall glass case with long cakes, slices and mochi",
    photo: "incoming/64-cake-case.webp",
    rows: [
      {
        name: "On top of the case",
        items: ["bbq-bao-1", "bamboo-bao-1"],
      },
      {
        name: "Top shelf (long cakes)",
        items: ["long-black-forest", "long-straw-chantilly", "long-cappuccino", "long-choco-passion",
                "long-choco-coffee", "long-tiramisu", "long-mango-mousse", "japanese-cheesecake",
                "long-chess", "long-marble"],
      },
      {
        name: "Second shelf (slices)",
        items: ["slice-choco-coffee", "slice-black-forest", "slice-straw-chantilly", "slice-cappuccino",
                "slice-choco-passion", "slice-mango-mousse"],
      },
      {
        name: "Third shelf",
        items: ["creme-brulee", "slice-tiramisu", "german-pudding", "slice-check-choco",
                "slice-ny-cheese", "slice-coffee", "slice-choco-cherry", "slice-vanilla-straw"],
      },
      {
        name: "Bottom shelf",
        items: ["hokkaido-chiffon-box", "cream-puff-box", "strawberry-mochi", "mango-mochi"],
      },
    ],
  },
  {
    id: "cookie",
    name: "Cookie shelves",
    note: "Two-section shelf of boxed cookies against the wall",
    photo: "incoming/329-case-cookie.webp",
    rows: [
      {
        name: "Top shelf",
        items: ["sun-cake-6", "sun-cake-1", "wife-cake-1", "wife-cake-6", "longan-honey", "honey-gift-box", "pork-floss"],
      },
      {
        name: "Middle shelf",
        items: ["sesame-crisp", "couple-cookie", "salted-yolk-cookie", "almond-brittle"],
      },
      {
        name: "Bottom shelf",
        items: ["cat-tongue", "almond-cookie", "choco-square", "walnut-square"],
      },
    ],
  },
  {
    id: "pastry",
    name: "Pastry shelf",
    note: "Small glass shelf by the window",
    photo: "incoming/330-case-pastry.webp",
    rows: [
      {
        name: "Top shelf",
        items: ["pineapple-cake-6", "pineapple-cake-1"],
      },
      {
        name: "Middle shelf",
        items: ["little-stone", "almond-puff"],
      },
      {
        name: "Bottom shelf",
        items: ["cranberry-qq-12", "cranberry-qq-1"],
      },
    ],
  },
  {
    id: "freezer",
    name: "Freezer",
    note: "\"Freezer Ready\" upright freezer (冷凍即食品)",
    photo: "incoming/331-case-freezer.webp",
    rows: [
      {
        name: "Second shelf",
        items: ["bamboo-shoot", "pickled-tuber-pork", "salted-mustard-pork"],
      },
      {
        name: "Third shelf",
        items: ["spicy-stinky-tofu", "fried-soy-sauce", "smoked-duck-box", "spicy-pig-ear"],
      },
      {
        name: "Fourth shelf",
        items: ["lotus-seed-soup", "four-spirits-soup", "pineapple-rib-soup"],
      },
      {
        name: "Bottom shelf (other two tags unreadable in the photo)",
        items: ["lamb-soup"],
      },
    ],
  },
  {
    // Items whose case/spot isn't confirmed yet. Move them into a real
    // case once there's an overview photo of where they sit.
    id: "misc",
    name: "Misc",
    note: "Items without a confirmed display spot yet",
    rows: [
      {
        name: "Not placed yet",
        items: ["plain-chiffon", "hot-dog-bun", "danish-cream-cheese", "danish-hot-dog", "pine-buttermilk", "pineapple-bun", "wave-bread", "bacon-scone", "cupcake-4", "sponge-cake", "brown-mantou-1", "wheat-mantou-1", "milk-mantou-1", "korean-mochi-11", "golden-horn-5", "red-bean-mochi", "ham-bacon-cheese", "taro-buttermilk", "bbq-pork-bun", "cheese-hot-dog", "honey-carrot-toast", "hokkaido-toast", "coffee-walnut-toast", "black-sesame-toast", "raisin-toast", "french-walnut-toast", "wheat-toast-8", "white-toast-8", "curry-beef-pie", "chicken-pie", "raisin-bun", "red-bean-bun", "custard-bun", "day-old-3", "garlic-cheese-toast", "danish-frosted", "earl-grey-croissant", "danish-ham-cheese", "danish-almond", "danish-tuna", "soft-red-bean", "euro-walnut", "sweet-sesame-cake", "peanut-bun", "parmesan", "walnut-wheat", "buttermilk-puff", "porksong-puff", "butter-coconut", "brown-sugar-walnut", "sesame-bun", "taro-bun", "porksong-bun", "cranberry-cheese", "pine-bun-coconut", "pine-bun-peanut", "8-fruit-festival", "8-black-forest", "8-strawberry-creme", "8-tiramisu", "8-coffee-fruit", "8-coffee-straw", "8-mango-mousse", "ham-cheese-sand", "tuna-sand", "fried-egg-sand", "pigs-blanket-6", "ham-cheese-ball", "strawberry-coconut", "daikon-pastry", "satay-porksong", "scallion-bun", "coffee-triangle", "8-taro-pudding", "8-vanilla-fruit", "8-choco-straw", "8-choco-coffee", "red-bean-mochi-box", "jj-special-s", "corn-porksong", "seaweed-roll", "coconut-bun", "portugal-tart-1", "matcha-croissant", "meat-lovers", "zongzi"],
      },
    ],
  },
];
