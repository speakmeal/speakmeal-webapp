import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const transcript = body.transcript;

  console.log(transcript);
  //TODO: check user is logged in
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a smart, expert nutritional assistant. The user will provide a description of their meal, and you must extract all
                      of the ingredients from their meal, along with their estimated doses. As well as the dose, you must always extract the weight in grams. 

                      If the user gives the name of a dish, you must break it down into its individual ingridients. For example if they said 'poorade' you would need to extract 'oats' and 'milk'. 
                      If the doses are not provided explicitly, infer them by using the typical doses for those foods. You must include all of the foods mentioned. 
                      You must also determine the type of meal, which can be one of: 'Breakfast', 'Lunch', 'Dinner' or 'Snack'. 
                      Give the output in JSON format with no spaces or blank lines. 

                      Ensure that the response is a JSON object with the following format:
                      {
                        'type': type of meal ('Breakfast', 'Lunch', 'Dinner' or 'Snack'), 
                        'foods': list of food items eaten, with the following format:
                            [
                                {
                                    'food_name': name of food item,
                                    'dose': dose eaten, 
                                    'weight': weight of dose in grams, as a number
                                }
                            ]
                      }
                      Follow this format without deviation.`,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" },
    });
    
    return NextResponse.json({ response: completion.choices[0].message.content });

  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.error();
  }
}
