"use client";

import React, { useState, useEffect } from "react";
import { FaCoins, FaMicrophone, FaMicrophoneAlt } from "react-icons/fa";
import { useRecordVoice } from "./useRecordVoice";
import { useAlert } from "../Components/Alert/useAlert";
import Alert from "../Components/Alert/Alert";
import { createClient } from "../Utils/supabase/client";
import AudioWaveform from "./AudioWaveform";
import DashNavbar from "../Components/DashNavbar";
import LoadingIndicator from "../Components/LoadingIndicator";
import { Meal } from "../types_db";
import MealPage from "../meals/MealPage";

function SpeakMealPage() {
  const supabase = createClient();
  const { recording, startRecording, stopRecording, isLoading } = useRecordVoice({ callback: extractMacros, supabase: supabase });
  const { showAlert, message, type, triggerAlert } = useAlert();
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const [extractedMealData, setExtractedMealData] = useState<Meal | null>(null);

  async function extractMacros(transcript: string) {
    console.log("Transcript: " + transcript);

    if (!transcript || transcript.length === 0) {
      setIsPageLoading(false);
      return;
    }

    setIsPageLoading(true);
    const session = await supabase.auth.getSession();

    // Send request to endpoint that uses OpenAI API to extract ingredients from transcript
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
          // Get the macros for each item from nutritionix api
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

          // Use portion sizes to get the macro totals
          const { macros } = await nutriResp.json();
          const portion_number =
            parseFloat(item.weight) / parseFloat(macros.serving_weight_grams); // Get number of portions eaten by user

          return {
            food_name: `${macros.food_name} - ${item.dose} (${item.weight}g)`,
            protein_g: Math.round(100 * macros.nf_protein * portion_number) / 100, // Round macros to 2 d.p
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

    // Save the meal data to the local state
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
    if (recording) {
      stopRecording();
      setIsPageLoading(true);
    } else {
      startRecording(triggerAlert);
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
    <div className="bg-black h-screen">
      <div className="pt-5">
        <DashNavbar />
      </div>

      {showAlert && <Alert message={message} type={type} />}

      <div className="flex flex-col items-center mt-[20vh]">
        <div>
          <button
            onClick={handleMicClick}
            className={`${
              recording ? "bg-red-500" : "bg-[#53ac00]"
            } rounded-full w-32 h-32 text-white text-4xl flex flex-col items-center justify-center`}
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
          <div>
            <p className="mt-10 text-gray-400 text-lg font-bold">
              Press microphone to start recording
            </p>
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
              redirect="/onboarding/measurement"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SpeakMealPage;
