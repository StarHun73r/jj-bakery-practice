// =====================================================================
//  JJ Bakery menu  —  copied from the register screenshots
// =====================================================================
//  The register is a tree of folders. F(...) is a folder button,
//  I(...) is an item button you add to the order.
//
//    F(buttonText, color, [children])     color is optional (inherits)
//    I(id, buttonText, price, options)
//
//  Button text is copied exactly as it shows on the register, including
//  the "..." where a name is cut off. Don't fill in missing words.
//
//  The register shows buttons in pages of 5 columns x 6 rows (30 per
//  page), filled row by row. Folders with more than 30 items get a
//  second page you swipe to. List items in that same order.
//
//  Photos: put a file named <id>.jpg (or .png / .webp / .jpeg) in the
//  /images folder, e.g. images/iced-soy-milk.jpg
//
//  Prices: unknown so far (0). Fill them in when you know them.
//  options: { practice: false } keeps an item out of practice orders.
// =====================================================================

window.MENU_CONFIG = {
  storeName: "JJ Bakery",
  taxRate: 0,
  staffName: "Morning S.",
  orderType: "Take Out",
  cardTypes: ["Visa", "Mastercard", "Discover", "Amex"],   // 3rd one is a guess
};

var BLUE = "#1d9bd7", ORANGE = "#f57b26", RED = "#e8394f", INDIGO = "#3c55b9", YELLOW = "#f6b40e", PURPLE = "#9b6fd4";

// Submenu option groups (size, sugar, ...) — none seen yet.
window.MODIFIER_GROUPS = {};

