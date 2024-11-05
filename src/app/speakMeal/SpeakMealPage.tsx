"use client";

import React, { useState } from "react";
import { FaHome, FaMicrophoneAlt, FaInfoCircle } from "react-icons/fa";
import { useRecordVoice } from "./useRecordVoice";
import { useAlert } from "../Components/Alert/useAlert";
import Alert from "../Components/Alert/Alert";
import { createClient } from "../Utils/supabase/client";
import AudioWaveform from "./AudioWaveform";
import LoadingIndicator from "../Components/LoadingIndicator";
import { Meal } from "../types_db";
import MealPage from "../meals/MealPage";
import Image from 'next/image';
import { useRouter } from "next/navigation";

function SpeakMealPage() {
  const supabase = createClient();
  const { recording, startRecording, stopRecording, isLoading } = useRecordVoice({ callback: extractMacros, supabase: supabase });
  const { showAlert, message, type, triggerAlert } = useAlert();
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const [extractedMealData, setExtractedMealData] = useState<Meal | null>(null);

  const router = useRouter();

  async function extractMacros(transcript: string) {
    console.log("Transcript: " + transcript);

    if (!transcript || transcript.length === 0) {
      setIsPageLoading(false);
      return;
    }

    setIsPageLoading(true);
    const session = await supabase.auth.getSession();

    const response = await fetch("/api/getIngredients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.data.session?.access_token}`,
      },
      body: JSON.stringify({
        transcript: transcript,
      }),
    });

    if (!response.ok) {
      console.log(response.json);
      triggerAlert("Error processing transcript", "error");
      setIsPageLoading(false);
      return;
    }

    const resp = await response.json();
    const { type, foods } = await JSON.parse(resp.response);
    console.log(foods);

    const foodData = await Promise.all(
      foods.map(async (item: any) => {
        try {
          const nutriResp = await fetch("/api/getMacros", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              itemName: item.food_name,
            }),
          });

          if (!nutriResp.ok) {
            throw new Error("Error fetching nutrition data");
          }

          const { macros } = await nutriResp.json();
          const portion_number = parseFloat(item.weight) / parseFloat(macros.serving_weight_grams);

          return {
            food_name: `${macros.food_name} - ${item.dose} (${item.weight}g)`,
            protein_g: Math.round(100 * macros.nf_protein * portion_number) / 100,
            carbs_g: Math.round(100 * macros.nf_total_carbohydrate * portion_number) / 100,
            fat_g: Math.round(100 * macros.nf_total_fat * portion_number) / 100,
            calories: Math.round(macros.nf_calories * portion_number),
          };
        } catch (err) {
          return {
            food_name: `${item.food_name} - ${item.dose} (${item.weight})`,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            calories: 0,
          };
        }
      })
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setExtractedMealData({
      id: -1,
      created_at: "",
      owner_id: user?.id || "",
      type: type,
      food_item: foodData.map((item) => ({
        ...item,
        meal_id: -1,
      })),
    });

    setIsPageLoading(false);
  }

  const handleMicClick = () => {
    console.log("Mic click");
    console.log(recording);

    if (recording) {
      stopRecording();
      setIsPageLoading(true);
    } else {
      console.log("Starting recording ...");
      startRecording(triggerAlert);
      console.log(recording);
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
            <span className="text-xl font-bold text-white ml-2">Speak Meal</span>
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
        <div>
          <button
            onClick={handleMicClick}
            className={`${
              recording ? "bg-red-500" : "bg-[#53ac00]"
            } rounded-full w-32 h-32 text-white text-4xl flex items-center justify-center transition-transform transform hover:scale-105 active:scale-95`}
          >
            <FaMicrophoneAlt />
          </button>
        </div>

        {recording ? (
          <div className="w-full text-center mt-5">
            <AudioWaveform />
            <p className="mt-10 text-white text-xl font-bold">Speak Now</p>
          </div>
        ) : (
          <div className="mt-10 max-w-md mx-auto bg-gray-800 bg-opacity-50 p-6 rounded-lg">
            <div className="flex items-center justify-center">
              <FaInfoCircle className="text-gray-300 mr-2" size={24} />
              <p className="text-white text-xl font-semibold text-center">
                Press the microphone to start recording
              </p>
            </div>
            <p className="text-gray-300 mt-4 text-center">
              Just speak your meal and weapos;ll do the rest.<br></br>
            </p>
            <div className="mt-2 p-4 bg-gray-700 rounded-md">
              <p className="text-gray-400 italic text-center">
                Example: &quot;For breakfast I had 2 eggs, a bowl of cereal with milk, and a banana&quot;
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
              Try Again
            </button>
            <MealPage
              mealDataProp={extractedMealData}
              isNew={true}
              hasNavbar={false}
              redirect="/dashboard"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SpeakMealPage;
