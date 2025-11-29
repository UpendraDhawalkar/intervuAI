"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { db } from "@/utils/db";
import { CustomInterviewQnA } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { chatSession } from "@/utils/GeminiAIModel";

const LANG_KEY = "appLanguage";

export default function CustomQuestionsDetailPage() {
  const params = useParams(); // ✅ Next 15 style
  const id = params?.id; // /dashboard/custom-questions/[id]
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [qaList, setQaList] = useState([]); // original English Q&A
  const [translatedQaList, setTranslatedQaList] = useState(null); // translated version
  const [language, setLanguage] = useState("en");
  const [translating, setTranslating] = useState(false);
  const [meta, setMeta] = useState(null); // domain/skills/experience

  // 1) Language load + listener (Header dropdown se sync)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem(LANG_KEY) || "en";
    setLanguage(saved);

    const handler = () => {
      const newLang = window.localStorage.getItem(LANG_KEY) || "en";
      setLanguage(newLang);
    };

    window.addEventListener("app-language-change", handler);
    return () => window.removeEventListener("app-language-change", handler);
  }, []);

  // 2) DB se custom Q&A laana (original English)
  useEffect(() => {
    const run = async () => {
      try {
        if (!id) return;

        setLoading(true);

        const rows = await db
          .select()
          .from(CustomInterviewQnA)
          .where(eq(CustomInterviewQnA.id, Number(id)));

        if (!rows || !rows[0]) {
          setQaList([]);
          return;
        }

        const row = rows[0];

        let parsed = [];
        try {
          parsed = JSON.parse(row.jsonQnA || "[]");
        } catch (e) {
          console.error("❌ Failed to parse jsonQnA:", e);
        }

        setQaList(parsed);
        setMeta({
          domain: row.domain,
          skills: row.skills,
          experience: row.experience,
        });
      } catch (err) {
        console.error("❌ Error loading custom Q&A:", err);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [id]);

  // 3) Q&A auto-translate jab language ya qaList change ho
  useEffect(() => {
    const run = async () => {
      if (language === "en") {
        // English pe hamesha original hi dikhayenge
        setTranslatedQaList(null);
        return;
      }

      if (!qaList || qaList.length === 0) return;
      if (typeof window === "undefined") return;

      const cacheKey = `customQnA_${id}_${language}`;

      // 🔁 Cache check, taaki baar-baar translate na ho
      if (
        window.__qaTranslateCache &&
        window.__qaTranslateCache[cacheKey]
      ) {
        setTranslatedQaList(window.__qaTranslateCache[cacheKey]);
        return;
      }

      try {
        setTranslating(true);

        const jsonString = JSON.stringify(qaList, null, 2);

        const prompt = `
You are a professional translator.

Translate the following interview questions and answers to ${
          language === "hi" ? "Hindi" : "English"
        }.

IMPORTANT:
- The input is a JSON array.
- KEEP THE STRUCTURE EXACTLY THE SAME.
- Only translate the text in "Question" and "Answer" fields.
- Do NOT change keys or add any new fields.
- Return ONLY valid JSON, no backticks, no explanation.

JSON:
${jsonString}
`;

        const result = await chatSession.sendMessage(prompt);
        const raw = await result.response.text();
        console.log("🟢 Q&A translation raw:", raw);

        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          const match = raw.match(/```json\s*([\s\S]*?)```/i);
          if (match && match[1]) {
            parsed = JSON.parse(match[1]);
          } else {
            throw e;
          }
        }

        setTranslatedQaList(parsed);

        window.__qaTranslateCache = window.__qaTranslateCache || {};
        window.__qaTranslateCache[cacheKey] = parsed;
      } catch (err) {
        console.error("❌ Error translating Q&A:", err);
        setTranslatedQaList(null); // fallback: at least English
      } finally {
        setTranslating(false);
      }
    };

    run();
  }, [language, qaList, id]);

  const items =
    language === "en" || !translatedQaList ? qaList : translatedQaList;

  if (loading) {
    return (
      <div className="p-10 text-gray-900 dark:text-gray-100">
        Loading custom questions...
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="p-10 text-gray-900 dark:text-gray-100">
        No questions found for this set.
      </div>
    );
  }

  return (
    <div className="p-10 text-gray-900 dark:text-gray-100">
      <div className="flex items-center gap-3 mb-3">
        <h1 className="text-2xl font-bold">
          {meta?.domain || "Custom Questions"}
        </h1>
        {translating && (
          <span className="text-xs text-gray-500 animate-pulse">
            Translating questions...
          </span>
        )}
      </div>

      {meta && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          <span className="font-medium">Skills:</span> {meta.skills} |{" "}
          <span className="font-medium">Experience:</span>{" "}
          {meta.experience} years
        </p>
      )}

      <div className="space-y-4">
        {items.map((qa, index) => (
          <div
            key={index}
            className="border rounded-xl p-4 bg-card dark:border-gray-700"
          >
            <p className="text-xs text-gray-400 mb-1">
              Question #{index + 1}
            </p>
            <h2 className="font-semibold mb-2">{qa.Question}</h2>
            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
              {qa.Answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
