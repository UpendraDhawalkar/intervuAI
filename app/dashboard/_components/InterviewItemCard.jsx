"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React from "react";
import { useTranslatedText } from "@/lib/useTranslatedText";

const BASE_TEXT = {
  yearsOfExperience: "Years of Experience",
  createdAt: "Created At",
  feedback: "Feedback",
  start: "Start",
};

function InterviewItemCard({ interview }) {
  const router = useRouter();

  // 🔥 Translation hook
  const { t, translating } = useTranslatedText(BASE_TEXT, "interviewItemCard");

  const onStart = () => {
    router.push(`/dashboard/interview/${interview?.mockId}`);
  };

  const onFeedbackPress = () => {
    router.push(`/dashboard/interview/${interview?.mockId}/feedback`);
  };

  return (
    <div
      className="
        border shadow-sm rounded-lg p-3 
        bg-card 
        hover:shadow-md transition 
        dark:border-gray-700
      "
    >
      <h2 className="font-bold text-primary">{interview?.jobPosition}</h2>

      <h2 className="text-sm text-gray-600 dark:text-gray-300">
        {interview?.jobExperience} {t("yearsOfExperience")}
      </h2>

      <h2 className="text-xs text-gray-400 dark:text-gray-500">
        {t("createdAt")}:{" "}
        {interview?.createdAt
          ? (() => {
              const d = new Date(interview.createdAt);
              return isNaN(d.getTime())
                ? interview.createdAt
                : d.toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "medium",
                    timeStyle: "short",
                  });
            })()
          : "N/A"}
      </h2>

      {translating && (
        <p className="text-[10px] text-gray-500 animate-pulse">
          Translating...
        </p>
      )}

      <div className="flex justify-between mt-2 gap-5">
        <Button
          size="sm"
          variant="outline"
          className="w-full dark:border-gray-600 dark:text-gray-200"
          onClick={onFeedbackPress}
        >
          {t("feedback")}
        </Button>

        <Button size="sm" className="w-full" onClick={onStart}>
          {t("start")}
        </Button>
      </div>
    </div>
  );
}

export default InterviewItemCard;
