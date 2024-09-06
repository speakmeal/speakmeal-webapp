"use client";
import { useEffect, useState } from "react";
import DashSidebar from "../Components/DashSidebar";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useAlert } from "../Components/Alert/useAlert";
import LoadingIndicator from "../Components/LoadingIndicator";
import { Measurement } from "../types_db";
import { createClient } from "../Utils/supabase/client";
import { useRouter } from "next/navigation";
import Alert from "../Components/Alert/Alert";
import { FaBurn, FaDumbbell, FaWeight } from "react-icons/fa";

interface MacroPercentageInputs {
  carbohydrates: number;
  proteins: number;
  fats: number;
}

const prebuitPlans = {
  'fat loss': {
    carbohydrates: 25, 
    proteins: 45, 
    fats: 30
  }, 
  'muscle gain': {
    carbohydrates: 45, 
    proteins: 35, 
    fats: 20
  }, 
  'weight loss': {
    carbohydrates: 30,
    proteins: 40, 
    fats: 30
  }
};

const Goals: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showAlert, message, type, triggerAlert } = useAlert();

  const [startingMeasurement, setStartingMeasurement] =
    useState<Measurement | null>(null);
  const [endingMeasurement, setEndingMeasurement] =
    useState<Measurement | null>(null);
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState<number>(0);
  const [macroPercentageInputs, setMacroPercentageInputs] =
    useState<MacroPercentageInputs>({
      carbohydrates: 60,
      proteins: 30,
      fats: 10,
    });
  const [showGoalsSave, setShowGoalsSave] = useState<boolean>(true);

  const supabase = createClient();
  const router = useRouter();

  const caloriesPerGram = {
    carbohydrates: 4,
    proteins: 4,
    fats: 9,
  };

  /**
   * Using the total amount of calories eaten per day and the percentage of the total calories associated with a macro,
   * calculate the amount of grams that should be consumed for that macro.
   * This assumes:
   *    - 1g of carbs = 4 calories
   *    - 1g of protein = 4 calories
   *    - 1g of fat = 9 calories
   * @param macro
   */
  const getMacroTargetGrams = (macro: keyof MacroPercentageInputs) => {
    const macroPercentage = macroPercentageInputs[macro];

    return Math.round(
      ((dailyCalorieGoal / 100) * macroPercentage) / caloriesPerGram[macro]
    );
  };

  /**
   * Inverse of 'getMacroTargetGrams'
   * @param macro 
   * @param totalCalories 
   */
  const getMacroTargetPercentage = (macro: keyof MacroPercentageInputs, macroTargetG: number, totalCalories: number) => {
    console.log(macroTargetG * caloriesPerGram[macro])
    return Math.round(((macroTargetG * caloriesPerGram[macro]) / totalCalories) * 100);
  }

  /**
   * Save Calorie and nutrient goals to the database
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
        carbohydrates_grams_goal: getMacroTargetGrams("carbohydrates"),
        protein_grams_goal: getMacroTargetGrams("proteins"),
        fat_grams_goal: getMacroTargetGrams("fats"),
      })
      .eq("id", user?.id);

    if (error) {
      triggerAlert(error.message, "error");
      setIsLoading(false);
    }

    router.push("/dashboard");
  };

  /**
   * Get span to display change in the value of a measurement
   * @param change absolute change in the value
   * @param percentageChange percentage change in the value
   * @returns span with a formatted change label
   */
  const getChangeIndicator = (change: number, percentageChange: number) => {
    if (change > 0) {
      return (
        <span className="text-green-500">
          ⬆️ {change.toFixed(2)}{" "}
          <span className="text-sm">(+{percentageChange.toFixed(2)}%)</span>
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="text-red-500">
          ⬇️ {change.toFixed(2)}{" "}
          <span className="text-sm">(-{percentageChange.toFixed(2)}%)</span>
        </span>
      );
    } else {
      return <span className="text-gray-500">-</span>;
    }
  };

  /**
   * Load the existing goals saved by the user when the page loads
   */
  const onPageLoad = async () => {
    setIsLoading(true);

    //get all of the user's measurements to have access to the starting and final ones
    const { data: measurements, error: measurementError } = await supabase
      .from("measurement")
      .select("*")
      .order("created_at", { ascending: true });

    if (measurementError) {
      triggerAlert(measurementError.message, "error");
      setIsLoading(false);
      return;
    }

    if (measurements.length > 0) {
      setStartingMeasurement(measurements[0]);
      setEndingMeasurement(measurements[measurements.length - 1]);
    }

    //get the user's nutritional targets
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .single();

    if (profileError) {
      triggerAlert(profileError.message, "error");
      setIsLoading(false);
      return;
    }
    
    setDailyCalorieGoal(profile.target_daily_calories);

    //recover percentages for nutrients from the gram values stored in the database
    setMacroPercentageInputs({
      carbohydrates: getMacroTargetPercentage('carbohydrates', profile.carbohydrates_grams_goal, profile.target_daily_calories), 
      proteins: getMacroTargetPercentage('proteins', profile.protein_grams_goal, profile.target_daily_calories), 
      fats: getMacroTargetPercentage('fats', profile.fat_grams_goal, profile.target_daily_calories)
    })

    setIsLoading(false);
  };

  useEffect(() => {
    onPageLoad();
  }, []);

  //mapping of measurement keys, descriptions and emojis
  const metrics = [
    { key: "height_cm", label: "Height", emoji: "📏" },
    { key: "weight_kg", label: "Weight", emoji: "⚖️" },
    { key: "abdomen_cm", label: "Abdomen", emoji: "🧍‍♂️" },
    { key: "hip_cm", label: "Hip", emoji: "🍑" },
    { key: "chest_cm", label: "Chest", emoji: "💪" },
  ];

  return (
    <div className="flex w-full min-h-screen bg-black">
      <DashSidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        location="/goals"
      />

      {!isSidebarOpen && (
        <div className="flex flex-1 flex-col">
          <header className="flex justify-between items-center px-6 py-4 rounded-lg m-4">
            <button className="md:hidden mr-5" onClick={toggleSidebar}>
              <Bars3Icon className="h-6 w-6 text-white" />
            </button>
          </header>

          {isLoading ? (
            <div className="h-screen flex justify-center items-center">
              <LoadingIndicator />
            </div>
          ) : (
            <div>
              <h1 className="text-4xl font-semibold text-center text-white">
                Progress
              </h1>

              {startingMeasurement && endingMeasurement ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center mt-20">
                  {metrics.map(({ key, label, emoji }) => {
                    const change =
                      (endingMeasurement[key as keyof Measurement] as number) -
                      (startingMeasurement[key as keyof Measurement] as number);

                    const percentageChange =
                      (change /
                        (startingMeasurement[
                          key as keyof Measurement
                        ] as number)) *
                      100;

                    return (
                      <div
                        key={key}
                        className="w-60 bg-gray-800 text-white p-4 rounded-lg shadow-lg h-40"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-3xl">{emoji}</span>
                          <span className="text-lg">{label}</span>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm">
                            Start:{" "}
                            <span className="font-bold">
                              {startingMeasurement[key as keyof Measurement]}
                            </span>
                          </p>
                          <p className="text-sm">
                            Current:{" "}
                            <span className="font-bold">
                              {endingMeasurement[key as keyof Measurement]}
                            </span>
                          </p>
                          <p className="text-sm mt-2">
                            Change:{" "}
                            {getChangeIndicator(change, percentageChange)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center mt-20 border-2 py-5 mx-20">
                  <h2>You have not taken any measurements yet</h2>
                  <button
                    className="btn btn-primary rounded-full mt-5 w-32"
                    onClick={() => router.push("/measurements/new")}
                  >
                    Do it now
                  </button>
                </div>
              )}

              <h1 className="text-4xl font-semibold text-center mt-20 text-white">
                Goals
              </h1>

              <div className="flex flex-col items-center mt-5">
                <div className="flex flex-col md:flex-row space-y-1 md:space-x-5 md:space-y-0 w-full justify-center items-center">
                  <label className="text-xl text-white">
                    Daily Calorie Goal:{" "}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={10000}
                    value={dailyCalorieGoal}
                    step={1}
                    className="range range-primary bg-white w-64"
                    onChange={(e) =>
                      setDailyCalorieGoal(parseInt(e.target.value))
                    }
                  />
                  <p className="text-white">{dailyCalorieGoal} kcal</p>
                </div>

                <div className="mt-10 flex flex-col w-full items-center">
                  <h2 className="text-xl text-white">
                    Custom Macro Nutrient Breakdown
                  </h2>

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
                      onMouseDown={() => setShowGoalsSave(false)}
                      onMouseUp={() => setShowGoalsSave(true)}
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
                      onMouseDown={() => setShowGoalsSave(false)}
                      onMouseUp={() => setShowGoalsSave(true)}
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
                      onMouseDown={() => setShowGoalsSave(false)}
                      onMouseUp={() => setShowGoalsSave(true)}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center m-10">
                  <h2 className="text-xl text-white">Pre-built Plans</h2>

                  <div className="flex flex-col md:flex-row space-y-5 md:space-x-5 md:space-y-0 items-center justify-center mt-5">
                    <button className="btn bg-gray-700 bg-opacity-30 w-32 h-32 p-5 rounded-lg flex flex-col items-center justify-center space-y-3"
                            onClick={() => setMacroPercentageInputs(prebuitPlans['fat loss'])}>
                      <h2 className="text-md text-white">Fat Loss</h2>
                      <FaBurn className="text-red-500 text-3xl"/>
                    </button>

                    <button className="btn bg-gray-700 bg-opacity-30 w-40 h-32 p-5 rounded-lg flex flex-col items-center justify-center space-y-3"
                            onClick={() => setMacroPercentageInputs(prebuitPlans['muscle gain'])}>
                      <h2 className="text-md text-white">Muscle Gain</h2>
                      <FaDumbbell className="text-orange-500 text-3xl"/>
                    </button>

                    <button className="btn bg-gray-700 bg-opacity-30 w-32 h-32 p-5 rounded-lg flex flex-col items-center justify-center space-y-3"
                            onClick={() => setMacroPercentageInputs(prebuitPlans['weight loss'])}>
                      <h2 className="text-md text-white">Weight Loss</h2>
                      <FaWeight className="text-green-500 text-3xl"/>
                    </button>
                  </div>
                </div>

                {/* Only show submit button and breakdown if the macros percentages add up to 100% */}
                {showGoalsSave &&
                  (Object.values(macroPercentageInputs).reduce(
                    (a, b) => a + b
                  ) === 100 ? (
                    <>
                      <h3 className="mt-10 text-white text-xl">
                        Daily Macro Targets
                      </h3>
                      <div className="w-full flex flex-col md:flex-row justify-center items-center space-x-20">
                        <div className="space-y-4 mt-5 bg-gray-500 bg-opacity-30 p-5 rounded-lg">
                          <div className="flex items-center justify-between p-4 rounded-lg shadow-md text-white space-x-5">
                            <span className="font-semibold">
                              Carbohydrates:{" "}
                            </span>
                            <span className="text-lg">
                              {getMacroTargetGrams("carbohydrates")} g
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-4  rounded-lg shadow-md text-white space-x-5">
                            <span className="font-semibold">Proteins: </span>
                            <span className="text-lg">
                              {getMacroTargetGrams("proteins")} g
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-lg shadow-md text-white space-x-5">
                            <span className="font-semibold">Fats: </span>
                            <span className="text-lg">
                              {getMacroTargetGrams("fats")} g
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full flex justify-center mt-5 p-5">
                        <button
                          type="submit"
                          className="btn btn-primary w-full max-w-md mt-10 bg-[#4F19D6]"
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
          )}
        </div>
      )}

      {showAlert && <Alert message={message} type={type} />}
    </div>
  );
};

export default Goals;
