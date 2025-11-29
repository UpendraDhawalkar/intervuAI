"use client";

import { useRouter, useParams } from "next/navigation";
import { useTranslatedText } from "@/lib/useTranslatedText"; // 👈 auto-translate hook import

const experiences = [
  { label: "0-2 Years", slug: "0-2" },
  { label: "3-5 Years", slug: "3-5" },
  { label: "5-10 Years", slug: "5-10" },
];

// 🔤 English base text
const BASE_TEXT = {
  selectExperience: "Select Experience for",
};

export default function ExperiencePage() {
  const router = useRouter();
  const { domain } = useParams();

  // 🔥 translation hook
  const { t, translating } = useTranslatedText(BASE_TEXT, "experiencePage");

  const formattedDomain =
    typeof domain === "string" ? domain.replaceAll("-", " ") : domain;

  return (
    <div className="p-10 text-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-center capitalize">
          {t("selectExperience")} {formattedDomain}
        </h1>

        {/* Show "Translating..." while UI changes */}
        {translating && (
          <span className="text-xs text-gray-500 animate-pulse">
            Translating UI...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {experiences.map((exp) => (
          <div
            key={exp.slug}
            onClick={() =>
              router.push(`/dashboard/questions/${domain}/${exp.slug}`)
            }
            className="
              cursor-pointer border p-6 rounded-xl text-center
              bg-card
              border-gray-200 hover:bg-indigo-50
              dark:border-gray-700 dark:hover:bg-indigo-950
              transition-all
            "
          >
            <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400">
              {exp.label} {/* Isko translate nahi karenge (number remains universal) */}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}
