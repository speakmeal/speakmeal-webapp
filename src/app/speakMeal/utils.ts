import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Extract ingredients and macros given a trascript or description of the meal
 * @param supabase supabase client object
 * @param transcript transcript or description of meal eaten by user
 * @param setIsLoading function to toggle appropriate loading indicator
 * @returns list of food items extracted from the transcript
 */
export async function getIngredients(supabase: SupabaseClient, transcript: string, ) {
    console.log("Transcript: " + transcript);

    //ensure transcript is not empty
    if (!transcript || transcript.length === 0) {
      return null;
    }

    //use API get 'atomic' ingredients (foods)
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
      return {
        error: "Error processing transcript"
      };
    }

    const resp = await response.json();
    const { type, foods } = await JSON.parse(resp.response);
    console.log(foods);

    //for each ingredient (food) get its macro nutrients using the food database
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

    //return list of food items with their macro nutrients
    return {
        foodData, 
        type
    };
  }