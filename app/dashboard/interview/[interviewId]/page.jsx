"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { Lightbulb, WebcamIcon } from "lucide-react";
import Link from "next/link";
import Webcam from "react-webcam";
import { useTranslatedText } from "@/lib/useTranslatedText";

const BASE_TEXT = {
  getStarted: "Let's Get Started",
  jobRole: "Job Role",
  techStack: "Tech Stack",
  experience: "Experience",
  information: "Information",
  enableCam: "Enable Web Cam & Microphone",
  allowCameraMsg: "Please allow camera and microphone access to proceed.",
  startInterview: "Start Interview",
};

function Interview({ params }) {
  // Unwrap params
  const resolvedParams = use(params);
  const interviewId = resolvedParams.interviewId;

  const [interviewData, setInterviewData] = useState(null);
  const [webCamEnabled, setWebCamEnable] = useState(false);
  const [permissionError, setPermissionError] = useState("");

  // 🔥 Translation hook
  const { t, translating } = useTranslatedText(BASE_TEXT, "interviewPage");

  useEffect(() => {
    if (interviewId) GetInterviewDetails();
  }, [interviewId]);

  const GetInterviewDetails = async () => {
    try {
      const result = await db
        .select()
        .from(MockInterview)
        .where(eq(MockInterview.mockId, interviewId));
      if (result.length > 0) setInterviewData(result[0]);
    } catch (error) {
      console.error("Error fetching interview details:", error);
    }
  };

  const handleEnableCamera = async () => {
    setPermissionError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (stream) {
        setWebCamEnable(true);
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (error) {
      console.error("Permission denied:", error);
      setPermissionError(t("allowCameraMsg"));
      setWebCamEnable(false);
    }
  };

  return (
    <div className="my-10">
      <div className="flex items-center gap-2">
        <h2 className="font-bold text-2xl">{t("getStarted")}</h2>
        {translating && (
          <span className="text-xs text-gray-500 animate-pulse">Translating...</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Interview info */}
        {interviewData && (
          <div className="flex flex-col my-5 gap-5">
            <div
              className="
                flex flex-col p-5 rounded-lg border gap-1 
                bg-gray-50 dark:bg-[#020617]
                border-gray-200 dark:border-gray-700 
                text-gray-900 dark:text-gray-100
              "
            >
              <h2 className="text-lg">
                <strong>{t("jobRole")}:</strong> {interviewData.jobPosition}
              </h2>
              <h2 className="text-lg">
                <strong>{t("techStack")}:</strong> {interviewData.jobDesc}
              </h2>
              <h2 className="text-lg">
                <strong>{t("experience")}:</strong> {interviewData.jobExperience}
              </h2>
            </div>

            <div
              className="
                p-5 rounded-lg
                border border-yellow-300 bg-yellow-100
                dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200
              "
            >
              <h2 className="flex gap-2 items-center">
                <Lightbulb className="text-yellow-500 dark:text-yellow-300" />
                <strong>{t("information")}</strong>
              </h2>
              <h2 className="mt-2">{t(process.env.NEXT_PUBLIC_INFORMATION)}</h2>
            </div>
          </div>
        )}

        {/* Camera Section */}
        <div className="flex flex-col items-center justify-center">
          {webCamEnabled ? (
            <Webcam
              mirrored
              audio
              videoConstraints={{ width: 300, height: 300 }}
              className="rounded-lg border border-gray-300 dark:border-gray-700"
              style={{ width: 300, height: 300, objectFit: "cover" }}
            />
          ) : (
            <>
              <div
                className="
                  h-72 w-full my-7 p-20 flex items-center justify-center 
                  bg-gray-100 dark:bg-gray-800 
                  rounded-lg border border-gray-200 dark:border-gray-600
                "
              >
                <WebcamIcon className="h-32 w-32 text-gray-500 dark:text-gray-400" />
              </div>

              <Button variant="ghost" onClick={handleEnableCamera} className="w-full">
                {t("enableCam")}
              </Button>

              {permissionError && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                  {permissionError}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Start Button */}
      <div className="flex justify-end items-end mt-4">
        <Button disabled={!webCamEnabled} asChild>
          <Link
            href={`/dashboard/interview/${interviewId}/start`}
            className={!webCamEnabled ? "pointer-events-none opacity-50" : ""}
          >
            {t("startInterview")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default Interview;
