import { getIngredients } from "@/app/speakMeal/utils";
import { Meal } from "@/app/types_db";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { saveMeal } from "../utils";


type ToolFunction = (args: any, supabase: SupabaseClient, user: User, dc: RTCDataChannel, callId: string, isQuickMode: boolean) => Promise<any>;
interface ToolFunctions {
    [key: string]: ToolFunction;
}

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
      type: "response.create",
      response: {
        modalities: ["text"],
        instructions: "Tell the user to review their meal before saving it",
      },
    })
  );

  if (!isQuickMode){
    return mealData;
  } else {
    return null;
  }
};

export const toolFunctions: ToolFunctions = {
    'save_meal': saveMealTool
}