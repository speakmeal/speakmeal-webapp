"use client";

import React, { useState } from "react";
import { FaHome, FaMicrophoneAlt, FaInfoCircle } from "react-icons/fa";
import { useAlert } from "../Components/Alert/useAlert";
import Alert from "../Components/Alert/Alert";
import AudioWaveform from "../speakMeal/AudioWaveform";
import LoadingIndicator from "../Components/LoadingIndicator";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { init, stop } from "../chat/agent/connection";
import { emptyMeal, Meal } from "../types_db";
import MealPage from "../meals/MealPage";
import MealSummary from "./MealSummary";


function ChatPage() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const { showAlert, message, type, triggerAlert } = useAlert();
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const [isMicLoading, setIsMicLoading] = useState<boolean>(false);
  const [openAIConnection, setOpenAIConnection] =
    useState<RTCPeerConnection | null>(null);
  const [track, setTrack] = useState<MediaStream | null>(null);
  const [extractedMealData, setExtractedMealData] = useState<Meal | null>(null);
  const [isQuickMode, setIsQuickMode] = useState<boolean>(false);
  const router = useRouter();

  const handleMicClick = async () => {
    if (isRecording) {
      if (openAIConnection && track) {
        setIsMicLoading(true);
        stop(openAIConnection, track);
        window.location.reload();
        setIsMicLoading(false);
      }

      setIsRecording(false);
    } else {
      setIsMicLoading(true);
      await init(setOpenAIConnection, setTrack, setIsMicLoading, setExtractedMealData, isQuickMode);
      setIsMicLoading(false);
      setIsRecording(true);
    }
  };

  if (isPageLoading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center">
        <LoadingIndicator />
        <p className="mt-5 text-white text-lg">Processing your meal...</p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      {/* Navbar */}
      <div className="pt-5">
        <nav className="p-4 flex justify-between items-center shadow-md bg-gray-800 bg-opacity-50 rounded-md mx-5">
          <div className="flex items-center">
            <Image
              src="/assets/logo.png"
              alt="Speak Meal Logo"
              width={40}
              height={40}
            />
            <span className="text-xl font-bold text-white ml-2">
              Speak Meal
            </span>
          </div>
          <button
            className="text-white hover:text-gray-300 transition-colors duration-200"
            onClick={() => router.push("/dashboard")}
          >
            <FaHome size={24} />
          </button>
        </nav>
      </div>

      {showAlert && <Alert message={message} type={type} />}

      <div className="flex flex-col items-center mt-10 md:mt-20 lg:mt-32 px-4">
        <div className="flex items-center mb-10">
          <button
            className={`${
              isQuickMode ? "text-yellow-500" : "text-gray-500"
            } hover:text-yellow-300 transition-colors duration-200 flex flex-row items-center justify-center font-bold`}
            onClick={() => setIsQuickMode(!isQuickMode)}
          >
            Quick Mode
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </button>

          <FaInfoCircle
            className="text-gray-300 ml-2 cursor-pointer"
            size={24}
            title="When turned on agent can save meals without needing manual confirmation"
          />
        </div>
        <div>
          {!isMicLoading ? (
            <button
              onClick={handleMicClick}
              className={`${
                isRecording ? "bg-red-500" : "bg-[#53ac00]"
              } rounded-full w-32 h-32 text-white text-4xl flex items-center justify-center transition-transform transform hover:scale-105 active:scale-95`}
            >
              <FaMicrophoneAlt />
            </button>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center bg-black text-[#4F19D6]">
                <span className="loading loading-ring text-center w-32"></span>
              </div>
              <p className="text-white text-xl mt-2">Loading...</p>
            </div>
          )}
        </div>

        {isRecording ? (
          <div className="w-full text-center mt-5">
            <AudioWaveform />
            <p className="mt-10 text-white text-xl font-bold">Speak Now</p>
          </div>
        ) : (
          <div className="mt-10 max-w-md mx-auto bg-gray-800 bg-opacity-50 p-6 rounded-lg">
            <div className="flex items-center justify-center">
              <FaInfoCircle className="text-gray-300 mr-2" size={24} />
              <p className="text-white text-xl font-semibold text-center">
                Press the microphone to start conversation
              </p>
            </div>
            <p className="text-gray-300 mt-4 text-center">
              Say hello to Specs Trainer, your personal trainer<br></br>
            </p>
            <div className="mt-2 p-4 bg-gray-700 rounded-md">
              <p className="text-gray-400 italic text-center">
                For example: <br></br> 
                - Log your meal: &quot;For breakfast I had 2 eggs, a
                bowl of cereal with milk, and a banana&quot;<br></br>
                - Track your goals: &quot;How many grams of protein should I eat today?&quot;
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Meal Summary Popup */}
      {extractedMealData !== null && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 overflow-y-auto md:p-4">
          <div className="bg-black md:p-6 rounded-lg">
            <button
              className="btn btn-error mb-4 text-white m-5"
              onClick={() => setExtractedMealData(null)}
            >
              Close
            </button>

            <MealSummary
              mealDataProp={extractedMealData || emptyMeal}
              isNew={true}
              hasNavbar={false}
              setExtractedMealData={setExtractedMealData}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;
