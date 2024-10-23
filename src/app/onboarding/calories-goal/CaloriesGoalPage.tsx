"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/app/Components/Alert/Alert";
import { useAlert } from "@/app/Components/Alert/useAlert";
import { createClient } from "@/app/Utils/supabase/client";
import LoadingIndicator from "@/app/Components/LoadingIndicator";
import PieChart from "@/app/meals/PieChart";
import { prebuitPlans } from "@/app/types_db";
import { FaBurn, FaDumbbell, FaWeight } from "react-icons/fa";

interface MacroPercentageInputs {
  carbohydrates: number;
  proteins: number;
  fats: number;
}

const CaloriesGoalPage: React.FC = () => {
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState<number>(1900);
  const [macroPercentageInputs, setMacroPercentageInputs] =
    useState<MacroPercentageInputs>({
      carbohydrates: 60,
      proteins: 30,
      fats: 10,
    });
  const [showSubmit, setShowSubmit] = useState<boolean>(true); //avoid showing submit while dragging to avoid sudden changes
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showAlert, message, type, triggerAlert } = useAlert();

  const supabase = createClient();
  const router = useRouter();

  /**
   * Using the total amount of calories eaten per day and the percentage of the total calories associated with a macro,
   * calculate the amount of grams that should be consumed for that macro.
   * This assumes:
   *    - 1g of carbs = 4 calories
   *    - 1g of protein = 4 calories
   *    - 1g of fat = 9 calories
   * @param macro
   */
  const getMacroTarget = (macro: keyof MacroPercentageInputs) => {
    const macroPercentage = macroPercentageInputs[macro];
    const caloriesPerGram = {
      carbohydrates: 4,
      proteins: 4,
      fats: 9,
    };

    return Math.round(
      ((dailyCalorieGoal / 100) * macroPercentage) / caloriesPerGram[macro]
    );
  };

  /**
   * Save calories and nutrient goals to the database
   */
  const handleSubmit = async () => {
    setIsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("users")
      .update({
        target_daily_calories: dailyCalorieGoal,
        carbohydrates_grams_goal: getMacroTarget("carbohydrates"),
        protein_grams_goal: getMacroTarget("proteins"),
        fat_grams_goal: getMacroTarget("fats"),
      })
      .eq("id", user?.id);

    if (error) {
      triggerAlert(error.message, "error");
      setIsLoading(false);
    }

    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-black">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black p-8">
      {showAlert && <Alert message={message} type={type} />}

      {/* Title */}
      <div className="flex flex-col items-center">
        <h1 className="text-xl md:text-5xl font-bold text-[#53ac00] text-center">
          Targets
        </h1>

        <p className="text-white mt-3">Set your daily targets</p>
      </div>

      {/* Form */}
      <div className="flex flex-col items-center mt-20">
        <div className="flex flex-row space-x-5 w-full justify-center items-center">
          <label className="text-xl text-white">Daily Calorie Goal: </label>
          <input
            type="range"
            min={0}
            max={10000}
            value={dailyCalorieGoal}
            step={1}
            className="range range-primary bg-white w-64"
            onChange={(e) => setDailyCalorieGoal(parseInt(e.target.value))}
          />
          <p className="text-white">{dailyCalorieGoal} kcal</p>
        </div>

        <div className="mt-10 flex flex-col w-full items-center">
          <h2 className="text-lg text-white">Macro Nutrient Breakdown</h2>

          <div className="grid grid-cols-2 items-center gap-5 mt-5 bg-gray-500 bg-opacity-30 p-5 rounded-lg">
            <label className="text-white">
              Carbohydrates ({macroPercentageInputs.carbohydrates}%):{" "}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={macroPercentageInputs.carbohydrates}
              step={1}
              className="range range-primary bg-white w-max-64"
              onChange={(e) =>
                setMacroPercentageInputs({
                  ...macroPercentageInputs,
                  carbohydrates: parseInt(e.target.value),
                })
              }
              onMouseDown={() => setShowSubmit(false)}
              onMouseUp={() => setShowSubmit(true)}
            />

            <label className="block text-white">
              Proteins ({macroPercentageInputs.proteins}%):{" "}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={macroPercentageInputs.proteins}
              step={1}
              className="range range-primary bg-white w-max-64"
              onChange={(e) =>
                setMacroPercentageInputs({
                  ...macroPercentageInputs,
                  proteins: parseInt(e.target.value),
                })
              }
              onMouseDown={() => setShowSubmit(false)}
              onMouseUp={() => setShowSubmit(true)}
            />

            <label className="block text-white">
              Fats ({macroPercentageInputs.fats}%):{" "}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={macroPercentageInputs.fats}
              step={1}
              className="range range-primary bg-white w-max-64"
              onChange={(e) =>
                setMacroPercentageInputs({
                  ...macroPercentageInputs,
                  fats: parseInt(e.target.value),
                })
              }
              onMouseDown={() => setShowSubmit(false)}
              onMouseUp={() => setShowSubmit(true)}
            />
          </div>
        </div>

        <div className="flex flex-col items-center m-10">
          <h2 className="text-xl text-white">Pre-built Plans</h2>

          <div className="flex flex-col md:flex-row space-y-5 md:space-x-5 md:space-y-0 items-center justify-center mt-5">
            <button
              className="btn bg-gray-700 bg-opacity-30 w-32 h-32 p-5 rounded-lg flex flex-col items-center justify-center space-y-3"
              onClick={() => setMacroPercentageInputs(prebuitPlans["fat loss"])}
            >
              <h2 className="text-md text-white">Fat Loss</h2>
              <FaBurn className="text-red-500 text-3xl" />
            </button>

            <button
              className="btn bg-gray-700 bg-opacity-30 w-40 h-32 p-5 rounded-lg flex flex-col items-center justify-center space-y-3"
              onClick={() =>
                setMacroPercentageInputs(prebuitPlans["muscle gain"])
              }
            >
              <h2 className="text-md text-white">Muscle Gain</h2>
              <FaDumbbell className="text-orange-500 text-3xl" />
            </button>

            <button
              className="btn bg-gray-700 bg-opacity-30 w-32 h-32 p-5 rounded-lg flex flex-col items-center justify-center space-y-3"
              onClick={() =>
                setMacroPercentageInputs(prebuitPlans["weight loss"])
              }
            >
              <h2 className="text-md text-white">Weight Loss</h2>
              <FaWeight className="text-green-500 text-3xl" />
            </button>
          </div>
        </div>

        {/* Only show submit button and breakdown if the macros percentages add up to 100% */}
        {showSubmit &&
          (Object.values(macroPercentageInputs).reduce((a, b) => a + b) ===
          100 ? (
            <>
              <h3 className="mt-10 text-white text-lg">Daily Macro Targets</h3>
              <div className="w-full flex flex-col md:flex-row justify-center items-center space-x-20">
                <div className="space-y-4 mt-5 bg-gray-500 bg-opacity-30 p-5 rounded-lg">
                  <div className="flex items-center justify-between p-4 rounded-lg shadow-md text-white space-x-5">
                    <span className="font-semibold">Carbohydrates: </span>
                    <span className="text-lg">
                      {getMacroTarget("carbohydrates")} g
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4  rounded-lg shadow-md text-white space-x-5">
                    <span className="font-semibold">Proteins: </span>
                    <span className="text-lg">
                      {getMacroTarget("proteins")} g
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg shadow-md text-white space-x-5">
                    <span className="font-semibold">Fats: </span>
                    <span className="text-lg">{getMacroTarget("fats")} g</span>
                  </div>
                </div>

                <div>
                  <PieChart
                    chartData={{
                      "Carbohydrates (g)": getMacroTarget("carbohydrates"),
                      "Proteins (g)": getMacroTarget("proteins"),
                      "Fats (g)": getMacroTarget("fats"),
                    }}
                  />
                </div>
              </div>

              <div className="w-full flex justify-center mt-10">
                <button
                  type="submit"
                  className="btn btn-primary w-full max-w-md mt-10 bg-[#53ac00]"
                  onClick={handleSubmit}
                >
                  Submit
                </button>
              </div>
            </>
          ) : (
            <div>
              <p className="text-lg text-red-500 mt-10">
                The percentages must add up to 100%
              </p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default CaloriesGoalPage;
