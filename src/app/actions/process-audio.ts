"use server";

import { transcribeAudio } from "@/ai/flows/transcribe-audio";
import { cleanAndSummarizeTranscript } from "@/ai/flows/clean-and-summarize";

const CATEGORIES = ["AI", "Teaching", "ToDo", "Food", "Music", "Other"];

export async function processAudio(audioDataUri: string) {
  try {
    // 1. Transcribe Audio
    const { transcription } = await transcribeAudio({ audioDataUri });

    if (!transcription) {
      throw new Error("Transcription failed. The audio might be silent or unclear.");
    }

    // 2. Clean, Summarize, and Categorize
    const { cleanedTranscript, title, categories } = await cleanAndSummarizeTranscript({
      transcript: transcription,
      categories: CATEGORIES,
    });

    return { note: { title, content: cleanedTranscript, categories } };
  } catch (error) {
    console.error("Error processing audio:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { error: `AI processing failed: ${errorMessage}` };
  }
}
