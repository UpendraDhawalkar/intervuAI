"use client";

import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import { desc, eq } from "drizzle-orm";
import React, { useEffect, useState } from "react";
import InterviewItemCard from "./InterviewItemCard";
import { useTranslatedText } from "@/lib/useTranslatedText";

// 🔤 Base English UI text
const BASE_TEXT = {
  title: "Previous Mock Interview",
  noData: "No previous interview found. Try creating a new one!",
};

function InterviewList() {
  const { user } = useUser();
  const [interviewList, setInterviewList] = useState([]);

  // 🌍 Real-time translation hook
  const { t, translating } = useTranslatedText(BASE_TEXT, "interviewList");

  useEffect(() => {
    if (user) GetInterviewList();
  }, [user]);

  const GetInterviewList = async () => {
    try {
      const result = await db
        .select()
        .from(MockInterview)
        .where(eq(MockInterview.createdBy, user?.primaryEmailAddress?.emailAddress))
        .orderBy(desc(MockInterview.id));

      setInterviewList(result);
    } catch (error) {
      console.error("Error fetching interview list:", error);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2">
        <h2 className="font-medium text-xl text-gray-800 dark:text-gray-200">
          {t("title")}
        </h2>

        {/* Translation indicator */}
        {translating && (
          <span className="text-xs text-gray-500 animate-pulse">
            Translating...
          </span>
        )}
      </div>

      {interviewList?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 my-3">
          {interviewList.map((interview) => (
            <InterviewItemCard interview={interview} key={interview.mockId} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          {t("noData")}
        </p>
      )}
    </div>
  );
}

export default InterviewList;
