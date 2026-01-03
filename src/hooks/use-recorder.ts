"use client";

import { useState, useRef } from "react";

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    if (isRecording) {
      console.warn("Recording is already in progress.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstart = () => {
        setIsRecording(true);
      };

      recorder.start();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      throw error;
    }
  };

  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || !isRecording) {
        return reject("Recording not started or already stopped.");
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];
        setIsRecording(false);

        // Stop all tracks on the stream to turn off the mic indicator
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

        resolve(audioBlob);
      };

      mediaRecorderRef.current.onerror = (event) => {
        reject(event);
      };
      
      mediaRecorderRef.current.stop();
    });
  };

  return { isRecording, startRecording, stopRecording };
}
