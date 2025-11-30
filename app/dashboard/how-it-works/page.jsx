"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslatedText } from "@/lib/useTranslatedText";
import { chatSession } from "@/utils/GeminiAIModel";

const BASE_TEXT = {
  heading: "How It Works",
  clickToZoom: "Click to Zoom",
  viewProjectSetup: "View Project Setup Guide →",
};

const steps = [
  {
    id: "signup",
    title: "1. Sign Up",
    image: "/screenshots/signup.png",
    description:
      "Create your account using your email or Google sign-in to get started with your mock interview journey.",
  },
  {
    id: "signin",
    title: "2. Sign In",
    image: "/screenshots/signin.png",
    description:
      "Log in securely to access your personalized dashboard and all interview tools anytime.",
  },
  {
    id: "dashboard",
    title: "3. Dashboard",
    image: "/screenshots/dashboard.png",
    description:
      "Get a complete overview of your mock interviews, track your progress, and revisit past feedback and performance insights.",
  },
  {
    id: "create_mock",
    title: "4. Create New Mock Interview",
    image: "/screenshots/create_mock.png",
    description:
      "Start a new interview by selecting your preferred role, experience level, and domain to generate relevant questions.",
  },
  {
    id: "get_started",
    title: "5. Let’s Get Started",
    image: "/screenshots/get_started.png",
    description:
      "Review your selections and click ‘Get Started’ to begin your interactive mock interview.",
  },
  {
    id: "interview",
    title: "6. Interview Page",
    image: "/screenshots/interview.png",
    description:
      "Respond to each question verbally. The system records and analyzes your answers using AI to generate insights.",
  },
  {
    id: "feedback",
    title: "7. Feedback Page",
    image: "/screenshots/feedback.png",
    description:
      "Receive AI-based feedback for every question — including performance scores, tone analysis, and improvement tips.",
  },
  {
    id: "questions",
    title: "8. Question Selection (Domain)",
    image: "/screenshots/quesDomain.png",
    description:
      "Choose your preferred domain (like Frontend, Backend, Data Science, etc.) — questions are generated specifically for your selection.",
  },
  {
    id: "questions1",
    title: "9. Questions Section (Experience)",
    image: "/screenshots/queExperience.png",
    description:
      "Select your experience level (0–2, 2–5, or 5+ years). The difficulty and depth of questions adapt to your level.",
  },
  {
    id: "questions2",
    title: "10. Questions Section (Questions with Answers)",
    image: "/screenshots/QuesAns.png",
    description:
      "Preview the set of interview questions along with model answers before starting your session to get familiar with what’s coming.",
  },
  {
    id: "upgrade",
    title: "11. Upgrade",
    image: "/screenshots/upgrade.png",
    description:
      "Unlock premium features like unlimited interviews, detailed analytics, advanced AI feedback, and career growth insights by upgrading your plan.",
  },
  {
    id: "payment",
    title: "12. Payment",
    image: "/screenshots/payment.png",
    description:
      "Securely complete your upgrade using multiple payment options to access all premium tools.",
  },
];

export default function HowItWorksPage() {
  const [zoomImage, setZoomImage] = useState(null);
  const [translatedSteps, setTranslatedSteps] = useState(null);
  const router = useRouter();

  const { t, translating, language } = useTranslatedText(
    BASE_TEXT,
    "howItWorksPage"
  );

  useEffect(() => {
    const translateSteps = async () => {
      if (language === "en") return setTranslatedSteps(null);

      const cacheKey = `howSteps_${language}`;
      if (window.translationCache?.[cacheKey]) {
        setTranslatedSteps(window.translationCache[cacheKey]);
        return;
      }

      try {
        const json = JSON.stringify(steps, ["title", "description"], 2);
        const prompt = `
You are a professional translator.
Translate ONLY the "title" and "description" fields to ${
          language === "hi" ? "Hindi" : "English"
        }.

The input is a JSON array. Keep it EXACTLY the same.
Do NOT translate image paths or IDs.
Return only valid JSON.

${json}
        `;

        const res = await chatSession.sendMessage(prompt);
        const text = await res.response.text();

        const parsed = JSON.parse(text);
        window.translationCache = window.translationCache || {};
        window.translationCache[cacheKey] = parsed;
        setTranslatedSteps(parsed);
      } catch (e) {
        console.error("Translation error:", e);
      }
    };

    translateSteps();
  }, [language]);

  const finalSteps = translatedSteps || steps;

  const handleScroll = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-6xl mx-auto text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl sm:text-4xl font-bold text-center text-primary mb-6 sm:mb-10">
        {t("heading")}
      </h1>

      {translating && (
        <p className="text-center text-xs sm:text-sm text-gray-500 animate-pulse mb-4">
          Translating UI...
        </p>
      )}

      {/* Top buttons */}
      <div className="flex flex-col gap-4 mb-8 sm:mb-12">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            {["dashboard", "questions", "upgrade"].map((btn) => (
              <button
                key={btn}
                onClick={() => handleScroll(btn)}
                className="px-4 py-2 text-sm sm:text-base bg-primary text-white rounded-lg hover:bg-primary/80 transition"
              >
                {btn.charAt(0).toUpperCase() + btn.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              router.push("/dashboard/how-it-works/project-setup")
            }
            className="w-full sm:w-auto md:ml-auto px-4 sm:px-5 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          >
            {t("viewProjectSetup")}
          </button>
        </div>
      </div>

      <hr className="border-gray-300 dark:border-gray-700 my-4 sm:my-6" />

      {/* Steps */}
      <div className="flex flex-col gap-12 sm:gap-14 md:gap-16">
        {finalSteps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              id={step.id}
              className={`flex flex-col md:flex-row items-center gap-8 sm:gap-10 ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* Image section */}
              <div className="w-full md:w-1/2">
                <div
                  className="relative cursor-zoom-in group"
                  onClick={() => setZoomImage(step.image)}
                >
                  <Image
                    src={step.image}
                    alt={step.title}
                    width={600}
                    height={400}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 70vw, 50vw"
                    className="w-full h-auto rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white dark:text-gray-200 text-xs sm:text-sm font-medium transition">
                    {t("clickToZoom")}
                  </div>
                </div>
              </div>

              {/* Text section */}
              <div className="w-full md:w-1/2">
                <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 text-center md:text-left">
                  {step.title}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed text-center md:text-left">
                  {step.description}
                </p>
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className="border-t border-gray-300 dark:border-gray-700 my-4 sm:my-6"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Zoom overlay */}
      {zoomImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4"
          onClick={() => setZoomImage(null)}
        >
          <Image
            src={zoomImage}
            alt="Zoomed Screenshot"
            width={900}
            height={600}
            sizes="100vw"
            className="max-h-[90vh] w-auto h-auto rounded-lg shadow-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
