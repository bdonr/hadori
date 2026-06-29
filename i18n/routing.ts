import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en", "fr", "ja", "zh", "ru", "ko"],
  defaultLocale: "en",
});
