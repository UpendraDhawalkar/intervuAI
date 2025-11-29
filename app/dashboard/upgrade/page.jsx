"use client";

import React from "react";
import PricingPlan from "../_data/PricingPlan";
import { useUser } from "@clerk/nextjs";
import { useTranslatedText } from "@/lib/useTranslatedText";

// Base English UI text
const BASE_TEXT = {
  usersIncluded: "users included",
  ofStorage: "of storage",
  emailSupport: "Email support",
  helpCenterAccess: "Help center access",
  getStarted: "Get Started",
};

function Upgrade() {
  const { user } = useUser();

  // 🔥 Auto-translate with global language (from Header dropdown)
  const { t, translating } = useTranslatedText(BASE_TEXT, "upgradePage");

  return (
    <div className="p-10 text-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex justify-end mb-2">
          {translating && (
            <span className="text-xs text-gray-500 animate-pulse">
              Translating UI...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-center md:gap-8">
          {PricingPlan.map((item, index) => (
            <div
              key={index}
              className="
                rounded-2xl border p-6 shadow-xs sm:px-8 lg:p-12
                bg-white text-gray-900
                dark:bg-[#0f172a] dark:text-gray-100 dark:border-gray-700
                transition-all duration-300
              "
            >
              {/* Header / Price */}
              <div className="text-center">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {item.name}
                  <span className="sr-only">Plan</span>
                </h2>

                <p className="mt-2 sm:mt-4">
                  <strong className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
                    ₹ {item.price}
                  </strong>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    /{item.duration}
                  </span>
                </p>
              </div>

              {/* Features */}
              <ul className="mt-6 space-y-2">
                {/* Users included */}
                <li className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-5 text-indigo-700 dark:text-indigo-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    {item.user} {t("usersIncluded")}
                  </span>
                </li>

                {/* Storage */}
                <li className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-5 text-indigo-700 dark:text-indigo-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    {item.storage} {t("ofStorage")}
                  </span>
                </li>

                {/* Email support */}
                <li className="flex items-center gap-1">
                  {item.duration === "Yearly" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-5 text-green-600 dark:text-green-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-5 text-red-600 dark:text-red-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("emailSupport")}
                  </span>
                </li>

                {/* Help center access */}
                <li className="flex items-center gap-1">
                  {item.duration === "Yearly" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-5 text-green-600 dark:text-green-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-5 text-red-600 dark:text-red-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("helpCenterAccess")}
                  </span>
                </li>
              </ul>

              {/* CTA Button */}
              <a
                href={`${item.link}?prefilled_email=${encodeURIComponent(
                  user?.primaryEmailAddress?.emailAddress || ""
                )}`}
                target="_blank"
                className="
                  mt-8 block rounded-full border px-12 py-3 text-center text-sm font-medium
                  border-indigo-600 bg-white text-indigo-600
                  hover:ring-1 hover:ring-indigo-600
                  dark:bg-transparent dark:text-indigo-400 dark:border-indigo-400 dark:hover:ring-indigo-400
                  focus:outline-hidden focus:ring-2 focus:ring-indigo-600
                  transition-all duration-300
                "
              >
                {t("getStarted")}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Upgrade;
