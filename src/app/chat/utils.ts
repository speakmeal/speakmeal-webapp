import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "../Utils/supabase/client";
import { getIngredients } from "../speakMeal/utils";
import { FoodItem, Meal } from "../types_db";


/**
 * Save the meal to the database (save_meal tool)
 */
export const saveMeal = async (supabase: SupabaseClient, mealData: Meal) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  //add entry to database for new meal
  const { data: dbMeal, error: mealError } = await supabase
    .from("meal")
    .insert({ type: mealData.type, owner_id: user?.id })
    .select()
    .single();

  if (mealError) {
    console.error(mealError);
    return mealError.message;
  }

  //add new entry for each food item in the new meal
  const foodItems = mealData.food_item;
  const { error: itemsError } = await supabase.from("food_item").insert(
    foodItems.map((item) => ({
      food_name: item.food_name,
      carbs_g: item.carbs_g,
      protein_g: item.protein_g,
      fat_g: item.fat_g,
      calories: item.calories,
      meal_id: dbMeal.id,
    }))
  );

  if (itemsError) {
    console.error(itemsError);
    return itemsError.message;
  }

  return "Meal saved successfully";
};
