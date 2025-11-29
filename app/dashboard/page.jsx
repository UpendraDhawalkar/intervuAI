"use client";

import React from "react";
import AddNewInterview from "./_components/AddNewInterview";
import InterviewList from "./_components/InterviewList";
import DashboardCustomQnAList from "./_components/DashboardCustomQnAList";
import { useTranslatedText } from "@/lib/useTranslatedText";

// ✅ Saare English texts yaha define
const BASE_TEXT = {
  headingDashboard: "Dashboard",
  subheading:
    "Create and start your AI mock interview and keep practicing to improve.",
  sectionCreateTitle: "Create New Interview",
  sectionPreviousTitle: "Previous Mock Interviews",
  sectionCustomTitle: "Your Custom Q&A Sets",
};

function Dashboard() {
  const { t, translating } = useTranslatedText(BASE_TEXT, "dashboardPage");

  return (
    <div className="p-10 text-gray-900 dark:text-gray-100">
      <div className="flex items-center gap-3 mb-1">
        <h2 className="font-bold text-2xl">{t("headingDashboard")}</h2>
        {translating && (
          <span className="text-xs text-gray-500 animate-pulse">
            Translating UI...
          </span>
        )}
      </div>

      <h2 className="text-gray-500 dark:text-gray-400 mb-4">
        {t("subheading")}
      </h2>

      {/* Create New Interview */}
      <div className="my-2">
        <h3 className="font-semibold mb-2">{t("sectionCreateTitle")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3">
          <AddNewInterview />
        </div>
      </div>

      {/* Previous Mock Interviews */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">{t("sectionPreviousTitle")}</h3>
        <InterviewList />
      </div>

      {/* Custom Q&A Sets */}
      <div className="mt-10">
        <h3 className="font-semibold mb-2">{t("sectionCustomTitle")}</h3>
        <DashboardCustomQnAList />
      </div>
    </div>
  );
}

export default Dashboard;
