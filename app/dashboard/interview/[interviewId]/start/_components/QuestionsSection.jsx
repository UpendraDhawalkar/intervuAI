"use client";

import { Lightbulb, Volume2 } from "lucide-react";
import React, { useEffect } from "react";
import { useTranslatedText } from "@/lib/useTranslatedText";

const BASE_TEXT = {
  noQuestions: "No questions loaded yet.",
  notesLabel: "Notes:",
  notesBody: process.env.NEXT_PUBLIC_QUESTION_NOTE || "",
  ttsNotSupported: "Sorry, your browser does not support text to speech",
};

function QuestionsSection({ mockInterviewQuestions, activeQuestionIndex }) {
  const { t, language } = useTranslatedText(BASE_TEXT, "questionsSection");

  // 🛑 Stop speech when question index changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
  }, [activeQuestionIndex]);

  const textToSpeech = (text) => {
    if (!text) return;
    if (typeof window === "undefined") return;

    // Stop old speech before speaking again
    window.speechSynthesis.cancel();

    if ("speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = language === "hi" ? "hi-IN" : "en-IN";
      window.speechSynthesis.speak(speech);
    } else {
      alert(t("ttsNotSupported"));
    }
  };

  const hasQuestions =
    Array.isArray(mockInterviewQuestions) && mockInterviewQuestions.length > 0;

  const activeQuestion = hasQuestions
    ? mockInterviewQuestions[activeQuestionIndex]?.Question
    : "";

  return (
    <div className="p-5 border rounded-lg my-10 bg-card shadow-sm">
      {/* Question Number Pills */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {hasQuestions ? (
          mockInterviewQuestions.map((_, index) => (
            <h2
              key={`question-${index}`}
              className={`px-3 py-2 rounded-full text-xs md:text-sm text-center cursor-pointer transition-all
                ${
                  activeQuestionIndex === index
                    ? "bg-primary text-white"
                    : "bg-muted dark:bg-gray-800 border border-border text-foreground hover:bg-muted/70"
                }`}
            >
              #{index + 1}
            </h2>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            {t("noQuestions")}
          </p>
        )}
      </div>

      {/* Active Question Text with Volume Below */}
      {hasQuestions && (
        <div className="mt-5">
          <h2 className="text-base md:text-lg text-foreground">
            {activeQuestion}
          </h2>

          {/* 🔽 Volume icon below */}
          <div className="flex justify-end mt-2">
            <Volume2
              className="cursor-pointer hover:text-primary transition flex-shrink-0"
              onClick={() => textToSpeech(activeQuestion)}
            />
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="border rounded-lg p-5 mt-10 bg-secondary dark:bg-gray-800">
        <h2 className="flex gap-3 items-center text-primary dark:text-yellow-400">
          <Lightbulb />
          <strong>{t("notesLabel")}</strong>
        </h2>
        <h2 className="text-sm text-gray-700 dark:text-gray-300 mt-2">
          {t("notesBody")}
        </h2>
      </div>
    </div>
  );
}

export default QuestionsSection;
