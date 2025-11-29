"use client";

import React, { useEffect, useState, useRef, use } from "react";
import { Button } from "@/components/ui/button";
import { db } from "@/utils/db";
import { MockInterview, UserVoilation } from "@/utils/schema";
import { eq } from "drizzle-orm";
import QuestionsSection from "./_components/QuestionsSection";
import RecordAnswerSection from "./_components/RecordAnswerSection";
import { useUser } from "@clerk/nextjs";
import { useTranslatedText } from "@/lib/useTranslatedText";

const BASE_TEXT = {
  violationsTitle: "Violations Detected:",
  faceAbsent: "Face Absent",
  focusLost: "Focus Lost",
  unauthorizedItems: "Unauthorized Items",
  previous: "Previous",
  next: "Next",
  endInterview: "End Interview",
  allowCamMsg: "Please allow camera and microphone access for detection.",
};

function StartInterview(props) {
  const { user } = useUser();

  const [interviewId, setInterviewId] = useState(null);
  const [interviewData, setInterviewData] = useState();
  const [mockInterviewQuestions, setMockInterviewQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const canvasRef = useRef(null);
  const detectionStarted = useRef(false);
  const recorderControlsRef = useRef(null); // 🎥 controls from RecordAnswerSection

  // 🔥 Translation hook
  const { t, translating } = useTranslatedText(
    BASE_TEXT,
    "startInterviewPage"
  );

  // ✅ Resolve params (since params is a Promise in Next.js 15)
  const resolvedParams = use(props.params);
  useEffect(() => {
    setInterviewId(resolvedParams?.interviewId || null);
  }, [resolvedParams]);

  // ✅ Fetch interview details once interviewId is available
  useEffect(() => {
    if (!interviewId) return;

    const GetInterviewDetails = async () => {
      try {
        const result = await db
          .select()
          .from(MockInterview)
          .where(eq(MockInterview.mockId, interviewId));

        if (result.length === 0) {
          console.error("No interview found for ID:", interviewId);
          return;
        }

        const jsonMockResp = JSON.parse(result[0].jsonMockResp);
        setMockInterviewQuestions(jsonMockResp);
        setInterviewData(result[0]);
      } catch (error) {
        console.error("Error fetching interview details:", error);
      }
    };

    GetInterviewDetails();
  }, [interviewId]);

  // ✅ Detection setup
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (detectionStarted.current) return;
    detectionStarted.current = true;

    let detectionInstance;

    const setupDetection = async () => {
      try {
        const loadScript = (src) =>
          new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
              resolve();
              return;
            }
            const script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });

        // Load TF + models
        await loadScript(
          "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.21.0/dist/tf.min.js"
        );
        await loadScript(
          "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js"
        );
        await loadScript(
          "https://cdn.jsdelivr.net/npm/@tensorflow-models/face-detection@1.0.1/dist/face-detection.min.js"
        );

        if (!window.DetectionSystem) {
          await loadScript("/detection.js");
          console.log(
            "✅ detection.js loaded successfully with TensorFlow models"
          );
        } else {
          console.log("⚠️ detection.js already loaded, skipping reload");
        }

        const waitForVideo = () =>
          new Promise((resolve, reject) => {
            let attempts = 0;
            const interval = setInterval(() => {
              const videoElement = document.querySelector("video");
              if (
                videoElement &&
                videoElement.srcObject &&
                videoElement.videoWidth > 0 &&
                videoElement.videoHeight > 0
              ) {
                clearInterval(interval);
                console.log(
                  `🎥 Video ready: ${videoElement.videoWidth}x${videoElement.videoHeight}`
                );
                resolve(videoElement);
              } else if (++attempts > 100) {
                clearInterval(interval);
                reject("Video element not ready or invalid size.");
              }
            }, 300);
          });

        const videoElement = await waitForVideo();
        console.log(
          "✅ Using existing camera from RecordAnswerSection:",
          videoElement
        );

        detectionInstance = new window.DetectionSystem();
        detectionInstance.initializeAlertSystem();

        const initialized = await detectionInstance.initialize(
          videoElement,
          canvasRef.current,
          null,
          "session1"
        );

        if (!initialized) {
          console.error("❌ Detection initialization failed");
          return;
        }

        await detectionInstance.initializeAudioDetection();
        detectionInstance.startDetection();

        detectionInstance.setViolationCallback((data) => {
          console.log("🚨 Violation triggered:", data);
          const counterIds = {
            focus_lost: "focusLostCount",
            face_absent: "faceAbsentCount",
            multiple_faces: "multipleFacesCount",
            unauthorized_item: "unauthorizedItemsCount",
          };

          let current =
            JSON.parse(localStorage.getItem("interviewViolations")) || {
              face_absent: 0,
              focus_lost: 0,
              multiple_faces: 0,
              unauthorized_item: 0,
            };

          current[data.type] = (current[data.type] || 0) + 1;
          localStorage.setItem("interviewViolations", JSON.stringify(current));

          const counterId = counterIds[data.type];
          const el = document.getElementById(counterId);
          if (el) {
            el.textContent = Number(el.textContent || 0) + 1;
          } else {
            console.warn(`❌ Counter element not found: ${counterId}`);
          }
        });
      } catch (error) {
        console.error("Detection setup error:", error);
        if (
          error.name === "NotAllowedError" ||
          (error.message && error.message.includes("Permission denied"))
        ) {
          alert(t("allowCamMsg"));
        }
      }
    };

    setTimeout(() => {
      setupDetection();
    }, 1000);

    return () => {
      if (detectionInstance && detectionInstance.stopDetection) {
        detectionInstance.stopDetection();
      }
    };
  }, [t]);

  // ✅ Save violations & stop video when interview ends
  const handleEndInterview = async () => {
    try {
      // ⏹ Stop video recording (this will upload the video)
      if (recorderControlsRef.current?.stopRecording) {
        recorderControlsRef.current.stopRecording();
      }

      const storedViolations =
        JSON.parse(localStorage.getItem("interviewViolations")) || {
          face_absent: 0,
          focus_lost: 0,
          unauthorized_item: 0,
        };

      const resp = await db.insert(UserVoilation).values({
        mockIdRef: interviewData?.mockId,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        faceAbsent: storedViolations.face_absent,
        focusLoss: storedViolations.focus_lost,
        unAuthorizedItem: storedViolations.unauthorized_item,
      });

      console.log("✅ Violation record saved:", resp);

      localStorage.removeItem("interviewViolations");

      window.location.href = `/dashboard/interview/${interviewData?.mockId}/feedback`;
    } catch (error) {
      console.error("❌ Error saving user violation:", error);
    }
  };

  return (
    <div className="p-4 -mt-7">
      {/* Canvas used by detection.js */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <QuestionsSection
          mockInterviewQuestions={mockInterviewQuestions}
          activeQuestionIndex={activeQuestionIndex}
        />

        <RecordAnswerSection
          mockInterviewQuestions={mockInterviewQuestions}
          activeQuestionIndex={activeQuestionIndex}
          interviewData={interviewData}
          // 🎥 Get controls (stopRecording) from child
          onRecorderReady={(controls) => {
            recorderControlsRef.current = controls;
          }}
        />
      </div>

      {/* ✅ Violation Counters */}
      <div
        className="
          mt-1 p-4 max-w-xl border rounded-lg
          bg-gray-50 text-gray-900
          dark:bg-[#020617] dark:text-gray-100 dark:border-gray-700
          transition-colors duration-300
        "
      >
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold">{t("violationsTitle")}</h3>
          {translating && (
            <span className="text-[10px] text-gray-500 animate-pulse">
              Translating...
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("faceAbsent")}
            </p>
            <p
              id="faceAbsentCount"
              className="text-xl font-bold text-gray-900 dark:text-gray-100"
            >
              0
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("focusLost")}
            </p>
            <p
              id="focusLostCount"
              className="text-xl font-bold text-gray-900 dark:text-gray-100"
            >
              0
            </p>
          </div>
          {/* Multiple faces counter (if needed later)
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Multiple Faces
            </p>
            <p
              id="multipleFacesCount"
              className="text-xl font-bold text-gray-900 dark:text-gray-100"
            >
              0
            </p>
          </div> */}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("unauthorizedItems")}
            </p>
            <p
              id="unauthorizedItemsCount"
              className="text-xl font-bold text-gray-900 dark:text-gray-100"
            >
              0
            </p>
          </div>
        </div>
      </div>

      {/* ✅ Navigation Buttons */}
      <div className="flex justify-end gap-4 -mt-12 mb-3">
        {activeQuestionIndex > 0 && (
          <Button
            onClick={() =>
              setActiveQuestionIndex((prev) => Math.max(prev - 1, 0))
            }
          >
            {t("previous")}
          </Button>
        )}

        {activeQuestionIndex !== mockInterviewQuestions?.length - 1 && (
          <Button
            onClick={() =>
              setActiveQuestionIndex((prev) =>
                Math.min(prev + 1, mockInterviewQuestions.length - 1)
              )
            }
          >
            {t("next")}
          </Button>
        )}

        {activeQuestionIndex === mockInterviewQuestions?.length - 1 && (
          <Button onClick={handleEndInterview}>{t("endInterview")}</Button>
        )}
      </div>
    </div>
  );
}

export default StartInterview;
