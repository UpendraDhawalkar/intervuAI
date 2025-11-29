"use client";

import { useEffect, useState } from "react";
import { chatSession } from "@/utils/GeminiAIModel";

// 🌍 In-memory cache to avoid repeat translations
const langCache = {};
// ⛔ Block API calls after quota exceeded (timestamp in ms)
let UI_TRANSLATION_BLOCK_UNTIL = 0;

/**
 * A custom hook that auto-translates UI text based on user-selected language.
 * English is used directly without API call.
 * If quota exceeded, translation is blocked temporarily and base text is used.
 */
export function useTranslatedText(baseText = {}, namespace = "") {
  const [language, setLanguage] = useState("en");
  const [uiText, setUiText] = useState(baseText);
  const [translating, setTranslating] = useState(false);

  // 🟡 Safely get language from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const lang = localStorage.getItem("appLanguage") || "en";
      setLanguage(lang);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (typeof window === "undefined") return;
      setTranslating(true);

      // 🛑 If language is English, no need to translate
      if (language === "en") {
        setUiText(baseText);
        setTranslating(false);
        return;
      }

      // ⛔ Avoid API calls for 5 min if quota exceeded
      if (Date.now() < UI_TRANSLATION_BLOCK_UNTIL) {
        setUiText(baseText);
        setTranslating(false);
        return;
      }

      const cacheKey = `${namespace}_${language}`;
      if (langCache[cacheKey]) {
        setUiText(langCache[cacheKey]);
        setTranslating(false);
        return;
      }

      try {
        // 🧠 Prompt to translate UI text only
        const prompt = `
You are a translation engine. 
Translate ONLY the text values (not keys) of this JSON object into "${language == "hi" ? "Hindi" : "English"}".
Do NOT modify object structure or JSON keys.
Return valid JSON only without markdown formatting.

JSON to translate:
${JSON.stringify(baseText)}
        `;

        const result = await chatSession.sendMessage(prompt);
        const respText = await result.response.text();

        const match = respText.match(/{[\s\S]*}/);
        const parsed = match ? JSON.parse(match[0]) : baseText;

        if (!cancelled) {
          setUiText(parsed);
          langCache[cacheKey] = parsed;
        }
      } catch (err) {
        const msg = String(err?.message || "");
        console.error("❌ UI auto-translate error:", namespace, err);

        // 🔴 Quota exceeded → block API for 5 minutes
        if (msg.includes("429") || msg.includes("quota")) {
          UI_TRANSLATION_BLOCK_UNTIL = Date.now() + 5 * 60 * 1000;
        }

        if (!cancelled) setUiText(baseText);
      } finally {
        if (!cancelled) setTranslating(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [language, namespace, JSON.stringify(baseText)]);

  return {
    t: (key) => uiText[key] || baseText[key] || key,
    language,
    translating,
  };
}
