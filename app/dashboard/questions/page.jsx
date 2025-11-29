"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle } from "lucide-react";
import { chatSession } from "@/utils/GeminiAIModel";
import { db } from "@/utils/db";
import { CustomInterviewQnA } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import { eq, desc } from "drizzle-orm";
import { useTranslatedText } from "@/lib/useTranslatedText";

const BASE_TEXT = {
  selectDomainTitle: "Select Your Domain",
  createCustomTitle: "Create Custom Q&A Based on Your Profile",
  createCustomDesc:
    "Generate personalized interview questions & answers based on your domain, skills and work experience.",
  createCustomButton: "+ Create Custom Question Set",
  dialogTitle: "Custom Question Set Details",
  dialogDesc:
    "Questions will be generated on the basis of domain, skills and experience.",
  labelDomain: "Domain / Role",
  placeholderDomain: "Ex. Full Stack Developer",
  labelSkills: "Skills / Tech Stack",
  placeholderSkills: "Ex. React, Node.js, MongoDB, REST APIs",
  labelExp: "Work Experience (years)",
  placeholderExp: "Ex. 2",
  btnCancel: "Cancel",
  btnGenerate: "Generate Q&A",
  generating: "Generating Q&A...",
  yourSetsTitle: "Your Custom Question Sets",
  yourSetsDesc:
    "These sets are created from your filled domains, skills and experience.",
  expLabel: "Experience",
  years: "years",
};

const domains = [
  { name: "Full Stack Developer", slug: "fullstack" },
  { name: "Web Developer", slug: "webdeveloper" },
  { name: "Data Analyst", slug: "dataanalyst" },
  { name: "Artificial Intelligence", slug: "ai" },
  { name: "Machine Learning", slug: "ml" },
];

