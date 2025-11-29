"use client";
import { db } from "@/utils/db";
import { UserAnswer, MockInterview, UserVoilation } from "@/utils/schema";
import { eq, and, desc } from "drizzle-orm";
import React, { use, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useUser } from "@clerk/nextjs";
import { Eye, Download } from "lucide-react";
import { useTranslatedText } from "@/lib/useTranslatedText";
import { chatSession } from "@/utils/GeminiAIModel";

// 🔤 Saare static English text yahan rakhenge (base)
const BASE_TEXT = {
  noFeedback: "No Interview Feedback Record Found",
  reportTitle: "🎯 IntervuAI Report",
  sessionAnalysis: "Interview Session Analysis",
  emailLabel: "Email",
  interviewIdLabel: "Interview ID",
  dateLabel: "Date",
  positionLabel: "Position",
  experienceLabel: "Experience",
  overallRatingLabel: "Overall Rating",
  noteTitle: "👉 Note:",
  noteText:
    "Rating calculation: If rating for any answer is < 5 → 1 point, else 2 points.",
  violationsTitle: "⚠️ Violations Summary",
  timeLabel: "Time",
  notAvailable: "Not Available",
  faceAbsentLabel: "🙈 Face Absent",
  focusLostLabel: "👀 Focus Lost",
  unauthorizedItemsLabel: "🚫 Unauthorized Items",
  questionWiseLabel: "Question-wise Feedback:",
  ratingLabel: "Rating",
  yourAnswerLabel: "Your Answer",
  correctAnswerLabel: "Correct Answer",
  feedbackLabel: "Feedback",
  previewTitle: "📄 Report Preview",
  closeBtn: "Close",
  previewBtn: "Preview Report",
  downloadBtn: "Download Report",
  goHomeBtn: "Go Home",
};

// 🔁 Feedback Q&A translation cache global object
if (typeof window !== "undefined" && !window.__feedbackTranslateCache) {
  window.__feedbackTranslateCache = {};
}

