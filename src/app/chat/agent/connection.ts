import { Meal } from "@/app/types_db";
import { createClient } from "@/app/Utils/supabase/client";
import { toolFunctions } from "./tools";
import { generateSystemPrompt } from "./utils";

/**
 * Start new session with the open ai realtime api
 */
export async function init(
  setConnection: React.Dispatch<React.SetStateAction<RTCPeerConnection | null>>,
  setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>,
  setIsMicLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setExtractedMealData: React.Dispatch<React.SetStateAction<Meal | null>>,
  isQuickMode: boolean
) {
  //get supabase auth token
  const supabase = createClient();
  const session = await supabase.auth.getSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const supabaseToken = session.data.session?.access_token;

  //get ephemeral auth token from backend for open ai api
  const resp = await fetch("/api/get-realtime-token", {
    headers: {
      Authorization: `Bearer ${supabaseToken}`,
    },
  });
  const data = await resp.json();
  const EPHEMERAL_KEY = data.key;
  console.log("<<< Got key: " + EPHEMERAL_KEY);

  //create a peer connection
  const pc = new RTCPeerConnection();

  //set up to play remote audio from the model
  const audioEl = document.createElement("audio");
  audioEl.autoplay = true;
  pc.ontrack = (e) => (audioEl.srcObject = e.streams[0]);

  //add local audio track for microphone input in the browser
  const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
  pc.addTrack(ms.getTracks()[0]);

  //set up data channel for sending and receiving events
  const dc = pc.createDataChannel("oai-events");

  //send message to set up model (system prompt + tools), when connection opens
  const systemPrompt = await generateSystemPrompt(supabase);
  dc.addEventListener("open", () => {
    //set the system prompt once the channel is open
    const setUp = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: systemPrompt,
        tools: [
          {
            type: "function",
            name: "save_meal",
            description: `Use this tool to save a description of the user's meal. This must include the meal type ('lunch', 'dinner', 'breakfast' or 'snack'), as well as all foods and their quantities.`,
            parameters: {
              type: "object",
              properties: {
                description: { type: "string" },
              },
              required: ["description"],
            },
          },
          {
            type: "function",
            name: "get_macro_totals",
            description: `Use this tool to get the total macronutrient intake for a specific day. Provide the target date in the format 'YYYY-MM-DD'`,
            parameters: {
              type: "object",
              properties: {
                targetDate: { type: "string" },
              },
              required: ["targetDate"],
            },
          },
        ],
        tool_choice: "auto",
        voice: "verse",
      },
    };

    dc.send(JSON.stringify(setUp));
  });

  //listen for realtime server events
  dc.addEventListener("message", async (e) => {
    console.log(e);

    try {
      const data = await JSON.parse(e.data);
      if (data.response) console.log(data.response);

      //handle tool function calls
      if (data.type === "response.function_call_arguments.done") {
        setIsMicLoading(true);
        const functionName = data.name;
        const args = await JSON.parse(data.arguments);
        console.log("<<< Handling function call: " + functionName);

        const fn = toolFunctions[functionName];
        if (fn) {
          const resp = await fn(
            args,
            supabase,
            user!,
            dc,
            data.call_id,
            isQuickMode
          );
          if (!isQuickMode && resp) {
            setExtractedMealData(resp);
          }
        } else {
          console.error("Unknown function: " + functionName);
        }

        setIsMicLoading(false);
      }
    } catch (err) {
      console.log("Event error: " + err);
    }
  });

  //start the session using the Session Description Protocol (SDP)
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const model = "gpt-4o-mini-realtime-preview";
  const sdpResponse = await fetch(
    `https://api.openai.com/v1/realtime?model=${model}`,
    {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    }
  );

  const answer: RTCSessionDescriptionInit = {
    type: "answer",
    sdp: await sdpResponse.text(),
  };
  await pc.setRemoteDescription(answer);

  setConnection(pc);
  setStream(ms);
}

/**
 * Stop existing connection
 */
export function stop(pc: RTCPeerConnection, localStream: MediaStream) {
  //remove all tracks in connection and close it
  if (pc) {
    pc.getSenders().forEach((sender) => pc.removeTrack(sender));
    pc.close();
  }

  //remove all tracks in local media stream
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }
}
