import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const itemName = body.itemName;

  //TODO: check user is logged in
  try {
    const response = await fetch(
        'https://trackapi.nutritionix.com/v2/natural/nutrients', 
        {
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json', 
            'x-app-id': process.env.NUTRITIONIX_APP_ID || '', 
            'x-app-key': process.env.NUTRITIONIX_API_KEY || ''
          }, 
          body: JSON.stringify({
            "query": itemName
          })
        }
      )

    const json = await response.json();
    
    if (response.ok){
        return NextResponse.json({macros: json.foods[0]});
    } else {
        console.log(json.messsage)
        return NextResponse.error();
    }
  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.error();
  }
}