function Feedback({ params }) {
  const resolvedParams = use(params);
  const interviewId = resolvedParams?.interviewId;

  const [feedbackList, setFeedbackList] = useState([]);
  const [translatedFeedbackList, setTranslatedFeedbackList] = useState(null); // translated Q&A
  const [overallRating, setOverallRating] = useState(0);
  const [interviewInfo, setInterviewInfo] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [violations, setViolations] = useState({
    face_absent: 0,
    focus_lost: 0,
    unauthorized_item: 0,
    createdAt: null,
  });

  const { user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress || "Not Available";
  const router = useRouter();
  const reportRef = useRef();

  // 🔥 Hook se UI text auto-translate hoga (Header dropdown ke hisaab se)
  const { t, translating, language } = useTranslatedText(
    BASE_TEXT,
    "feedbackPage"
  );

  useEffect(() => {
    if (!interviewId || !userEmail) return;
    GetFeedback();
    GetInterviewInfo();
    GetViolationsFromDB();
  }, [interviewId, userEmail]);

  const GetFeedback = async () => {
    try {
      const result = await db
        .select()
        .from(UserAnswer)
        .where(eq(UserAnswer.mockIdRef, interviewId))
        .orderBy(UserAnswer.id);

      const uniqueQuestions = result
        .filter(
          (item, index, self) =>
            index === self.findIndex((q) => q.question === item.question)
        )
        .slice(0, 5);

      let totalMarks = 0;
      uniqueQuestions.forEach((item) => {
        totalMarks += item.rating <= 5 ? 1 : 2;
      });

      setOverallRating(totalMarks);
      setFeedbackList(uniqueQuestions);
    } catch (error) {
      console.error("❌ Error fetching feedback:", error);
    }
  };

  const GetInterviewInfo = async () => {
    try {
      const result = await db
        .select()
        .from(MockInterview)
        .where(eq(MockInterview.mockId, interviewId));
      if (result.length > 0) setInterviewInfo(result[0]);
    } catch (error) {
      console.error("❌ Error fetching interview info:", error);
    }
  };

  const GetViolationsFromDB = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await db
        .select()
        .from(UserVoilation)
        .where(
          and(
            eq(UserVoilation.mockIdRef, interviewId),
            eq(UserVoilation.userEmail, userEmail)
          )
        )
        .orderBy(desc(UserVoilation.id))
        .limit(1);

      if (result.length > 0) {
        const v = result[0];
        setViolations({
          face_absent: v.faceAbsent || 0,
          focus_lost: v.focusLoss || 0,
          unauthorized_item: v.unAuthorizedItem || 0,
          createdAt: v.createdAt || null,
        });
      }
    } catch (error) {
      console.error("❌ Error fetching violation data:", error);
    }
  };

  // 🔁 Feedback Q&A ko bhi language ke hisaab se translate karo
  useEffect(() => {
    const run = async () => {
      // English pe hamesha original feedback
      if (language === "en") {
        setTranslatedFeedbackList(null);
        return;
      }

      if (!feedbackList || feedbackList.length === 0) return;
      if (typeof window === "undefined") return;

      const cacheKey = `feedback_${interviewId}_${language}`;

      // cache hit?
      if (
        window.__feedbackTranslateCache &&
        window.__feedbackTranslateCache[cacheKey]
      ) {
        setTranslatedFeedbackList(
          window.__feedbackTranslateCache[cacheKey]
        );
        return;
      }

      try {
        const minimal = feedbackList.map((item) => ({
          question: item.question,
          userAns: item.userAns,
          correctAns: item.correctAns,
          feedback: item.feedback,
          rating: item.rating,
        }));

        const jsonString = JSON.stringify(minimal, null, 2);

        const prompt = `
You are a professional translator.

Translate the following interview feedback data to ${
          language === "hi" ? "Hindi" : "English"
        }.

IMPORTANT:
- The input is a JSON array.
- KEEP THE STRUCTURE EXACTLY THE SAME.
- Only translate the text inside "question", "userAns", "correctAns" and "feedback" fields.
- Do NOT change keys or numeric values like "rating".
- Return ONLY valid JSON, no backticks, no explanation.

JSON:
${jsonString}
`;

        const result = await chatSession.sendMessage(prompt);
        const raw = await result.response.text();
        console.log("🟢 Feedback Q&A translation raw:", raw);

        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          const match = raw.match(/```json\s*([\s\S]*?)```/i);
          if (match && match[1]) {
            parsed = JSON.parse(match[1]);
          } else {
            throw e;
          }
        }

        // original feedbackList me id, mockIdRef etc ho sakte hain
        // unko preserve karne ke liye merge kar rahe
        const merged = feedbackList.map((orig, idx) => ({
          ...orig,
          ...parsed[idx],
        }));

        setTranslatedFeedbackList(merged);

        window.__feedbackTranslateCache =
          window.__feedbackTranslateCache || {};
        window.__feedbackTranslateCache[cacheKey] = merged;
      } catch (err) {
        console.error("❌ Error translating feedback Q&A:", err);
        setTranslatedFeedbackList(null);
      }
    };

    run();
  }, [language, feedbackList, interviewId]);

  const handleDownloadReport = async () => {
    const report = reportRef.current;
    if (!report) return;

    const canvas = await html2canvas(report, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Interview_Report_${interviewInfo?.jobPosition || "User"}.pdf`);
  };

  // 👇 Yahi se UI me konsa list dikhana hai decide hoga
  const items =
    language === "en" || !translatedFeedbackList
      ? feedbackList
      : translatedFeedbackList;

  return (
    <div className="p-10 text-gray-900 dark:text-gray-100">
      {items?.length === 0 ? (
        <h2 className="font-bold text-xl text-gray-500 dark:text-gray-300">
          {t("noFeedback")}
        </h2>
      ) : (
        <>
          <div
            ref={reportRef}
            className="
              p-6 rounded-lg shadow-sm border 
              bg-white text-gray-900
              dark:bg-[#0f172a] dark:text-gray-100 dark:border-gray-700
              transition-all duration-300
            "
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-center flex-1">
                <h1 className="text-4xl font-bold">{t("reportTitle")}</h1>
                <h2 className="font-semibold mt-1">
                  {t("sessionAnalysis")}
                </h2>
              </div>
              {translating && (
                <span className="text-xs text-gray-500 animate-pulse">
                  Translating UI...
                </span>
              )}
            </div>

            <hr className="my-4 border-gray-300 dark:border-gray-700" />

            <div className="text-sm pb-3">
              <p>
                <strong>{t("emailLabel")}:</strong> {userEmail}
              </p>
              <p>
                <strong>{t("interviewIdLabel")}:</strong> {interviewId}
              </p>
              <p>
                <strong>{t("dateLabel")}:</strong>{" "}
                {interviewInfo?.createdAt
                  ? new Date(interviewInfo.createdAt).toLocaleString()
                  : t("notAvailable")}
              </p>
              <p>
                <strong>{t("positionLabel")}:</strong>{" "}
                {interviewInfo?.jobPosition}
              </p>
              <p>
                <strong>{t("experienceLabel")}:</strong>{" "}
                {interviewInfo?.jobExperience}
              </p>
            </div>

            <h2 className="text-primary text-lg my-3">
              {t("overallRatingLabel")}:{" "}
              <strong>{overallRating}/10</strong>
            </h2>

            <div className="mt-5 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900 dark:text-yellow-200">
              <h3 className="font-semibold mb-2">{t("noteTitle")}</h3>
              <p>{t("noteText")}</p>
            </div>

            <div className="mt-5 p-4 rounded-lg bg-red-50 dark:bg-red-900 dark:text-red-200">
              <h3 className="font-semibold mb-2">
                {t("violationsTitle")}
              </h3>
              <p>
                {t("timeLabel")}:{" "}
                {violations.createdAt
                  ? (() => {
                      const dateValue =
                        typeof violations.createdAt === "string"
                          ? violations.createdAt
                          : violations.createdAt.toISOString();

                      return dateValue.replace("T", " ").split(".")[0];
                    })()
                  : t("notAvailable")}
              </p>
              <ul>
                <li>
                  {t("faceAbsentLabel")}:{" "}
                  <strong>{violations.face_absent}</strong>
                </li>
                <li>
                  {t("focusLostLabel")}:{" "}
                  <strong>{violations.focus_lost}</strong>
                </li>
                <li>
                  {t("unauthorizedItemsLabel")}:{" "}
                  <strong>{violations.unauthorized_item}</strong>
                </li>
              </ul>
            </div>

            <h2 className="text-sm mt-6 mb-3">
              {t("questionWiseLabel")}
            </h2>
            {items.map((item, index) => (
              <div
                key={index}
                className="
                  p-4 rounded-lg mb-4 border 
                  bg-gray-50 dark:bg-[#1e293b] 
                  text-gray-900 dark:text-gray-200 
                "
              >
                <p className="font-semibold">
                  Q{index + 1}. {item.question}
                </p>
                <p className="text-red-600 dark:text-red-400 mt-2">
                  <strong>{t("ratingLabel")}:</strong> {item.rating}/10
                </p>
                <p className="text-blue-900 dark:text-blue-400 mt-1">
                  <strong>{t("yourAnswerLabel")}:</strong>{" "}
                  {item.userAns}
                </p>
                <p className="text-green-900 dark:text-green-400 mt-1">
                  <strong>{t("correctAnswerLabel")}:</strong>{" "}
                  {item.correctAns}
                </p>
                <p className="text-purple-700 dark:text-purple-300 mt-1">
                  <strong>{t("feedbackLabel")}:</strong>{" "}
                  {item.feedback}
                </p>
              </div>
            ))}
          </div>

          {showPreview && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
              <div className="bg-white dark:bg-[#0f172a] p-6 rounded-lg shadow-xl w-11/12 h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-lg">
                    {t("previewTitle")}
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowPreview(false)}
                  >
                    {t("closeBtn")}
                  </Button>
                </div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: reportRef.current?.outerHTML || "",
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex gap-4 mt-6">
        <Button onClick={() => setShowPreview(true)} variant="outline">
          <Eye className="mr-2 h-4 w-4" />
          {t("previewBtn")}
        </Button>

        <Button onClick={handleDownloadReport} className="bg-blue-600">
          <Download className="mr-2 h-4 w-4" />
          {t("downloadBtn")}
        </Button>

        <Button
          onClick={() => router.replace("/dashboard")}
          variant="secondary"
        >
          {t("goHomeBtn")}
        </Button>
      </div>
    </div>
  );
}

export default Feedback;
