"use client";

import {
  emptyMeal,
  Meal
} from "@/app/types_db";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/app/Components/Alert/useAlert";
import Alert from "@/app/Components/Alert/Alert";
import LoadingIndicator from "@/app/Components/LoadingIndicator";
import { createClient } from "@/app/Utils/supabase/client";
import MealPage from "../MealPage";

//Note: to create a new meal, the id is set to 'new'
interface Params {
  id: string;
}

interface RouteParams {
  params: Params;
}

const NewMeal: React.FC<RouteParams> = ({ params: { id } }: RouteParams) => {
  const [mealData, setMealData] = useState<Meal>(emptyMeal); //determine the type of meal being added

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showAlert, message, type, triggerAlert } = useAlert();

  const supabase = createClient();
  const router = useRouter();

  //load meal data on page load if necessary
  const onPageLoad = async () => {
    setIsLoading(true);

    if (!isNaN(parseInt(id))) {
      //if id is a valid number, then user wants to edit existing meal
      //hence, load the information for the meal selected
      const { data: meal, error: mealError } = await supabase
        .from("meal")
        .select("*, food_item(*)")
        .eq("id", parseInt(id))
        .single();

      if (mealError) {
        setIsLoading(false);
        triggerAlert(mealError.message, "error");
        return;
      }
      setMealData(meal);
      setIsLoading(false);

    } else {
      //id is some text that is not /new (invalid)
      if (id !== "new") {
        router.push("/dashboard");
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    onPageLoad();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center bg-black">
        {showAlert && <Alert message={message} type={type} />}
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <MealPage mealDataProp={mealData} isNew={id === "new"} hasNavbar={true}/>
  );
};

export default NewMeal;