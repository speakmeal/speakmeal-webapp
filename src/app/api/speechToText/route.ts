import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { validateRequest } from "../utils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  // check if request is valid
  const validationResult = await validateRequest(req);

  if (!validationResult[0]) {
    console.error(validationResult);
    return NextResponse.json(
      {
        message: validationResult[1],
      },
      { 
        status: 500 
      }
    );
  }

  const body = await req.json();
  const base64Audio = body.audio;
  console.log(base64Audio);

  // Convert the base64 audio data to a Buffer
  const audioBuffer = Buffer.from(base64Audio, "base64");

  try {
    const response = await openai.audio.transcriptions.create({
      file: await toFile(audioBuffer, "", {
        type: "audio/wav"
      }),
      temperature: 0.1,
      model: "whisper-1", 
    });
    
    return NextResponse.json(response);

  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.error();
  }
}
