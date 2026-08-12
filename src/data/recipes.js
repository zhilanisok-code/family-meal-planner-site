const image = (category, url, sourceUrl, author) => ({
  category,
  url,
  sourceUrl,
  author,
  licenseLabel: "Unsplash License",
});

const PHOTO_SOURCES = [
  image("handheld-bread", "https://images.unsplash.com/photo-1558985250-27a406d64cb3?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/sandwich-on-table-sBKLiRiunK0", "Youjeen Cho"),
  image("pasta", "https://images.unsplash.com/photo-1552056776-9b5657118ca4?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/pasta-on-plate-jL3X9oeQ3Ps", "Youjeen Cho"),
  image("handheld-bread", "https://images.unsplash.com/photo-1559054663-e8d23213f55c?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/baked-bread-sandwich-a_iKAg00LN4", "Aigars Peda"),
  image("pancake", "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/baked-pancakes-eeqbbemH9-c", "Chad Montano"),
  image("shrimp-main", "https://images.unsplash.com/photo-1607247098789-6a43ebeaba4e?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/white-and-yellow-shrimp-on-white-ceramic-plate-kwgCZZrhcp0", "FlyD"),
  image("tomato-ingredient", "https://images.unsplash.com/photo-1689512613052-873d2b4295ae?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/a-person-holding-a-bowl-of-tomatoes-in-their-hands-vzWukjj6zno", "Elias Morr"),
  image("handheld-bread", "https://images.unsplash.com/photo-1469648034646-7911874fe62b?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/selective-focus-photography-of-sandwich-4nHpGXcgq7I", "Anton"),
  image("tomato-ingredient", "https://images.unsplash.com/photo-1443131612988-32b6d97cc5da?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/bunch-of-tomatoes-UOEB1ztsDMo", "Anda Ambrosini"),
  image("shrimp-main", "https://images.unsplash.com/photo-1577934017455-df37c5113f33?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/person-holding-a-shrimp-oLUdylKieqw", "Nathan Dumlao"),
  image("handheld-bread", "https://images.unsplash.com/photo-1517254456976-ee8682099819?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/shallow-focus-lens-photography-of-sandwich-rFYmnobNI6o", "Grant Ritchie"),
  image("shrimp-main", "https://images.unsplash.com/photo-1504309250229-4f08315f3b5c?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/a-bunch-of-shrimp-that-are-laying-on-the-ground-WTPMcV1NZuY", "Etienne Girardet"),
  image("handheld-bread", "https://images.unsplash.com/photo-1661699627895-407d542b78d1?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/a-sandwich-on-a-table-nf5xNohfFkk", "Adam Bartoszewicz"),
  image("rice-bowl", "https://images.unsplash.com/photo-1770966666358-e9f8c4f37daf?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/bowl-of-rice-with-grilled-meat-and-fried-egg-7TARyyHQos8", "Zhang Ziyu"),
  image("steamed-dough", "https://images.unsplash.com/photo-1651399436026-3ca4088b3d6e?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/a-bowl-of-dumplings-g7ue2JBhDro", "krzhck"),
  image("salad", "https://images.unsplash.com/photo-1595515307081-62364708161c?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/person-holding-a-vegetable-salad-cmVtcQABSe4", "Louis Hansel"),
  image("egg-breakfast", "https://images.unsplash.com/photo-1559332167-dd24746aa6f5?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/a-white-plate-topped-with-eggs-and-toast-wIOBD2k3agQ", "Krisztina Papp"),
  image("tofu-main", "https://images.unsplash.com/photo-1762305194201-077e7e23ccf2?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/crispy-fried-tofu-cubes-sprinkled-with-green-onions-N0lnO0gZlW8", "Lee Milo"),
  image("fish-main", "https://images.unsplash.com/photo-1575053516499-bf3ab5bf59e4?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/cooked-fish-vt7-hbyqfhY", "Mod By"),
  image("beef-stew", "https://images.unsplash.com/photo-1519699788450-ad34386a3bfc?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/beef-stew-served-on-dish-a-gPTenlS0U", "ERIC ZHU"),
  image("rice-bowl", "https://images.unsplash.com/photo-1744444202869-54debf97b285?auto=format&fit=crop&w=1200&q=80", "https://unsplash.com/photos/chicken-rice-bowl-with-toppings-looks-delicious--X4tkvjVSco", "Chee Kee"),
];

