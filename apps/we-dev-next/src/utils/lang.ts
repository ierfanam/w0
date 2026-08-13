export enum Language {
  Persian = "fa",
  English = "en",
  "Chinese(Simplified)" = "zh-CN",
}

export const LanguageNativeNames: { name: string; locale: Language }[] = [
  {
    name: "فارسی",
    locale: Language.Persian,
  },
  {
    name: "English",
    locale: Language.English,
  },
  {
    name: "简体中文",
    locale: Language["Chinese(Simplified)"],
  },
];

export const locales = LanguageNativeNames.map((item) => item.locale);
