import { getIngredients } from "@/app/speakMeal/utils";
import { Meal } from "@/app/types_db";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { saveMeal } from "../utils";
import { getTotals } from "@/app/Utils/helpers";


type ToolFunction = (args: any, supabase: SupabaseClient, user: User, dc: RTCDataChannel, callId: string, isQuickMode: boolean) => Promise<any>;
interface ToolFunctions {
    [key: string]: ToolFunction;
}

/**
 * Tool function to save a meal to the database
 */
const saveMealTool: ToolFunction = async (args: any, supabase: SupabaseClient, user: User, dc: RTCDataChannel, callId: string, isQuickMode: boolean) => {
  const description = args["description"];
  const extraction = await getIngredients(supabase, description);
  let response = "";
  let mealData: Meal | null = null;

  if (extraction == null) {
    //transcript was empty -> send error message as response back to the model
    console.error("Empty transcript");
    response = "Unable to save meal. Try again";

  } else if (extraction.error) {
    //error logging meal
    console.error(extraction.error);
    response = "Unable to save meal. Try again";
    
  } else {
    //extraction successful, add food items to the database
    mealData = {
      id: -1,
      created_at: "",
      owner_id: user !== null ? user.id : "",
      type: extraction.type,
      food_item: (extraction.foodData || []).map((item: any) => ({
        ...item,
        meal_id: -1,
      })),
    };

    if (isQuickMode){
      response = await saveMeal(supabase, mealData);
    }
  }

  //send response back to the model
  console.log("CALL ID: " + callId);
  dc.send(
    JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify({ response }),
      },
    })
  );

  //force model to reply after completion
  dc.send(
    JSON.stringify({
      type: "response.create"
    })
  );

  if (!isQuickMode){
    return mealData;
  } else {
    return null;
  }
};

/**
 * Get the total macronutrients and calories eaten for the target day
 */
const getMacroTotals: ToolFunction = async (args: any, supabase: SupabaseClient, user: User, dc: RTCDataChannel, callId: string, isQuickMode: boolean) => {
  //get timestamps for the start and end time of the target day
  const targetDate = new Date(args["targetDate"]);
  const startOfDay = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  );

  const endOfDay = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate() + 1
  );

  //get all of the user's meals from the database
  const {data: meals, error} = await supabase
    .from("meal")
    .select("*, food_item(*)");

  if (error){
    console.error("Error getting meals: " + error.message);
    dc.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify({ error: error.message }),
        },
      })
    );

    dc.send(
      JSON.stringify({
        type: "response.create"
      })
    );
    return null;
  }

  console.log(meals);
  
  //calculate the total macronutrients and calories for the day by filtering meals and summing values
  const totals = meals
    .filter(
      (meal) =>
        new Date(meal.created_at) >= startOfDay &&
        new Date(meal.created_at) <= endOfDay
    )
    .reduce(
      (acc, meal) => {
        console.log(">>> ");
        console.log(meal);
        const { carbs_g, protein_g, fat_g, calories } = getTotals(
          meal.food_item
        ); //get meal totals
        return {
          carbs_g: acc.carbs_g + carbs_g,
          protein_g: acc.protein_g + protein_g,
          fat_g: acc.fat_g + fat_g,
          calories: acc.calories + calories,
          calories_breakfast:
            meal.type === "Breakfast"
              ? acc.calories_breakfast + calories
              : acc.calories_breakfast,
          calories_lunch:
            meal.type === "Lunch"
              ? acc.calories_lunch + calories
              : acc.calories_lunch,
          calories_dinner:
            meal.type === "Dinner"
              ? acc.calories_dinner + calories
              : acc.calories_dinner,
          calories_snacks:
            meal.type === "Snack"
              ? acc.calories_snacks + calories
              : acc.calories_snacks,
        };
      },
      {
        carbs_g: 0,
        protein_g: 0,
        fat_g: 0,
        calories_breakfast: 0,
        calories_lunch: 0,
        calories_dinner: 0,
        calories_snacks: 0,
        calories: 0,
      }
    );

  //send response back to the model
  console.log("CALL ID: " + callId);
  dc.send(
    JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify(totals),
      },
    })
  );

  dc.send(
    JSON.stringify({
      type: "response.create"
    })
  );

  return null;
};

export const toolFunctions: ToolFunctions = {
    'save_meal': saveMealTool, 
    "get_macro_totals": getMacroTotals
}