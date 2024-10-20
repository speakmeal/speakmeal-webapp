"use client";
import { useEffect, useState, useRef } from "react";
import { blobToBase64 } from "@/app/Utils/openAI/blobToBase64"
import { SupabaseClient } from "@supabase/supabase-js";

interface Props {
  callback: (transcript: string) => Promise<void>;
  supabase: SupabaseClient
};

export const useRecordVoice = ({ callback, supabase }: Props) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chunks = useRef([]);

  const startRecording = (triggerAlert: (message: string, type: string) => void ) => {
    if (mediaRecorder) {
      mediaRecorder.start(1000);
      setRecording(true);
    } else {
      triggerAlert("Could not find a microphone", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const getText = async (base64data: any) => {
    setIsLoading(true);
    const session = await supabase.auth.getSession();

    try {
      const response = await fetch("/api/speechToText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify({
          audio: base64data,
        }),
      }).then((res) => res.json());

      const { text } = response;
      console.log('Text: ' + text);
      await callback(text);
      setIsLoading(false);

    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const initialMediaRecorder = (stream: MediaStream) => {
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.onstart = () => {
      chunks.current = [];
    };

    mediaRecorder.ondataavailable = (ev) => {
      chunks.current.push(ev.data as never);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(chunks.current, { type: "audio/wav" });
      blobToBase64(audioBlob, getText);
    };

    setMediaRecorder(mediaRecorder);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(initialMediaRecorder);
    }
  }, []);

  return { recording, startRecording, stopRecording, isLoading };
};