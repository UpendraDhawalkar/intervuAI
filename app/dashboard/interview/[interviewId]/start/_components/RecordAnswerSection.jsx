"use client";

import { Button } from "@/components/ui/button";
import { db } from "@/utils/db";
import { chatSession } from "@/utils/GeminiAIModel";
import { UserAnswer } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import { Mic } from "lucide-react";
import moment from "moment";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import useSpeechToText from "react-hook-speech-to-text";
import Webcam from "react-webcam";
import { toast } from "sonner";
import { useTranslatedText } from "@/lib/useTranslatedText";

// 🔤 Base UI text (English)
const BASE_TEXT = {
  recordAnswer: "Record Answer",
  stopRecording: "Stop Recording",
  toastQuestionMissing: "Interview question not found!",
  toastAnswerSaved: "Answer recorded successfully",
  toastAnswerError: "Error saving answer",
};

function RecordAnswerSection({
  mockInterviewQuestions,
  activeQuestionIndex,
  interviewData,
  onRecorderReady,
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [isVideoRecording, setIsVideoRecording] = useState(false);

  // 🌍 Translation hook
  const { t, language } = useTranslatedText(
    BASE_TEXT,
    "recordAnswerSection"
  );

  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  useEffect(() => {
    results.map((result) =>
      setUserAnswer((prevAns) => prevAns + result?.transcript)
    );
  }, [results]);

  useEffect(() => {
    if (!isRecording && userAnswer.length > 10) {
      UpdateUserAnswer();
    }
  }, [userAnswer, isRecording]);

  const StartStopRecording = () => {
    isRecording ? stopSpeechToText() : startSpeechToText();
  };

  const handleUserMedia = (stream) => {
    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const formData = new FormData();
          formData.append(
            "file",
            blob,
            `interview-${interviewData?.mockId || "unknown"}-${Date.now()}.webm`
          );

          const res = await fetch("/api/upload-interview-video", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          console.log("🎥 Video uploaded:", data);
        } catch (err) {
          console.error("❌ Error uploading video:", err);
        }
      };

      mediaRecorder.start();
      setIsVideoRecording(true);
    } catch (err) {
      console.error("Error starting MediaRecorder:", err);
    }
  };

  // cleanup
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (webcamRef.current?.stream) {
        webcamRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // expose stopRecording to parent
  useEffect(() => {
    if (onRecorderReady) {
      onRecorderReady({
        stopRecording: () => {
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
          ) {
            mediaRecorderRef.current.stop();
            setIsVideoRecording(false);
          }
        },
      });
    }
  }, [onRecorderReady]);

  const UpdateUserAnswer = async () => {
    setLoading(true);
    const question = mockInterviewQuestions[activeQuestionIndex]?.Question;

    if (!question) {
      toast(t("toastQuestionMissing"));
      setLoading(false);
      return;
    }

    // 🌍 Feedback language instruction for AI
    const langInstruction =
      language === "hi"
        ? `
You must return the "feedback" text in Hindi only.
Do NOT mix English except for necessary technical terms.
`
        : `
You must return the "feedback" text in English only.
Do NOT mix any other language.
`;

    const feedbackPrompt = `
You are an expert interview evaluator.

Question: ${question}
User Answer: ${userAnswer}

Evaluate the answer and provide:
- A rating between 1 and 10 (number only)
- A short feedback (3–5 lines)

${langInstruction}

Return STRICTLY ONLY a JSON object in this format:
{
  "rating": number,
  "feedback": "feedback text here"
}
No extra text, no markdown, no explanation.
`;

    let feedbackData = { rating: null, feedback: "No feedback generated" };

    try {
      const result = await chatSession.sendMessage(feedbackPrompt);
      const responseText = await result.response.text();
      console.log("🟢 Feedback raw:", responseText);

      // JSON extract
      const match = responseText.match(/{[\s\S]*}/);
      if (match) feedbackData = JSON.parse(match[0]);
    } catch (error) {
      console.error("Error generating feedback:", error);
    }

    try {
      await db.insert(UserAnswer).values({
        mockIdRef: interviewData?.mockId,
        question,
        correctAns: mockInterviewQuestions[activeQuestionIndex]?.Answer,
        userAns: userAnswer,
        feedback: feedbackData.feedback,
        rating: feedbackData.rating,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        createdAt: moment().format("DD-MM-YYYY"),
      });

      toast(t("toastAnswerSaved"));
      setUserAnswer("");
      setResults([]);
    } catch (err) {
      toast(t("toastAnswerError"));
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Webcam Container */}
      <div className="flex flex-col justify-center items-center mt-20 rounded-lg p-5 bg-secondary dark:bg-gray-800 relative shadow-md">
        <Image
          src="/webcam.png"
          width={200}
          height={200}
          alt="Placeholder"
          className="absolute opacity-30 pointer-events-none"
        />
        <Webcam
          ref={webcamRef}
          audio
          mirrored
          onUserMedia={handleUserMedia}
          style={{ height: 300, width: "100%", zIndex: 10, borderRadius: "8px" }}
        />
      </div>

      {/* Audio Recording Button */}
      <Button
        disabled={loading}
        variant="outline"
        className="my-8 border-2 border-border text-foreground hover:bg-muted transition"
        onClick={StartStopRecording}
      >
        {isRecording ? (
          <span className="text-red-600 flex gap-2 items-center">
            <Mic /> {t("stopRecording")}
          </span>
        ) : (
          <span className="flex gap-2 items-center">
            🎙️ {t("recordAnswer")}
          </span>
        )}
      </Button>
    </div>
  );
}

export default RecordAnswerSection;