const RECIPE_VISUAL_CATEGORIES = {
  "egg-toast-plate": "egg-breakfast", "beef-egg-roll": "egg-breakfast", "dumpling-breakfast": "steamed-dough", "veggie-bun-yogurt": "steamed-dough", "banana-oat-pancake": "pancake", "chicken-sandwich": "handheld-bread", "chicken-grain-bowl": "rice-bowl", "beef-pepper-rice": "rice-bowl", "beef-sandwich": "handheld-bread", "salmon-grain-bowl": "rice-bowl", "tomato-beef-pasta": "pasta", "herb-chicken-salad": "salad", "shrimp-egg-rice": "shrimp-main", "curry-chicken-rice": "rice-bowl", "chicken-wrap": "handheld-bread", "mushroom-beef-rice": "rice-bowl", "beef-veggie-pot": "rice-bowl", "tomato-egg-rice": "rice-bowl", "tofu-mince-rice": "tofu-main", "boneless-fish-egg": "fish-main", "mushroom-chicken-pot": "rice-bowl", "tomato-beef-stew": "beef-stew", "shrimp-tofu-pot": "shrimp-main", "pumpkin-chicken-rice": "rice-bowl",
};

const ingredient = (id, name, qty, unit) => ({
  id,
  name,
  qty: qty ?? null,
  unit,
  displayQty: qty == null ? "待确认" : `${qty}${unit}`,
});

const makeRecipe = ({
  id,
  title,
  scenarios,
  mealTypes,
  proteinGroup,
  ingredients,
  steps,
  timing,
  storage,
  reheatMethods,
  preferenceNotes,
  generalNotes,
  imageIndex,
}) => ({
  id,
  title,
  scenarios,
  mealTypes,
  proteinGroup,
  servingBase: 2,
  ingredients,
  steps,
  timing,
  storage,
  reheatMethods,
  preferenceNotes,
  generalNotes,
  visualCategory: RECIPE_VISUAL_CATEGORIES[id],
  image: PHOTO_SOURCES[imageIndex],
});

const lightNotes = ["清淡少盐，按家人口味微调。", "本数据仅作家常安排参考，不构成医疗或营养建议。"];

