"use client";
import React, { useState } from "react";
import { FaBrain, FaEdit, FaMicrophone, FaRobot } from "react-icons/fa";
import { useRecordVoice } from "./useRecordVoice";
import DashNavbar from "../Components/DashNavbar";
import LoadingIndicator from "../Components/LoadingIndicator";
import { useAlert } from "../Components/Alert/useAlert";
import Alert from "../Components/Alert/Alert";
import { createClient } from "../Utils/supabase/client";
import { useRouter } from "next/navigation";

function SpeakMeal() {
  const { recording, startRecording, stopRecording, text, setText, isLoading } =
    useRecordVoice();
  const [isEdit, setIsEdit] = useState<boolean>(false);

  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const { showAlert, message, type, triggerAlert } = useAlert();
  const supabase = createClient();
  const router = useRouter();

  const extractMacros = async () => {
    setIsPageLoading(true);

    //send request to endpoint that uses OpenAI API to extract ingredients from transcript
    const response = await fetch("/api/getIngredients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript: text,
      }),
    });

    if (!response.ok) {
      triggerAlert("Error processing transcript", "error");
      setIsPageLoading(false);
      return;
    }

    const resp = await response.json();
    const { type, foods } = await JSON.parse(resp.response);

    const foodData = await Promise.all(
      foods.map(async (item: any) => {
        //get the macros for each item from nutritionix api
        const nutriResp = await fetch("api/getMacros", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemName: item.food_name,
          }),
        });

        if (nutriResp.ok) {
          //use portion sizes to get the macro totals
          const { macros } = await nutriResp.json();
          const portion_number =
            parseFloat(item.weight) / parseFloat(macros.serving_weight_grams); //get number of portions eaten by user

          return {
            food_name: `${macros.food_name} - ${item.dose} (${item.weight}g)`,
            protein_g:
              Math.round(100 * macros.nf_protein * portion_number) / 100, //round macros to 2 d.p
            carbs_g:
              Math.round(100 * macros.nf_total_carbohydrate * portion_number) /
              100,
            fat_g: Math.round(100 * macros.nf_total_fat * portion_number) / 100,
            calories: Math.round(macros.nf_calories * portion_number),
          };
        } else {
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

    //create a new meal in the database
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: meal, error } = await supabase
      .from("meal")
      .insert({
        type: type || "Snack",
        owner_id: user?.id,
      })
      .select()
      .single();

    if (error) {
      triggerAlert(error.message, "error");
      setIsPageLoading(false);
      return;
    }

    //add the food items to the new meal
    const { error: itemsError } = await supabase.from("food_item").insert(
      foodData.map((item) => ({
        ...item,
        meal_id: meal.id,
      }))
    );

    if (itemsError) {
      triggerAlert(itemsError.message, "error");
      setIsPageLoading(false);
      return;
    }

    //meal created, now redirect user to the meal's page to allow them to edit it
    router.push(`/meals/${meal.id}`);
  };

  if (isPageLoading) {
    return (
      <div className="h-screen flex flex-row justify-center items-center">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DashNavbar redirectPath="/dashboard" />

      <div className="flex flex-col justify-center items-center bg-white h-screen">
        <div className="shadow-lg p-10 rounded-lg flex flex-col">
          <h1 className="text-3xl text-lime-500 font-bold">
            Log your meal with your voice
          </h1>
          <p className="font-semibold">
            Be as descriptive and accurate as possible to achieve the best
            possible results.
          </p>

          {isLoading ? (
            <div className="mt-10">
              <LoadingIndicator />
            </div>
          ) : (
            <div>
              <div className="flex flex-row items-center justify-center space-x-5 mt-20">
                <p className="text-xl text-purple-600">
                  {recording ? "Stop Recording" : "Start Recording"}
                </p>

                <button
                  onClick={() =>
                    recording ? stopRecording() : startRecording()
                  }
                  className={`btn ${
                    recording
                      ? "bg-red-500 hover:bg-red-400"
                      : "bg-purple-500 hover:bg-lime-500"
                  } text-white rounded-full shadow-lg flex flex-row items-center justify-center`}
                >
                  <FaMicrophone className="text-2xl" />
                </button>
              </div>

              {recording ? (
                <div className="loader text-purple-500">
                  <svg
                    id="wave"
                    data-name="Layer 1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 50 38.05"
                  >
                    <title>Audio Wave</title>
                    <path
                      id="Line_1"
                      data-name="Line 1"
                      d="M0.91,15L0.78,15A1,1,0,0,0,0,16v6a1,1,0,1,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H0.91Z"
                    />
                    <path
                      id="Line_2"
                      data-name="Line 2"
                      d="M6.91,9L6.78,9A1,1,0,0,0,6,10V28a1,1,0,1,0,2,0s0,0,0,0V10A1,1,0,0,0,7,9H6.91Z"
                    />
                    <path
                      id="Line_3"
                      data-name="Line 3"
                      d="M12.91,0L12.78,0A1,1,0,0,0,12,1V37a1,1,0,1,0,2,0s0,0,0,0V1a1,1,0,0,0-1-1H12.91Z"
                    />
                    <path
                      id="Line_4"
                      data-name="Line 4"
                      d="M18.91,10l-0.12,0A1,1,0,0,0,18,11V27a1,1,0,1,0,2,0s0,0,0,0V11a1,1,0,0,0-1-1H18.91Z"
                    />
                    <path
                      id="Line_5"
                      data-name="Line 5"
                      d="M24.91,15l-0.12,0A1,1,0,0,0,24,16v6a1,1,0,0,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H24.91Z"
                    />
                    <path
                      id="Line_6"
                      data-name="Line 6"
                      d="M30.91,10l-0.12,0A1,1,0,0,0,30,11V27a1,1,0,1,0,2,0s0,0,0,0V11a1,1,0,0,0-1-1H30.91Z"
                    />
                    <path
                      id="Line_7"
                      data-name="Line 7"
                      d="M36.91,0L36.78,0A1,1,0,0,0,36,1V37a1,1,0,1,0,2,0s0,0,0,0V1a1,1,0,0,0-1-1H36.91Z"
                    />
                    <path
                      id="Line_8"
                      data-name="Line 8"
                      d="M42.91,9L42.78,9A1,1,0,0,0,42,10V28a1,1,0,1,0,2,0s0,0,0,0V10a1,1,0,0,0-1-1H42.91Z"
                    />
                    <path
                      id="Line_9"
                      data-name="Line 9"
                      d="M48.91,15l-0.12,0A1,1,0,0,0,48,16v6a1,1,0,1,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H48.91Z"
                    />
                  </svg>
                </div>
              ) : (
                <div className="flex flex-row w-full justify-center items-center space-x-3">
                  <textarea
                    className="mt-4 p-2 border border-gray-300 rounded w-full max-w-md"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Your description will appear here"
                    rows={4}
                    disabled={!isEdit}
                  ></textarea>

                  {text.length > 0 && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setIsEdit(!isEdit)}
                    >
                      <FaEdit />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            className="btn bg-lime-500 rounded-full mt-10 text-white hover:bg-purple-500"
            onClick={extractMacros}
          >
            <div className="flex flex-row items-center space-x-5 text-lg font-normal px-2">
              <FaRobot />
              <p>Extract Macros</p>
            </div>
          </button>
        </div>
      </div>

      {showAlert && <Alert message={message} type={type} />}
    </div>
  );
}

export default SpeakMeal;
