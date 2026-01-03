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

export async function sendToNotion(title: string, content: string, categories: string[]) {
  const notionApiKey = process.env.NOTION_API_KEY;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;
  const notionTitlePropertyName = process.env.NOTION_TITLE_PROPERTY_NAME || "Title";
  const notionContentPropertyName = process.env.NOTION_CONTENT_PROPERTY_NAME || "Note Content";
  const notionDateTimePropertyName = process.env.NOTION_DATETIME_PROPERTY_NAME || "Date & Time";
  const notionCategoryPropertyName = process.env.NOTION_CATEGORY_PROPERTY_NAME || "Category";


  if (!notionApiKey || !notionDatabaseId) {
    return { error: "Notion API Key or Database ID is not configured." };
  }

  const properties: any = {
    [notionTitlePropertyName]: {
      title: [
        {
          text: {
            content: title,
          },
        },
      ],
    },
    [notionDateTimePropertyName]: {
      date: {
        start: new Date().toISOString(),
      },
    },
    [notionContentPropertyName]: {
        rich_text: [
          {
            text: {
              content: content.substring(0, 2000), // Rich text has a 2000 char limit
            },
          },
        ],
    },
    [notionCategoryPropertyName]: {
        multi_select: categories.map(category => ({ name: category })),
    }
  };

  try {
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${notionApiKey}`,
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: notionDatabaseId },
        properties: properties,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Notion API Error:", errorData);
      throw new Error(errorData.message || "Failed to send data to Notion.");
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending to Notion:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { error: errorMessage };
  }
}
