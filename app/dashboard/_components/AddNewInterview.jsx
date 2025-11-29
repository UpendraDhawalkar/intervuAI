"use client";
import React, { useState } from "react";
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
import { chatSession } from "@/utils/GeminiAIModel";
import { LoaderCircle } from "lucide-react";
import { MockInterview } from "@/utils/schema";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@clerk/nextjs";
import { db } from "@/utils/db";
import { useRouter } from "next/navigation";
import { useTranslatedText } from "@/lib/useTranslatedText";

// 🔤 Base English UI text
const BASE_TEXT = {
  addNewCard: "+ Add New",
  dialogTitle: "Tell us more about your job interview",
  dialogDesc: "Please provide details about your job role and experience.",
  labelJobRole: "Job Role / Job Position",
  placeholderJobRole: "Ex. Full Stack Developer",
  labelJobDesc: "Job Description / Tech Stack",
  placeholderJobDesc: "Ex. React, Node.js, MongoDB",
  labelExperience: "Years of Experience",
  placeholderExperience: "Ex. 2",
  btnCancel: "Cancel",
  btnStart: "Start Interview",
  generating: "Generating...",
  aiError: "AI response format issue. Try again!",
};

function AddNewInterview() {
  const [openDialog, setOpenDialog] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { user } = useUser();

  // 🔥 Auto-translate UI + get current language
  const { t, translating, language } = useTranslatedText(
    BASE_TEXT,
    "addNewInterview"
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const langInstruction =
        language === "hi"
          ? `
IMPORTANT:
- All questions AND answers must be in Hindi.
- Do NOT mix English except for code, library, or API names.
`
          : `
IMPORTANT:
- All questions AND answers must be in English.
- Do NOT mix any other language.
`;

      const inputPrompt = `
You are an expert technical interviewer.

Job Position: ${jobPosition}
Job Description / Tech Stack: ${jobDesc}
Years of Experience: ${jobExperience}

Generate ${
        process.env.NEXT_PUBLIC_INTERVIEW_QUESTION_COUNT || 8
      } interview questions WITH detailed answers.

Return STRICTLY a JSON array where each item is:
{
  "Question": "question text",
  "Answer": "detailed answer text"
}

${langInstruction}
      `;

      const result = await chatSession.sendMessage(inputPrompt);
      const fullResponseText = await result.response.text();
      console.log("🟢 Mock interview raw response:", fullResponseText);

      // Code block ke andar ho to nikal lo
      const jsonRegex = /```json\s*([\s\S]*?)```/m;
      const match = fullResponseText.match(jsonRegex);

      const mockJsonResp = match?.[1]?.trim() || fullResponseText.trim();

      const resp = await db
        .insert(MockInterview)
        .values({
          mockId: uuidv4(),
          jsonMockResp: mockJsonResp,
          jobPosition,
          jobDesc,
          jobExperience,
          createdBy: user?.primaryEmailAddress?.emailAddress,
          createdAt: new Date().toISOString(),
        })
        .returning({ mockId: MockInterview.mockId });

      if (resp?.[0]?.mockId) {
        setOpenDialog(false);
        router.push(`/dashboard/interview/${resp[0].mockId}`);
      }
    } catch (err) {
      console.error("❌ Error:", err);
      alert(t("aiError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Add New Interview Card */}
      <div
        className="p-10 border rounded-lg bg-secondary dark:bg-gray-800 hover:scale-105 hover:shadow-md cursor-pointer transition-all text-gray-900 dark:text-gray-100 flex items-center justify-center"
        onClick={() => setOpenDialog(true)}
      >
        <h2 className="text-lg text-center">{t("addNewCard")}</h2>
      </div>

      {/* Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">
                {t("dialogTitle")}
              </DialogTitle>
              {translating && (
                <span className="text-xs text-gray-500 animate-pulse">
                  Translating UI...
                </span>
              )}
            </div>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {t("dialogDesc")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit}>
            <div className="mt-7 my-3">
              <label className="text-sm font-medium">
                {t("labelJobRole")}
              </label>
              <Input
                placeholder={t("placeholderJobRole")}
                required
                value={jobPosition}
                onChange={(event) => setJobPosition(event.target.value)}
                className="dark:bg-gray-800"
              />
            </div>
            <div className="my-3">
              <label className="text-sm font-medium">
                {t("labelJobDesc")}
              </label>
              <Textarea
                placeholder={t("placeholderJobDesc")}
                required
                value={jobDesc}
                onChange={(event) => setJobDesc(event.target.value)}
                className="dark:bg-gray-800"
              />
            </div>
            <div className="my-3">
              <label className="text-sm font-medium">
                {t("labelExperience")}
              </label>
              <Input
                type="number"
                max="30"
                placeholder={t("placeholderExperience")}
                required
                value={jobExperience}
                onChange={(event) => setJobExperience(event.target.value)}
                className="dark:bg-gray-800"
              />
            </div>

            <div className="flex gap-5 justify-end mt-6">
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
                  t("btnStart")
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AddNewInterview;