export const RECIPES = [
  makeRecipe({
    id: "egg-toast-plate", title: "鸡蛋吐司早餐盘", scenarios: ["工作日早餐", "快速备餐"], mealTypes: ["breakfast"], proteinGroup: "egg",
    ingredients: [ingredient("egg", "鸡蛋", 2, "个"), ingredient("whole-wheat-toast", "全麦吐司", 4, "片"), ingredient("cherry-tomato", "小番茄", 120, "g")],
    steps: ["鸡蛋煮熟或少油煎熟。", "吐司烤至微脆。", "配上洗净的小番茄装盘。"], timing: "约15分钟", storage: "建议现做现吃", reheatMethods: ["吐司可干烤复热"], preferenceNotes: ["儿童可将鸡蛋切小块", "少皮少油"], generalNotes: lightNotes, imageIndex: 15,
  }),
  makeRecipe({
    id: "beef-egg-roll", title: "牛肉蔬菜蛋卷", scenarios: ["工作日早餐", "便携午餐"], mealTypes: ["breakfast", "lunch"], proteinGroup: "beef",
    ingredients: [ingredient("beef-slices", "牛肉片", 160, "g"), ingredient("egg", "鸡蛋", 3, "个"), ingredient("carrot", "胡萝卜", 100, "g"), ingredient("spinach", "菠菜", 100, "g")],
    steps: ["牛肉和蔬菜切细备用。", "摊成薄蛋皮。", "炒熟牛肉蔬菜后卷入蛋皮切段。"], timing: "约25分钟", storage: "冷藏不超过1天", reheatMethods: ["平底锅小火加热", "微波低火"], preferenceNotes: ["牛肉切小片", "儿童可不加辛香料"], generalNotes: lightNotes, imageIndex: 15,
  }),
  makeRecipe({
    id: "dumpling-breakfast", title: "蒸饺鸡蛋青菜组合", scenarios: ["工作日早餐", "冰箱常备"], mealTypes: ["breakfast"], proteinGroup: "egg",
    ingredients: [ingredient("frozen-dumpling", "冷冻蒸饺", 12, "个"), ingredient("egg", "鸡蛋", 2, "个"), ingredient("bok-choy", "小青菜", 180, "g")],
    steps: ["蒸锅水开后蒸熟饺子。", "鸡蛋煮熟或蒸熟。", "青菜焯水后沥干装盘。"], timing: "约18分钟", storage: "建议现做现吃", reheatMethods: ["蒸锅复热饺子"], preferenceNotes: ["饺子蘸料单独放", "青菜切短"], generalNotes: lightNotes, imageIndex: 13,
  }),
  makeRecipe({
    id: "veggie-bun-yogurt", title: "素菜包酸奶水果组合", scenarios: ["工作日早餐", "无需开火"], mealTypes: ["breakfast"], proteinGroup: "dairy",
    ingredients: [ingredient("vegetable-bun", "素菜包", 4, "个"), ingredient("plain-yogurt", "原味酸奶", 300, "ml"), ingredient("banana", "香蕉", 2, "根")],
    steps: ["素菜包蒸热。", "酸奶倒入小碗。", "香蕉去皮切段后搭配食用。"], timing: "约12分钟", storage: "水果建议现切", reheatMethods: ["蒸锅复热素菜包"], preferenceNotes: ["选原味酸奶", "儿童水果切段"], generalNotes: lightNotes, imageIndex: 13,
  }),
  makeRecipe({
    id: "banana-oat-pancake", title: "香蕉燕麦饼", scenarios: ["周末早餐", "亲子参与"], mealTypes: ["breakfast"], proteinGroup: "egg",
    ingredients: [ingredient("banana", "香蕉", 2, "根"), ingredient("oats", "燕麦片", 100, "g"), ingredient("egg", "鸡蛋", 2, "个")],
    steps: ["香蕉压成泥并拌入鸡蛋。", "加入燕麦静置片刻。", "平底锅少油小火煎至两面定型。"], timing: "约20分钟", storage: "冷藏不超过1天", reheatMethods: ["平底锅小火复热"], preferenceNotes: ["可做小块方便儿童", "不额外加糖"], generalNotes: lightNotes, imageIndex: 3,
  }),
  makeRecipe({
    id: "chicken-sandwich", title: "全麦鸡肉三明治", scenarios: ["成人工作餐", "便携午餐"], mealTypes: ["breakfast", "lunch"], proteinGroup: "chicken",
    ingredients: [ingredient("chicken-breast", "鸡胸肉", 180, "g"), ingredient("whole-wheat-toast", "全麦吐司", 4, "片"), ingredient("lettuce", "生菜", 80, "g"), ingredient("tomato", "番茄", 120, "g")],
    steps: ["鸡胸肉煎熟后静置切片。", "吐司干烤至微脆。", "夹入生菜、番茄和鸡肉后对切。"], timing: "约25分钟", storage: "冷藏不超过1天", reheatMethods: ["鸡肉单独微波低火", "吐司干烤"], preferenceNotes: ["酱料少放或不放", "去皮鸡肉"], generalNotes: lightNotes, imageIndex: 11,
  }),
  makeRecipe({
    id: "chicken-grain-bowl", title: "香煎鸡腿杂粮饭", scenarios: ["成人工作餐", "晚餐"], mealTypes: ["lunch", "dinner"], proteinGroup: "chicken",
    ingredients: [ingredient("boneless-chicken-thigh", "去皮鸡腿肉", 220, "g"), ingredient("mixed-grain-rice", "杂粮饭", 300, "g"), ingredient("broccoli", "西兰花", 200, "g"), ingredient("carrot", "胡萝卜", 120, "g")],
    steps: ["鸡腿肉去皮后切块调味。", "平底锅少油煎熟鸡肉。", "西兰花和胡萝卜焯熟，与杂粮饭装碗。"], timing: "约35分钟", storage: "冷藏不超过2天", reheatMethods: ["微波中火", "蒸锅加热"], preferenceNotes: ["鸡肉切小块", "蔬菜煮软些"], generalNotes: lightNotes, imageIndex: 19,
  }),
  makeRecipe({
    id: "beef-pepper-rice", title: "彩椒牛肉杂粮饭", scenarios: ["成人工作餐", "快速晚餐"], mealTypes: ["lunch", "dinner"], proteinGroup: "beef",
    ingredients: [ingredient("beef-slices", "牛肉片", 200, "g"), ingredient("bell-pepper", "彩椒", 180, "g"), ingredient("mixed-grain-rice", "杂粮饭", 300, "g"), ingredient("onion", "洋葱", 80, "g")],
    steps: ["彩椒和洋葱切条。", "牛肉快速翻炒至变色。", "加入蔬菜炒熟后配杂粮饭。"], timing: "约25分钟", storage: "冷藏不超过1天", reheatMethods: ["微波中火", "锅中少量水焖热"], preferenceNotes: ["牛肉切细条", "洋葱可减量"], generalNotes: lightNotes, imageIndex: 12,
  }),
  makeRecipe({
    id: "beef-sandwich", title: "牛肉全麦三明治", scenarios: ["成人工作餐", "便携午餐"], mealTypes: ["lunch"], proteinGroup: "beef",
    ingredients: [ingredient("beef-slices", "牛肉片", 180, "g"), ingredient("whole-wheat-toast", "全麦吐司", 4, "片"), ingredient("cucumber", "黄瓜", 120, "g"), ingredient("lettuce", "生菜", 80, "g")],
    steps: ["牛肉煎熟后放凉。", "吐司略烤，黄瓜切薄片。", "夹入蔬菜和牛肉后包好。"], timing: "约20分钟", storage: "冷藏不超过1天", reheatMethods: ["牛肉单独加热", "吐司可干烤"], preferenceNotes: ["不加高盐腌肉", "儿童可切成小方块"], generalNotes: lightNotes, imageIndex: 2,
  }),
  makeRecipe({
    id: "salmon-grain-bowl", title: "无刺三文鱼杂粮碗", scenarios: ["成人工作餐", "家庭晚餐"], mealTypes: ["lunch", "dinner"], proteinGroup: "fish",
    ingredients: [ingredient("boneless-salmon", "无刺三文鱼", 220, "g"), ingredient("mixed-grain-rice", "杂粮饭", 300, "g"), ingredient("cucumber", "黄瓜", 120, "g"), ingredient("broccoli", "西兰花", 180, "g")],
    steps: ["确认鱼肉无刺后切块。", "烤箱或平底锅加热至熟。", "搭配杂粮饭和焯熟蔬菜装碗。"], timing: "约30分钟", storage: "建议现做现吃", reheatMethods: ["低火复热鱼肉", "蒸锅加热"], preferenceNotes: ["上桌前再次检查鱼刺", "少皮少油"], generalNotes: [...lightNotes, "鱼类仅选无刺处理食材。"], imageIndex: 12,
  }),
  makeRecipe({
    id: "tomato-beef-pasta", title: "番茄牛肉意面", scenarios: ["家庭晚餐", "周末午餐"], mealTypes: ["lunch", "dinner"], proteinGroup: "beef",
    ingredients: [ingredient("beef-mince", "牛肉末", 200, "g"), ingredient("pasta", "意面", 180, "g"), ingredient("tomato", "番茄", 260, "g"), ingredient("mushroom", "口蘑", 120, "g")],
    steps: ["意面煮熟后沥水。", "番茄和牛肉末小火煮成酱。", "拌入意面和口蘑煮匀。"], timing: "约35分钟", storage: "冷藏不超过1天", reheatMethods: ["锅中加少量水复热", "微波中火"], preferenceNotes: ["番茄去皮更软", "不额外加重口酱料"], generalNotes: lightNotes, imageIndex: 1,
  }),
  makeRecipe({
    id: "herb-chicken-salad", title: "香草鸡肉土豆沙拉", scenarios: ["成人工作餐", "周末午餐"], mealTypes: ["lunch"], proteinGroup: "chicken",
    ingredients: [ingredient("chicken-breast", "鸡胸肉", 180, "g"), ingredient("potato", "土豆", 260, "g"), ingredient("cucumber", "黄瓜", 120, "g"), ingredient("mixed-herbs", "混合香草", null, "g")],
    steps: ["土豆切块蒸熟放凉。", "鸡胸肉煎熟后撕成条。", "与黄瓜和香草轻拌装盒。"], timing: "约30分钟", storage: "冷藏不超过1天", reheatMethods: ["鸡肉可单独低火加热", "其余冷食"], preferenceNotes: ["香草用量按购买包装确认", "不使用高盐沙拉酱"], generalNotes: lightNotes, imageIndex: 14,
  }),
  makeRecipe({
    id: "shrimp-egg-rice", title: "虾仁西葫芦炒蛋饭", scenarios: ["家庭晚餐", "快速晚餐"], mealTypes: ["dinner"], proteinGroup: "shrimp",
    ingredients: [ingredient("peeled-shrimp", "去壳虾仁", 200, "g"), ingredient("egg", "鸡蛋", 3, "个"), ingredient("zucchini", "西葫芦", 260, "g"), ingredient("rice", "米饭", 300, "g")],
    steps: ["虾仁洗净沥干。", "鸡蛋炒至半熟盛出。", "炒软西葫芦和虾仁后回锅拌鸡蛋，配饭。"], timing: "约25分钟", storage: "建议现做现吃", reheatMethods: ["微波中火", "锅中小火复热"], preferenceNotes: ["虾仁去壳并检查残壳", "西葫芦切薄片"], generalNotes: lightNotes, imageIndex: 8,
  }),
  makeRecipe({
    id: "curry-chicken-rice", title: "清淡咖喱鸡肉蔬菜饭", scenarios: ["家庭晚餐", "一锅饭"], mealTypes: ["dinner"], proteinGroup: "chicken",
    ingredients: [ingredient("chicken-breast", "鸡胸肉", 220, "g"), ingredient("potato", "土豆", 200, "g"), ingredient("carrot", "胡萝卜", 160, "g"), ingredient("rice", "米饭", 300, "g")],
    steps: ["鸡肉和蔬菜切小块。", "少油炒香鸡肉和蔬菜。", "加水煮软后放少量清淡咖喱，配米饭。"], timing: "约40分钟", storage: "冷藏不超过1天", reheatMethods: ["锅中加水复热", "微波中火"], preferenceNotes: ["咖喱调料少量试味", "儿童可先盛出再调味"], generalNotes: lightNotes, imageIndex: 19,
  }),
  makeRecipe({
    id: "chicken-wrap", title: "鸡肉蔬菜卷", scenarios: ["成人工作餐", "便携午餐"], mealTypes: ["lunch"], proteinGroup: "chicken",
    ingredients: [ingredient("chicken-breast", "鸡胸肉", 180, "g"), ingredient("whole-wheat-wrap", "全麦卷饼", 4, "张"), ingredient("carrot", "胡萝卜", 100, "g"), ingredient("lettuce", "生菜", 100, "g")],
    steps: ["鸡肉煎熟后切条。", "胡萝卜焯软切丝。", "把鸡肉和蔬菜卷入卷饼并切段。"], timing: "约25分钟", storage: "冷藏不超过1天", reheatMethods: ["卷饼干烤复热", "鸡肉单独加热"], preferenceNotes: ["卷饼切短便于儿童", "少用酱料"], generalNotes: lightNotes, imageIndex: 11,
  }),
  makeRecipe({
    id: "mushroom-beef-rice", title: "蘑菇牛肉饭", scenarios: ["成人工作餐", "快速晚餐"], mealTypes: ["lunch", "dinner"], proteinGroup: "beef",
    ingredients: [ingredient("beef-slices", "牛肉片", 200, "g"), ingredient("mushroom", "口蘑", 220, "g"), ingredient("rice", "米饭", 300, "g"), ingredient("broccoli", "西兰花", 160, "g")],
    steps: ["口蘑切片，牛肉切小片。", "先炒熟口蘑，再放牛肉快炒。", "搭配米饭和焯熟西兰花。"], timing: "约25分钟", storage: "冷藏不超过1天", reheatMethods: ["微波中火", "锅中小火复热"], preferenceNotes: ["牛肉不要久炒", "蘑菇切小块"], generalNotes: lightNotes, imageIndex: 12,
  }),
  makeRecipe({
    id: "beef-veggie-pot", title: "牛肉蔬菜焖饭", scenarios: ["家庭晚餐", "一锅饭"], mealTypes: ["dinner"], proteinGroup: "beef",
    ingredients: [ingredient("beef-cubes", "牛肉丁", 260, "g"), ingredient("rice", "大米", 240, "g"), ingredient("carrot", "胡萝卜", 180, "g"), ingredient("peas", "豌豆", 120, "g")],
    steps: ["牛肉和胡萝卜切小丁。", "牛肉略煎后与大米、蔬菜入锅。", "按米饭水量焖熟，拌松后食用。"], timing: "约50分钟", storage: "冷藏不超过1天", reheatMethods: ["蒸锅加热", "微波中火"], preferenceNotes: ["牛肉炖软后再与米同煮", "蔬菜切小丁"], generalNotes: lightNotes, imageIndex: 12,
  }),
  makeRecipe({
    id: "tomato-egg-rice", title: "番茄鸡蛋烩饭", scenarios: ["家庭晚餐", "冰箱食材消耗"], mealTypes: ["dinner"], proteinGroup: "egg",
    ingredients: [ingredient("tomato", "番茄", 320, "g"), ingredient("egg", "鸡蛋", 4, "个"), ingredient("rice", "米饭", 300, "g"), ingredient("peas", "豌豆", 100, "g")],
    steps: ["番茄去皮切块。", "鸡蛋炒熟后盛出。", "番茄煮软后加米饭、豌豆和鸡蛋烩匀。"], timing: "约25分钟", storage: "建议现做现吃", reheatMethods: ["锅中加少量水复热"], preferenceNotes: ["番茄煮软些", "少盐"], generalNotes: lightNotes, imageIndex: 12,
  }),
  makeRecipe({
    id: "tofu-mince-rice", title: "肉末豆腐盖饭", scenarios: ["家庭晚餐", "软烂口感"], mealTypes: ["dinner"], proteinGroup: "pork",
    ingredients: [ingredient("lean-pork-mince", "瘦肉末", 180, "g"), ingredient("soft-tofu", "嫩豆腐", 360, "g"), ingredient("rice", "米饭", 300, "g"), ingredient("carrot", "胡萝卜", 100, "g")],
    steps: ["胡萝卜切细丁，豆腐切块。", "肉末炒散后加入胡萝卜。", "加豆腐和少量水焖熟后盖在米饭上。"], timing: "约30分钟", storage: "建议现做现吃", reheatMethods: ["锅中小火复热", "微波低火"], preferenceNotes: ["豆腐保持大块避免翻碎", "肉末选偏瘦"], generalNotes: lightNotes, imageIndex: 16,
  }),
  makeRecipe({
    id: "boneless-fish-egg", title: "无刺鱼片蒸蛋", scenarios: ["家庭晚餐", "软烂口感"], mealTypes: ["dinner"], proteinGroup: "fish",
    ingredients: [ingredient("boneless-fish-fillet", "无刺鱼片", 220, "g"), ingredient("egg", "鸡蛋", 4, "个"), ingredient("zucchini", "西葫芦", 160, "g"), ingredient("rice", "米饭", 300, "g")],
    steps: ["确认鱼片无刺并切小块。", "鸡蛋加温水打散，放入鱼片和西葫芦。", "蒸至凝固后配米饭食用。"], timing: "约30分钟", storage: "建议现做现吃", reheatMethods: ["蒸锅低火复热"], preferenceNotes: ["上桌前再次检查鱼刺", "蛋羹蒸嫩些"], generalNotes: [...lightNotes, "鱼类仅选无刺处理食材。"], imageIndex: 17,
  }),
  makeRecipe({
    id: "mushroom-chicken-pot", title: "香菇鸡腿焖饭", scenarios: ["家庭晚餐", "一锅饭"], mealTypes: ["dinner"], proteinGroup: "chicken",
    ingredients: [ingredient("boneless-chicken-thigh", "去皮鸡腿肉", 240, "g"), ingredient("shiitake", "香菇", 160, "g"), ingredient("rice", "大米", 240, "g"), ingredient("carrot", "胡萝卜", 140, "g")],
    steps: ["鸡腿肉去皮切丁，香菇切片。", "食材和淘洗的大米一起入锅。", "按米饭水量焖熟后拌匀。"], timing: "约45分钟", storage: "冷藏不超过1天", reheatMethods: ["蒸锅加热", "微波中火"], preferenceNotes: ["鸡肉去皮", "香菇切小片"], generalNotes: lightNotes, imageIndex: 19,
  }),
  makeRecipe({
    id: "tomato-beef-stew", title: "番茄牛腩", scenarios: ["家庭晚餐", "周末批量做"], mealTypes: ["dinner"], proteinGroup: "beef",
    ingredients: [ingredient("beef-brisket", "牛腩", 400, "g"), ingredient("tomato", "番茄", 360, "g"), ingredient("potato", "土豆", 240, "g"), ingredient("carrot", "胡萝卜", 160, "g")],
    steps: ["牛腩焯水后冲洗。", "与番茄加水慢炖至软。", "加入土豆和胡萝卜煮熟后食用。"], timing: "约90分钟", storage: "冷藏不超过2天", reheatMethods: ["锅中小火复热", "微波中火"], preferenceNotes: ["牛腩炖软再给老人儿童", "浮油撇去"], generalNotes: lightNotes, imageIndex: 18,
  }),
  makeRecipe({
    id: "shrimp-tofu-pot", title: "虾仁豆腐煲", scenarios: ["家庭晚餐", "软烂口感"], mealTypes: ["dinner"], proteinGroup: "shrimp",
    ingredients: [ingredient("peeled-shrimp", "去壳虾仁", 220, "g"), ingredient("soft-tofu", "嫩豆腐", 360, "g"), ingredient("broccoli", "西兰花", 180, "g"), ingredient("rice", "米饭", 300, "g")],
    steps: ["虾仁处理干净，豆腐切块。", "西兰花焯水后备用。", "虾仁、豆腐加少量水焖熟，放入西兰花。"], timing: "约28分钟", storage: "建议现做现吃", reheatMethods: ["锅中小火复热"], preferenceNotes: ["虾仁去壳并检查残壳", "豆腐少翻动"], generalNotes: lightNotes, imageIndex: 10,
  }),
  makeRecipe({
    id: "pumpkin-chicken-rice", title: "南瓜鸡肉烩饭", scenarios: ["家庭晚餐", "软烂口感"], mealTypes: ["dinner"], proteinGroup: "chicken",
    ingredients: [ingredient("chicken-breast", "鸡胸肉", 200, "g"), ingredient("pumpkin", "南瓜", 300, "g"), ingredient("rice", "米饭", 300, "g"), ingredient("peas", "豌豆", 100, "g")],
    steps: ["南瓜去皮切小丁，鸡肉切细丁。", "鸡肉炒至变色后加入南瓜。", "加米饭和少量水焖软，最后放豌豆。"], timing: "约35分钟", storage: "冷藏不超过1天", reheatMethods: ["锅中加少量水复热", "微波中火"], preferenceNotes: ["南瓜煮软压散", "鸡肉切小丁"], generalNotes: lightNotes, imageIndex: 19,
  }),
];