export default function QuestionsPage() {
  const router = useRouter();
  const { user } = useUser();

  // 🔥 auto-translate hook
  const { t, translating } = useTranslatedText(BASE_TEXT, "questionsPage");

  const [openDialog, setOpenDialog] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [customSkills, setCustomSkills] = useState("");
  const [customExperience, setCustomExperience] = useState("");
  const [loading, setLoading] = useState(false);

  const [customConfigs, setCustomConfigs] = useState([]);

  const handleDomainClick = (domain) => {
    router.push(`/dashboard/questions/${domain.slug}`);
  };

  const onSubmitCustom = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login first.");
      return;
    }

    try {
      setLoading(true);

      const count = process.env.NEXT_PUBLIC_CUSTOM_QA_COUNT || 8;

      const inputPrompt = `
I want interview questions and answers for this profile:

Domain/Role: ${customDomain}
Skills/Tech Stack: ${customSkills}
Years of Experience: ${customExperience}

Generate ${count} INTERVIEW QUESTIONS WITH ANSWERS.
Return STRICTLY a JSON array where each item is:
{
  "Question": "question text",
  "Answer": "detailed answer text"
}
`;

      const result = await chatSession.sendMessage(inputPrompt);
      const fullResponseText = await result.response.text();
      console.log("🟢 Raw model response (custom Q&A):", fullResponseText);

      const jsonRegex = /```json\s*([\s\S]*?)\s*```/m;
      const match = fullResponseText.match(jsonRegex);

      let jsonText;
      if (match && match[1]) {
        jsonText = match[1].trim();
      } else {
        jsonText = fullResponseText.trim();
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (err) {
        console.error("❌ JSON parse error:", err);
        alert("AI response JSON format me nahi tha. Console check karo.");
        setLoading(false);
        return;
      }

      const resp = await db
        .insert(CustomInterviewQnA)
        .values({
          domain: customDomain,
          skills: customSkills,
          experience: String(customExperience),
          jsonQnA: JSON.stringify(parsed),
          createdBy: user?.primaryEmailAddress?.emailAddress,
          createdAt: new Date().toISOString(),
        })
        .returning({ id: CustomInterviewQnA.id });

      console.log("Inserted custom Q&A ID resp:", resp);

      const newId = resp[0]?.id;
      if (!newId) {
        throw new Error("Insert failed: no id returned");
      }

      setCustomConfigs((prev) => [
        {
          id: newId,
          domain: customDomain,
          skills: customSkills,
          experience: customExperience,
        },
        ...prev,
      ]);

      setOpenDialog(false);
      setCustomDomain("");
      setCustomSkills("");
      setCustomExperience("");

      router.push(`/dashboard/custom-questions/${newId}`);
    } catch (err) {
      console.error("❌ Error generating/saving custom Q&A:", err);
      alert("Custom questions generate karte time error aaya.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    const fetchCustomConfigs = async () => {
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
        }));

        setCustomConfigs(mapped);
      } catch (err) {
        console.error("Error fetching custom Q&A configs:", err);
      }
    };

    fetchCustomConfigs();
  }, [user?.primaryEmailAddress?.emailAddress]);

  return (
    <div className="p-10 text-gray-900 dark:text-gray-100">
      {/* 1. Select Your Domain */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-center flex-1">
          {t("selectDomainTitle")}
        </h1>
        {translating && (
          <span className="text-xs text-gray-500 animate-pulse">
            Translating UI...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {domains.map((domain) => (
          <div
            key={domain.slug}
            onClick={() => handleDomainClick(domain)}
            className="
              cursor-pointer border rounded-xl p-6 text-center 
              bg-card 
              border-gray-200 hover:bg-indigo-50 
              dark:border-gray-700 dark:hover:bg-indigo-950 
              transition-all
            "
          >
            <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400">
              {domain.name}
            </h2>
          </div>
        ))}
      </div>

      {/* 2. Custom Q&A creator */}
      <div className="mt-4 mb-6">
        <h2 className="text-xl font-semibold mb-3">
          {t("createCustomTitle")}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          {t("createCustomDesc")}
        </p>

        <div
          className="
            border rounded-xl p-5 cursor-pointer max-w-md
            bg-secondary 
            border-gray-200 hover:shadow-md hover:scale-[1.01]
            dark:border-gray-700
            transition-all
          "
          onClick={() => setOpenDialog(true)}
        >
          <h3 className="text-center font-medium">
            {t("createCustomButton")}
          </h3>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {t("dialogTitle")}
            </DialogTitle>
            <DialogDescription>{t("dialogDesc")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmitCustom} className="mt-4">
            <div className="my-3">
              <label className="text-sm font-medium">
                {t("labelDomain")}
              </label>
              <Input
                placeholder={t("placeholderDomain")}
                required
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
              />
            </div>

            <div className="my-3">
              <label className="text-sm font-medium">
                {t("labelSkills")}
              </label>
              <Textarea
                placeholder={t("placeholderSkills")}
                required
                value={customSkills}
                onChange={(e) => setCustomSkills(e.target.value)}
              />
            </div>

            <div className="my-3">
              <label className="text-sm font-medium">
                {t("labelExp")}
              </label>
              <Input
                type="number"
                min="0"
                max="30"
                placeholder={t("placeholderExp")}
                required
                value={customExperience}
                onChange={(e) => setCustomExperience(e.target.value)}
              />
            </div>

            <div className="flex gap-4 justify-end mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenDialog(false)}
              >
                {t("btnCancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoaderCircle className="animate-spin mr-2" />
                    {t("generating")}
                  </>
                ) : (
                  t("btnGenerate")
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Custom cards */}
      {customConfigs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">
            {t("yourSetsTitle")}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {t("yourSetsDesc")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {customConfigs.map((cfg) => (
              <div
                key={cfg.id}
                className="
                  border rounded-xl p-4 cursor-pointer 
                  bg-card 
                  border-gray-200 hover:shadow-md 
                  dark:border-gray-700
                  transition-all
                "
                onClick={() =>
                  router.push(`/dashboard/custom-questions/${cfg.id}`)
                }
              >
                <h3 className="font-semibold text-indigo-700 dark:text-indigo-400">
                  {cfg.domain}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {cfg.skills}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t("expLabel")}: {cfg.experience} {t("years")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
