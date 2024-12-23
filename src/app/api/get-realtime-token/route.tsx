import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "../utils";


/**
 * Endpoint to get ephemeral key for realtime API to be used in the front-end
 * @param req the request received
 * @returns response with the ephemeral key
 */
export async function GET(req: NextRequest) {
  // check if request is valid
  const validationResult = await validateRequest(req);

  if (!validationResult[0]) {
    console.error(validationResult);
    return NextResponse.json(
      {
        message: validationResult[1],
      },
      {
        status: 500,
      }
    );
  }

  try {
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview", //model to be used
        voice: "verse",
      }),
    });
    const data = await r.json();
    return NextResponse.json({ key: data.client_secret.value });
  } catch (err) {
    console.error("Error getting realtime token: " + err);
    return NextResponse.error();
  }
}
