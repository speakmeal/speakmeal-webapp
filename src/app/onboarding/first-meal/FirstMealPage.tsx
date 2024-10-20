"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaMicrophone, FaMicrophoneAlt } from "react-icons/fa";
import Logo from "../../../../public/assets/logo.png"; // Make sure this path is correct
import { useRecordVoice } from "@/app/speakMeal/useRecordVoice";
import LoadingIndicator from "@/app/Components/LoadingIndicator";
import { useAlert } from "@/app/Components/Alert/useAlert";
import Alert from "@/app/Components/Alert/Alert";
import { Meal } from "@/app/types_db";
import AudioWaveform from "@/app/speakMeal/AudioWaveform";
import { createClient } from "@/app/Utils/supabase/client";
import MealPage from "@/app/meals/MealPage";

const FirstMealPage: React.FC = () => {
  const { showAlert, message, type, triggerAlert } = useAlert();
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const [extractedMealData, setExtractedMealData] = useState<Meal | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const { recording, startRecording, stopRecording, isLoading } = useRecordVoice({ callback: extractMacros, supabase: supabase });

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
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {showAlert && <Alert message={message} type={type} />}

      {/* Logo - Top Right */}
      <div className="absolute top-5 right-5">
        <img src={Logo.src} alt="Logo" className="w-12 h-12 object-contain" />
      </div>

      {/* Welcome Text */}
      <div className="text-center mt-10 md:mt-20">
        <h1 className="text-3xl text-[#53ac00] md:p-10 p-5">
          Hello 👋 <br />Welcome to SpeakMeal
        </h1>
        <h2 className="text-white text-2xl md:text-3xl">Log your first meal with your voice</h2>
      </div>

      {/* Call to Action */}
      <div className="flex flex-col items-center mt-20 md:mt-32 flex-1">
        <div>
          <button
            onClick={handleMicClick}
            className={`${
              recording ? "bg-red-500" : "bg-[#53ac00]"
            } rounded-full w-32 h-32 md:w-40 md:h-40 text-white text-4xl flex flex-col items-center justify-center transition-transform duration-200 ease-in-out hover:scale-110`}
          >
            <FaMicrophoneAlt />
          </button>
        </div>

        {recording ? (
          <div className="w-full mt-5 text-center">
            <p className="mt-10 text-white text-xl font-bold">Speak Now</p>
            <AudioWaveform />
          </div>
        ) : (
          <div>
            <p className="mt-10 text-gray-400 text-lg">
              Press microphone to record your meal
            </p>
          </div>
        )}
      </div>

      {/* Skip Button */}
      <div className="text-center pb-10">
        <button
          className="mt-6 text-lg md:text-xl hover:text-gray-300 text-[#53ac00]"
          onClick={() => router.push("/onboarding/measurement")}
        >
          Skip
        </button>
      </div>

      {/* Meal Summary Popup */}
      {extractedMealData !== null && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 overflow-y-auto p-4">
          <div className="bg-white p-6 rounded-lg">
            <button
              className="btn btn-error mb-4 text-white"
              onClick={() => setExtractedMealData(null)}
            >
              Try Again
            </button>
            <MealPage
              mealDataProp={extractedMealData}
              isNew={true}
              hasNavbar={false}
              redirect="/onboarding/measurement"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FirstMealPage;
