import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locale/en.json";
import zh from "../locale/zh.json";
import fa from "../locale/fa.json";

const resources = {
  en: { translation: { ...en } },
  zh: { translation: { ...zh } },
  fa: { translation: { ...fa } },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "fa",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
