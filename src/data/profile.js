export const DEFAULT_PROFILE = {
  members: [
    { id: "demo-adult-a", label: "演示成员 A", role: "adult", defaultServings: 1 },
    { id: "demo-adult-b", label: "演示成员 B", role: "adult", defaultServings: 1 },
  ],
  preferences: {
    avoidIngredientIds: [],
    workdayLunch: true,
    workdayDinner: true,
    stores: ["sams", "market"],
  },
};
