export const PROJECT_CATEGORIES = [
  "NATURE",
  "ANIMALS",
  "PEOPLE",
  "CITY",
  "TECHNOLOGY",
  "ABSTRACT",
  "FOOD",
  "TRAVEL",
  "OTHER"
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  NATURE: "Природа",
  ANIMALS: "Животные",
  PEOPLE: "Люди",
  CITY: "Город",
  TECHNOLOGY: "Технологии",
  ABSTRACT: "Абстракция",
  FOOD: "Еда",
  TRAVEL: "Путешествия",
  OTHER: "Другое"
};