window.MENU_TREE = [
  F("麵包Bread", BLUE, [
    F("麵包Bread", [
      // page 1
      I("pineapple-bun",       "菠蘿麵包 Pineapple Bun", 1.90),
      I("garlic-stick",        "香蒜條 Garlic stic", 0),             // end hidden by glare in the photo
      I("corn-bun",            "玉米麵包 Corn Bun", 0),
      I("custard-bun",         "克林姆麵包Custard Bun", 2.00),
      I("pine-bun-coconut",    "椰子菠蘿 Pine. Bun w/Cocon...", 0),
      I("pine-bun-peanut",     "花生菠蘿 Pine. Bun w/Peanut", 0),
      I("peanut-bun",          "花生麵包 Peanut Bun", 0),
      I("sesame-bun",          "芝麻麵包 Sesame Bun", 0),
      I("garlic-cheese-toast", "香蒜起士吐司 Garlic C...", 2.05),
      I("red-bean-bun",        "紅豆麵包 Red Bean Bun", 2.05),
      I("coconut-bun",         "椰子麵包 Coconut Bun", 0),
      I("taro-bun",            "芋頭麵包 Taro Bun", 0),
      I("butter-coconut",      "奶油椰子 Coconut Bun w/S...", 0),
      I("french-garlic",       "法國大蒜 French Garlic Br...", 0),
      I("cheese-toast",        "起司吐司片Baked Cheese...", 0),
      I("red-bean-mochi",      "紅豆麻糬包 RedBea...", 2.15),
      I("corn-porksong",       "玉米肉鬆 Corn B. w/ PorkSong", 0),
      I("soft-red-bean",       "超綿紅豆 Soft Red Bean Bun", 2.20),
      I("ham-cheese-ball",     "火腿球 (x2)Ham & Chees...", 0),
      I("taro-buttermilk",     "芋泥奶酥 Taro w/ ButterMi...", 2.20),
      I("raisin-bun",          "葡萄乾毛毛蟲Raisin Bun", 2.30),
      I("porksong-bun",        "肉鬆麵包 PorkSong Bun", 0),
      I("pine-buttermilk",     "菠蘿奶酥 Pineapple w/Butter...", 2.30),
      I("bbq-pork-bun",        "叉燒麵包 BBQ Pork Bun", 2.30),
      I("meat-lovers",         "多色麵包 Meat Lover's...", 0),
      I("ham-bacon-cheese",    "培根辮子 Ham&Bacon Chee...", 2.30),
      I("cheese-cake-bread",   "奧莉維 Cheese Cake Br...", 0),
      I("porksong-puff",       "起酥肉鬆 Porksong Bun w/P...", 0),
      I("buttermilk-puff",     "起酥奶酥 Buttermilk B.w/Puff...", 0),
      I("hot-dog-bun",         "熱狗麵包 Hot Dog Bun", 2.55),
      // page 2 (swipe left)
      I("satay-porksong",      "沙茶肉鬆 Satay PorkSon...", 0),
      I("curry-beef-pie",      "咖哩牛派Curry Beef Pie", 2.55),
      I("chicken-pie",         "雞肉派 Chicken Pie", 2.55),
      I("jj-special-s",        "羅宋麵包 (S)J.J. Special...", 0),
      I("parmesan",            "帕瑪森起士 Parmesa...", 0),
      I("scallion-hot-dog",    "蔥花熱狗 Hot Dog B. w/ Sc...", 0),
      I("cheese-hot-dog",      "起司熱狗 Cheese Hot Dog", 2.65),
      I("walnut-wheat",        "德式核果 Wheat B. w/Walnut", 0),
      I("brown-sugar-walnut",  "紅糖核桃 Brown Sugar Br...", 0),
      I("scallion-bun",        "蔥花麵包 Scallion Bun", 0),
      I("seaweed-roll",        "海苔卷 Seaweed Roll", 0),
      I("cranberry-cheese",    "蔓越莓乳酪 Cranberr...", 0),
      I("euro-walnut",         "北歐堅果 Euro Walnut", 0),
      I("butter-rolls-5",      "奶油小餐包 (x5)Butt...", 0),
      I("wave-bread",          "波浪麵包 Wave Bread", 4.05),
      I("golden-horn-5",       "金牛角 (x5)Golden Horn R...", 5.85),
      I("qq-mochi-4",          "QQ糬菓 (x4) Mochi S...", 0, { color: YELLOW }),
      I("day-old-3",           "隔夜麵包 (x3)Day old com...", 4.10),
      I("garlic-rolls-5",      "大蒜小餐包 (x5)Garli...", 0),
      I("korean-mochi-11",     "韓式烤麻糬 (x11) Korean S...", 8.95),
      I("sea-salt-4",          "海鹽麵包 (x4)Sea Salt Butt...", 0),
      I("egg-salad-bun",       "蛋沙拉麵包 Egg Salad Bun", 0),
      I("strawberry-coconut",  "草莓椰香 Strawberry Coconut", 0),
      I("pigs-blanket-6",      "酥皮熱狗 (x6) Pigs in a Blan...", 0),
      I("bacon-scone",         "培根香蔥司康 Bacon S...", 4.99),
    ]),
    F("丹麥Danish", [
      I("danish-cream-cheese", "丹麥乳酪 Cream Cheese...", 2.75, { color: YELLOW }),
      I("danish-almond",       "丹麥杏 Almond Danish", 2.80),        // a character is hidden by glare in the photo
      I("danish-raisin",       "丹麥葡萄乾Raisin Danish", 0, { color: PURPLE }),
      I("danish-tuna",         "丹麥鮪魚 Tuna Danish", 2.95),
      I("danish-frosted",      "糖霜丹麥杏仁 Frosted...", 3.00),
      I("matcha-croissant",    "抹茶杏仁可頌 Matcha...", 0),
      I("earl-grey-croissant", "伯爵紅茶可頌Earl Grey Cro...", 3.00),
      I("danish-ham-cheese",   "丹麥火腿起司Ham & Chees...", 3.00),
      I("danish-hot-dog",      "丹麥熱狗 Hot Dog Danish", 3.30),
      I("med-croissant",       "中牛角 Med. Croissan...", 0),
      I("choc-strawberry",     "巧克力草莓丹麥 Chocola...", 0),
    ]),
    F("吐司Toast", [
      I("white-toast-4",       "白吐司4片White Toast 4p...", 0, { color: PURPLE }),
      I("white-toast-6",       "白吐司6片White Toast 6p...", 0),
      I("white-toast-8",       "白吐司8片White Toast 8p...", 3.55),
      I("wheat-toast-6",       "全麥吐司6片Whole Wheat T...", 0),
      I("wheat-toast-8",       "全麥吐司8片Whole Wheat T...", 3.85),
      I("hokkaido-toast",      "北海道吐司 Hokkaid...", 4.35),
      I("raisin-toast",        "葡萄乾吐司Raisin Toast", 4.60),
      I("honey-carrot-toast",  "蜂蜜紅蘿蔔吐司 Honey C...", 4.60),
      I("coffee-walnut-toast", "咖啡核桃吐司 Coffee...", 5.05),
      I("french-walnut-toast", "法式核桃吐司 French...", 4.60),
      I("black-sesame-toast",  "黑芝麻核桃吐司 Black Se...", 5.05),
      I("red-bean-toast",      "紅豆吐司 Red Bean Toast", 0),
      I("matcha-mini-toast",   "抹茶奶酥小吐司 Matcha...", 0),
      I("coconut-toast",       "椰子吐司 Coconut Toast", 0),
      I("scallion-mini-toast", "蔥花肉鬆小吐司 Scallion...", 0),
    ]),
    F("蒸Steam", [
      I("milk-mantou-1",       "鮮奶 (x1)Milk Steam B...", 1.55),      // characters after 鮮奶 hidden by glare
      I("wheat-mantou-1",      "全麥饅頭 (x1)Whole Wheat st...", 1.65),
      I("brown-mantou-1",      "紅糖饅頭 (x1)Brown Sugar St...", 1.60),
      I("bbq-bao-1",           "叉燒包子 BBQ Steam B...", 2.55),
      I("bamboo-bao-1",        "香筍肉包 Bamboo Pork Ste...", 2.55),
      I("veg-pork-bao-1",      "菜肉包 Veg. w/ Pork Ste...", 0),
      I("veg-bao-1",           "素菜包 Veg. Steam B...", 0),
      I("peach-red-bean",      "壽桃豆沙 (x1)Steam Bun with...", 0),
      I("peach-jujube",        "壽桃棗泥 (x1)Steam Bun with...", 0),
      I("peach-lotus",         "壽桃蓮蓉 (x1)Steam Bun with...", 0),
      I("peach-taro",          "壽桃芋頭 (x1)Steam Bun with...", 0),
      I("bbq-bao-2",           "叉燒包子 (x2)BBQ Steam B...", 0),
      I("bamboo-bao-2",        "香筍肉包 (x2)Bamboo Pork...", 0),
      I("veg-pork-bao-2",      "菜肉包 (x2)Veg. w/Pork S...", 0),
      I("veg-bao-2",           "素菜包 (x2)Veg. Steam B...", 0),
      I("milk-mantou-3",       "鮮奶饅頭 (x3)Milk Steam B...", 0),
      I("wheat-mantou-3",      "全麥饅頭 (x3)Whole Wheat S...", 0),
      I("brown-mantou-3",      "紅糖饅頭 (x3)Brown Sugar St...", 0),
    ]),
    F("三明治Sandwich", [
      I("egg-cheese-sand",     "起司蛋三明治Egg & Chees", 0),       // end hidden by glare
      I("ham-cheese-sand",     "火腿起司三明治 Ham & C...", 0),
      I("egg-salad-sand",      "蛋沙拉三明治Egg Salad Sa...", 0),
      I("ham-egg-sand",        "火腿蛋三明治Ham & Egg S...", 0),
      I("fried-egg-sand",      "荷包蛋三明治Pan Fried Eg...", 0),
      I("tuna-sand",           "鮪魚三明治Tuna Sandwich", 0),
      I("pork-sand",           "台式豬肉三明治 Signatur...", 0),
      I("strawberry-floss-sand", "草莓肉鬆蛋三明治 Pork Flo...", 0),
    ]),
  ]),
  F("餅乾&甜點Cookie&Sweet", BLUE, [
    F("餅乾Cookie", [
      // row 1
      I("cranberry-qq-1",      "蔓越莓雪花QQ餅(x1) Cra...", 1.25),
      I("cranberry-qq-12",     "蔓越莓雪花QQ餅(x12) Cr...", 13.50),
      I("pineapple-cake-1",    "鳳梨酥(x1)Pineapple Pas...", 2.05),
      I("portugal-tart-1",     "葡式蛋塔(x1)Portugal Egg Tart", 0),
      I("taiwan-tart-1",       "台式蛋塔(x1)Taiwanese Eg...", 0),
      // row 2
      I("sun-cake-1",          "太陽餅(x1)Maltose Pastry", 2.55),
      I("wife-cake-1",         "老婆餅(x1)Wife Pastry", 2.55),
      I("almond-puff",         "大起酥杏仁片 lmond...", 2.80),          // first letter hidden by glare
      I("daikon-pastry",       "蘿蔔絲餅 Daikon Pastry", 0),
      I("little-stone",        "小石頭 Little Stone", 5.60),
      // row 3
      I("milky-stick",         "特製牛奶棒Special Milky Sti...", 0),
      I("red-bean-pastry-4",   "豆沙酥餅(x4)Red Bean Pa...", 0),
      I("sesame-crisp",        "芝麻脆餅 Black Sesame...", 5.60),
      I("cat-tongue",          "貓舌頭 Vanilla Petal Co...", 5.60),
      I("almond-cookie",       "杏仁小圓餅Almond Cookie", 5.60, { color: PURPLE }),
      // row 4
      I("choco-square",        "巧克力方塊酥 Choco....", 5.60),
      I("walnut-square",       "核桃方塊酥Walnut Square...", 5.60),
      I("matcha-square",       "抹茶方塊酥Green Tea Coo...", 0),
      I("couple-cookie",       "倆相好 Couple Cookie", 5.60),
      I("almond-brittle",      "杏仁瓦片 Almond Brittle", 6.10),
      // row 5
      I("pineapple-cake-6",    "鳳梨酥(x6)Pineapple Pas...", 12.25),
      I("taiwan-tart-6",       "台式蛋塔(x6)Taiwanese Eg...", 0),
      I("portugal-tart-6",     "葡式蛋塔(x6)Portugal Egg...", 0, { color: YELLOW }),
      I("sun-cake-6",          "太陽餅(x6)Maltose Pastry", 15.30),
      I("wife-cake-6",         "老婆餅(x6)Wife Pastry", 15.30),
      // row 6
      I("salted-yolk-cookie",  "鹹蛋黃餅乾 Salted Egg Yolk...", 5.60),
      I("sweet-sesame-cake",   "甜燒餅 Sweet Sesame...", 0),
      I("free-taiwan-tart-1",  "FREE 台式蛋塔(x1)Taiw...", 0),
      I("free-taiwan-tart-3",  "FREE 台式蛋塔(x3)Taiw...", 0),
    ]),
    F("甜點Sweet", [
      // page 1
      I("hokkaido-chiffon-1",  "北海道戚風蛋糕(x1)Hokk...", 0),
      I("cream-puff-1",        "泡芙(x1)Cream Puff", 0),
      I("hokkaido-chiffon-2",  "北海道戚風蛋糕(x2)Hok...", 4.00),
      I("coffee-triangle",     "咖啡三角蛋糕 Triangle...", 0),
      I("choco-triangle",      "巧克力三角蛋糕 Triangle...", 2.15),
      I("vanilla-triangle",    "香草三角蛋糕 Triangle...", 0),
      I("sponge-cake",         "海棉蛋糕 Sponge Cake", 2.55),
      I("choco-hurricane",     "巧克力旋風卷 Hurrican...", 3.00),
      I("coffee-hurricane",    "咖啡旋風卷 Hurrican...", 3.05),
      I("bake-pudding",        "烤布丁 Bake Pudding", 3.05),
      I("cheese-cake-stick",   "高鈣起司條Cheese Cake Sti...", 3.15),
      I("double-cheese",       "双重乳酪 Double Cheese...", 3.30),     // 酪 confirmed by user (was hidden by glare)
      I("strawberry-creme",    "草莓奶酪 Strawberry Creme...", 0),
      I("swiss-choco",         "瑞士巧克力Swiss Chocola...", 3.30),
      I("strawberry-angel",    "草莓繽紛Strawberry Angel...", 3.30),
      I("mango-pudding",       "芒果布丁 Mango Pudding", 3.30),
      I("creme-brulee",        "奶酪 Creme Brulee", 3.30),
      I("caramel-pudding-1",   "滑溜布丁(x1)Caramel Puddi...", 3.30),
      I("marble-cake",         "虎皮大理石Marble Cake", 3.55),
      I("watermelon-cake",     "西瓜蛋糕 Watermelon Shap...", 3.55),
      I("cupcake-4",           "杯子蛋糕(x4)Simple Cupca...", 3.55),
      I("german-pudding",      "德國布丁 German Pudding", 3.85),
      I("mini-pancake",        "卡士達小元寶Mini Pancake...", 4.60),
      I("orange-roll",         "橘子戚風蛋糕卷 Orange...", 4.60, { color: PURPLE }),
      I("mango-mochi",         "芒果雪媚娘Mochi (Mango)", 4.60),
      I("strawberry-mochi",    "草莓雪媚娘Mochi (Strawb...", 4.60),
      I("sesame-walnut-roll",  "芝麻核桃蛋糕卷 Black Se...", 4.85, { color: YELLOW }),
      I("taro-pork-floss",     "芋鬆香 Taro Pork Floss", 0),
      I("peanut-mochi-box",    "花生麻糬 (Box)Peanut Mochi", 4.95),
      I("sesame-mochi-box",    "芝麻麻糬 (Box)Sesame Mochi", 4.95),
      // page 2 (swipe left)
      I("red-bean-mochi-box",  "紅豆麻糬 (Box)Red Bean Mo...", 4.95),
      I("plain-chiffon",       "香枕蛋糕 Plain Chiffon...", 5.05),
      I("dark-choco-roll",     "巧克力生乳卷 Dark Chocola...", 4.99, { color: PURPLE }),
      I("hokkaido-chiffon-box","北海道戚風蛋糕 (Box)Ho...", 11.75),
      I("cream-puff-box",      "泡芙 (Box)Cream Puff", 11.75),
      I("hazelnut-roll",       "榛果巧克力卷 Hazelnut...", 3.00),
      I("pork-sung-chiffon",   "肉鬆貝貝 Pork Sung Chiffon...", 6.90),
      I("japanese-cheesecake", "日式輕乳酪蛋糕 Japanes...", 0, { color: PURPLE }),
      I("strawberry-mousse",   "草莓慕斯 Strawberry Mousse", 3.50),
    ]),
  ]),
  F("蛋糕&慕斯Cake&Mousse", BLUE, [
    F("切片Slice", [
      I("slice-chess",         "Slice棋盤蛋糕 Chess C...", 3.55),
      I("slice-coffee",        "Slice咖啡蛋糕 Coffee C...", 3.30),
      I("slice-check-choco",   "Slice格子巧克力 Chocola...", 3.30),
      I("slice-choco-cherry",  "Slice巧克力櫻桃 Choco....", 3.30),
      I("slice-vanilla-straw", "Slice香草戚風夾草莓Vanilla...", 3.55),
      I("slice-choco-straw",   "Slice巧克力戚風夾草莓Cho...", 0),
      I("slice-coffee-straw",  "Slice咖啡戚風夾草莓Coffee...", 0),
      I("slice-taro",          "Slice芋頭蛋糕 Vanilla C...", 0),
      I("slice-ny-cheese",     "Slice紐約起司蛋糕 N.Y. Che...", 3.75),
      I("slice-black-forest",  "Slice黑琳 Chocolate Chocolate", 4.35),
      I("slice-tiramisu",      "Slice提拉米蘇 (法式)Tiram...", 4.35),
      I("slice-choco-coffee",  "Slice可可咖啡慕斯 Choco C...", 4.35),
      I("slice-mango-mousse",  "Slice芒果慕斯 Mango...", 4.35),
      I("slice-french-latte",  "Slice法式拿鐵 French L...", 0),
      I("slice-straw-chantilly","Slice草莓香緹 Strawbe...", 4.35, { color: PURPLE }),
      I("slice-cappuccino",    "Slice卡布奇諾慕斯 Cappuc...", 4.35),
      I("slice-choco-passion", "Slice可可百香果慕斯Choco...", 4.35),
    ]),
    F("長條Long", [
      I("long-straw-chantilly","Long草莓香緹 Strawbe...", 19.40, { color: PURPLE }),
      I("long-cappuccino",     "Long卡布奇諾慕斯 Cappuc...", 19.40),
      I("long-choco-passion",  "Long可可百香果慕斯Choco...", 19.40),
      I("long-black-forest",   "Long黑琳 Chocolate Chocolate", 20.40),
      I("long-tiramisu",       "Long提拉米蘇 (法式)Tiram...", 20.40),
      I("long-choco-coffee",   "Long可可咖啡慕斯 Choco C...", 20.40),
      I("long-mango-mousse",   "Long芒果慕斯 Mango...", 20.40),
      I("long-marble",         "Long虎皮大理石 Marble...", 15.30),
      I("long-chess",          "Long棋盤蛋糕 Chess C...", 15.30),
    ]),
    F("母親節 Mother's Day", [
      I("md-a-taro-basque",    "#A Taro x Basque 芋見巴斯克", 0),
      I("md-b-tiramisu",       "#B Tiramisu Swiss R...", 0),
      I("md-c-mango",          "#C Holiday Mango...", 0),
      I("md-d-vanilla",        "#D Holiday Vanilla T...", 0),
    ]),
    F('8"', [
      I("8-vanilla-cream",     '8"香草戚風夾奶油Vanilla C...', 0),
      I("8-choco-cream",       '8"巧克力戚風夾奶油Choco...', 0),
      I("8-coffee-cream",      '8"咖啡戚風夾奶油Coffee C...', 0),
      I("8-check-choco",       '8"格子巧克力 Chocola...', 0),
      I("8-choco-cherry",      '8"巧克力櫻桃 Choco....', 0),
      I("8-vanilla-fruit",     '8"香草戚風夾綜合水果Vani...', 0),
      I("8-choco-fruit",       '8"巧克力戚風夾綜合水果C...', 0),
      I("8-coffee-fruit",      '8"咖啡戚風夾綜合水果Coff...', 0),
      I("8-ny-cheese",         '8"紐約起司蛋糕N.Y. Cheese...', 0),
      I("8-taro",              '8"芋頭蛋糕Vanilla Chiffon...', 0),
      I("8-vanilla-straw",     '8"香草戚風夾草莓Vanilla C...', 0),
      I("8-choco-straw",       '8"巧克力戚風夾草莓Choco...', 0),
      I("8-coffee-straw",      '8"咖啡戚風夾草莓Coffee C...', 0),
      I("8-choco-symphony",    '8"巧克力交響曲 Chocola...', 0),
      I("8-mango-mousse",      '8"芒果慕斯Mango Mousse', 0),
      I("8-fruit-festival",    '8"水果嘉年華Fruit Festival...', 0),
      I("8-tiramisu",          '8"提拉米蘇 (法式)Tiram...', 0),
      I("8-choco-coffee",      '8"可可咖啡慕斯 Choco C...', 0),
      I("8-strawberry-creme",  '8"草莓奶酪 Strawbe...', 0),
      I("8-black-forest",      '8"黑琳 Chocolate Chocolate', 0),
      I("8-taro-pudding",      '8"相思芋頭布丁 Vanilla C...', 0),
      I("8-add-pudding",       '8"加布丁 + Pudding', 0),
      I("8-fully-topping",     '8"舖滿水果Fully Topping', 0),
    ]),
    F("蠟燭/卡通/玩具Addon", [
      I("candle",              "蠟燭 Candle", 0),
      I("white-choco-heart",   "心型巧克力片White Chocola...", 0),
    ]),
    F("2023中式喜餅 Weddin...", []),
  ]),
  F("飲料Drink", BLUE, [
    F("Cold冷飲", [
      I("iced-soy-milk",     "冰豆漿 Iced Soy Milk", 3.00),
      I("iced-rice-milk",    "冰米漿 Iced Rice Milk", 3.00),
      I("bottled-milk-tea",  "瓶裝奶茶 (S)Bottled Milk Tea", 3.75),
      I("bottled-water",     "瓶裝水 Bottled Water", 2.05),
      I("ucc-coffee",        "UCC Coffee", 0),
      I("apple-juice",       "蘋果汁 Martinelli's Apple...", 2.55),
      I("iced-assam",        "阿薩姆紅茶Iced Assam B...", 0),
      I("iced-jasmine",      "茉莉綠茶 Iced Jasmine...", 3.05),
      I("mr-brown-blue-mtn", "Mr. Brown Coffee - Blue Mo...", 2.00),
      I("mr-brown-extra",    "黑咖啡 Mr. Brown Extra Sh...", 0),
    ]),
  ]),
  F("其他Other", BLUE, [
    F("產品Product", [
      I("sticky-rice",         "油飯 Sticky Rice Ben...", 0),
      I("pork-floss",          "寶島一級肉鬆 Premium...", 8.15),
      I("sweet-chili-sauce",   "東泉辣椒醬Sweet Chili Sau...", 0),
      I("fish-crisp",          "經典原味魚酥 TaiwanFi...", 0),
      I("spicy-fish-crisp",    "辛口辣味魚酥 SpicyFis...", 0),
      I("mousse-bag",          "長條慕斯手提袋 Long Cu...", 0),
      I("camellia-oil",        "高山苦茶油 Mountai...", 0),
      I("garlic-soy",          "JJ 特製大蒜醬油 Specialt...", 7.10),
      I("garlic-soy-single",   "JJ 特製大蒜醬油 (單包裝) Sp...", 0),
      I("swordfish-floss",     "古早味旗魚鬆 Classic...", 0),
      I("swordfish-crisp",     "旗魚酥 Fresh & Fried Sw...", 0),
      I("honey-gift-box",      "蜂蜜禮盒(荔枝蜜,草蜜,龍眼...", 27.00),
      I("longan-honey",        "龍眼蜂蜜 Longan Honey", 18.00),
    ]),
    I("delivery-fee", "運費 Deliver Fee", 0, { practice: false }),
    F("Newspaper", [
      I("world-journal",       "世界日報 World Journal", 0),
      I("epoch-times",         "大紀元時報 Epochti...", 0),
    ]),
  ]),

  F("冷凍食品 Frozen Food", BLUE, [
    F("冷凍食品Frozen Food", [
      I("zongzi",              "冷凍香菇蛋黃肉粽 Chinese...", 0),
      I("bamboo-shoot",        "滷筍乾 Bamboo shoot", 0),
      I("pickled-mustard",     "酸菜(盒)Pickled Mustar...", 7.65),
      I("salted-mustard-pork", "冷凍雪菜肉絲 Salted M...", 0),
      I("pickled-tuber-pork",  "冷凍榨菜肉絲 Pickled...", 0),
      I("pineapple-rib-soup",  "冷凍鳳梨苦瓜排骨(小)Pine...", 0),
      I("beef-soup-32",        "32oz冷凍紅燒牛肉麵湯底 B...", 0),
      I("fried-soy-sauce",     "冷凍炸醬 Fried Soy Bean Sa...", 0),
      I("four-spirits-soup",   "冷凍四神豬肚湯 Four Spi...", 0),
      I("spicy-pig-ear",       "冷凍麻辣豬耳 Spicy Pig Ear", 0),
      I("spicy-stinky-tofu",   "冷凍麻辣臭豆腐 Spicy Sti...", 0),
      I("braised-pork",        "冷凍紅燒肉(台灣焢肉) Brais...", 0),
      I("smoked-duck-box",     "燻鴨(盒)Smoked Duck...", 0),
      I("beef-soup-64",        "64oz 冷凍紅燒牛肉麵湯底B...", 0),
      I("lamb-soup",           "冷凍羊肉爐Lamb Soup", 0),
      I("whole-duck",          "冷凍燻鴨(整隻) Whole D...", 0),
      I("taro-cake-5",         "芋粿巧盒(x5)Savory Taro C...", 0),
      I("green-bean-soup",     "綠豆薏仁湯Sweet Green B...", 4.60),
      I("peanut-douhua",       "傳統花生豆花 Tradition...", 8.15),
      I("lotus-seed-soup",     "蓮子銀耳湯Sweet lotus se...", 0),
    ]),
  ]),
  F("中秋節月餅 Moon Cakes", ORANGE, []),
  F("W-蛋糕&慕斯Cake&M...", RED, []),
  F("W-餅乾&甜點Cookie&...", RED, []),
  F("W-麵包Bread", RED, []),

  F("W-飲料Drink", RED, []),
  F("W-中秋節月餅 Moon C...", RED, []),
  F("W-其他Other", RED, []),
  F("W-冷凍食品Frozen Food", RED, []),
  F("P-麵包Bread", INDIGO, []),

  F("P-餅乾&甜點Cookie&...", INDIGO, []),
  F("P-蛋糕&慕斯Cake&M...", INDIGO, []),
];

// ---- helpers (don't need to edit) ----
function F(name, color, children) {
  if (Array.isArray(color)) { children = color; color = null; }
  return { type: "folder", name: name, color: color, children: children };
}
function I(id, name, price, opts) {
  var item = { type: "item", id: id, name: name, price: price || 0 };
  for (var k in opts || {}) item[k] = opts[k];
  return item;
}
