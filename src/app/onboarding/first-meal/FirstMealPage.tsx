"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaMicrophone } from "react-icons/fa";
import Logo from "../../../../public/assets/logo.png";
import { useRecordVoice } from "@/app/speakMeal/useRecordVoice";
import LoadingIndicator from "@/app/Components/LoadingIndicator";
import { useAlert } from "@/app/Components/Alert/useAlert";
import Alert from "@/app/Components/Alert/Alert";
import { FoodItem, Meal } from "@/app/types_db";
import AudioWaveform from "@/app/speakMeal/AudioWaveform";
import { createClient } from "@/app/Utils/supabase/client";
import MealPage from "@/app/meals/MealPage";

const FirstMealPage: React.FC = () => {
  const { recording, startRecording, stopRecording, text, setText, isLoading } = useRecordVoice();
  const { showAlert, message, type, triggerAlert } = useAlert();
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const [extractedMealData, setExtractedMealData] = useState<Meal | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const extractMacros = async (transcript: string) => {
    setIsPageLoading(true);

    // Send request to endpoint that uses OpenAI API to extract ingredients from transcript
    const response = await fetch("/api/getIngredients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript: transcript,
      }),
    });

    if (!response.ok) {
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
  };

  const handleMicClick = () => {
    if (recording) {
      stopRecording();
      setIsPageLoading(true);
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    // When transcription finishes, extract the macros
    if (!isLoading && text.length > 0) {
      extractMacros(text).then(() => setText(""));
    }
  }, [text, isLoading, extractMacros, setText]);
  

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

      {/* Logo */}
      <div className="flex flex-row items-center justify-center space-x-10 mt-10">
        <h1 className="text-6xl font-bold text-[#4F19D6]">
          Welcome to <br />
          SpeakMeal
        </h1>
        <img src={Logo.src} alt="App Logo" className="w-24" />
      </div>

      {/* Call to action */}
      <div className="flex flex-col items-center mt-[20vh] flex-1">
        <div>
          <button
            onClick={handleMicClick}
            className={`${
              recording ? "bg-red-500" : "bg-[#4F19D6]"
            } rounded-full w-32 h-32 text-white text-4xl flex flex-col items-center justify-center`}
          >
            <FaMicrophone />
          </button>
        </div>

        {recording ? (
          <div className="w-full">
            <AudioWaveform />
          </div>
        ) : (
          <div>
            <p className="mt-10 text-gray-500">
              Press the microphone icon to start recording
            </p>
          </div>
        )}
      </div>

      {/* Skip button */}
      <button
        className="mt-6 text-lg hover:text-gray-300 pb-5 text-[#4F19D6]"
        onClick={() => router.push("/onboarding/measurement")}
      >
        Skip
      </button>
      
      {/* Pop up with the new meal */}
      {extractedMealData !== null && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-1 overflow-y-scroll">
          <div className="overflow-y-scroll">
            <div>
              <button className="btn btn-error mt-3 ml-5 text-white"
                      onClick={() => setExtractedMealData(null)}>Try Again</button>
            </div>
            <MealPage mealDataProp={extractedMealData} isNew={true} hasNavbar={false} redirect="/onboarding/measurement"/>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirstMealPage;
