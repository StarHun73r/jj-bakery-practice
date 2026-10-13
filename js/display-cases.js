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
    // Items whose case/spot isn't confirmed yet. Move them into a real
    // case once there's an overview photo of where they sit.
    id: "misc",
    name: "Misc",
    note: "Items without a confirmed display spot yet",
    rows: [
      {
        name: "Not placed yet",
        items: ["plain-chiffon", "hot-dog-bun", "danish-cream-cheese", "danish-hot-dog", "pine-buttermilk", "pineapple-bun", "wave-bread", "bacon-scone", "cupcake-4", "sponge-cake", "brown-mantou-1", "wheat-mantou-1", "milk-mantou-1", "korean-mochi-11", "golden-horn-5", "red-bean-mochi", "ham-bacon-cheese", "taro-buttermilk", "bbq-pork-bun", "cheese-hot-dog", "honey-carrot-toast","sun-cake-6", "sesame-crisp", "couple-cookie", "almond-cookie", "cat-tongue",
                "choco-square", "walnut-square", "salted-yolk-cookie", "almond-brittle",
                "wife-cake-6", "wife-cake-1", "sun-cake-1", "pineapple-cake-6", "pineapple-cake-1", "little-stone", "almond-puff",
                "cranberry-qq-12", "cranberry-qq-1", "pork-floss", "honey-gift-box", "longan-honey"],
      },
    ],
  },
];
