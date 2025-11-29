"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/utils/db";
import { CustomInterviewQnA } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import { eq, desc } from "drizzle-orm";
import { useRouter } from "next/navigation";
import { useTranslatedText } from "@/lib/useTranslatedText";

// 🔤 Base English UI text
const BASE_TEXT = {
  loading: "Loading your custom question sets...",
  empty: "You have not created any custom question sets yet.",
  title: "Your Custom Question Sets",
  desc: "These are generated from your domain, skills and experience.",
  experience: "Experience",
  createdAt: "Created At",
};

function DashboardCustomQnAList() {
  const { user } = useUser();
  const router = useRouter();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 real-time translation hook
  const { t, translating } = useTranslatedText(BASE_TEXT, "dashboardCustomSets");

  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    const fetchSets = async () => {
      try {
        const email = user.primaryEmailAddress.emailAddress;

        const rows = await db
          .select()
          .from(CustomInterviewQnA)
          .where(eq(CustomInterviewQnA.createdBy, email))
          .orderBy(desc(CustomInterviewQnA.createdAt));

        const mapped = rows.map((row) => ({
          id: row.id,
          domain: row.domain,
          skills: row.skills,
          experience: row.experience,
          createdAt: row.createdAt,
        }));

        setSets(mapped);
      } catch (err) {
        console.error("Error fetching custom Q&A sets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, [user?.primaryEmailAddress?.emailAddress]);

  if (loading) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        {t("loading")}
      </p>
    );
  }

  if (!sets.length) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        {t("empty")}
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="font-medium text-xl mb-2">{t("title")}</h2>
        {translating && (
          <span className="text-xs text-gray-500 animate-pulse">
            Translating UI...
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {t("desc")}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sets.map((set) => (
          <div
            key={set.id}
            className="border rounded-lg p-4 bg-card dark:bg-gray-800 dark:border-gray-700 hover:shadow-md cursor-pointer transition-all"
            onClick={() => router.push(`/dashboard/custom-questions/${set.id}`)}
          >
            <h3 className="font-semibold text-indigo-700 dark:text-indigo-400">
              {set.domain}
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1 line-clamp-2">
              {set.skills}
            </p>

            <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">
              {t("experience")}: {set.experience} years
            </p>

            {set.createdAt && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                {t("createdAt")}:{" "}
                {(() => {
                  const d = new Date(set.createdAt);
                  if (isNaN(d.getTime())) return set.createdAt;
                  return d.toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "medium",
                    timeStyle: "short",
                  });
                })()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardCustomQnAList;
