'use server';

/**
 * @fileOverview Cleans a transcript, generates a concise title, and selects categories.
 *
 * - cleanAndSummarizeTranscript - Cleans the transcript, fixes grammar, generates a 5-word title, and categorizes the content.
 * - CleanAndSummarizeTranscriptInput - The input type for the cleanAndSummarizeTranscript function.
 * - CleanAndSummarizeTranscriptOutput - The return type for the cleanAndSummarizeTranscript function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CleanAndSummarizeTranscriptInputSchema = z.object({
  transcript: z.string().describe('The transcript to clean and summarize.'),
  categories: z.array(z.string()).describe('A list of categories to choose from.'),
});
export type CleanAndSummarizeTranscriptInput = z.infer<typeof CleanAndSummarizeTranscriptInputSchema>;

const CleanAndSummarizeTranscriptOutputSchema = z.object({
  cleanedTranscript: z.string().describe('The cleaned transcript with filler words removed and grammar fixed.'),
  title: z.string().describe('A concise 5-word title generated from the transcript.'),
  categories: z.array(z.string()).describe('One or more relevant categories selected from the provided list.'),
});
export type CleanAndSummarizeTranscriptOutput = z.infer<typeof CleanAndSummarizeTranscriptOutputSchema>;

export async function cleanAndSummarizeTranscript(input: CleanAndSummarizeTranscriptInput): Promise<CleanAndSummarizeTranscriptOutput> {
  return cleanAndSummarizeTranscriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cleanAndSummarizeTranscriptPrompt',
  input: {schema: CleanAndSummarizeTranscriptInputSchema},
  output: {schema: CleanAndSummarizeTranscriptOutputSchema},
  prompt: `You are an AI assistant tasked with cleaning up a transcript, generating a title, and categorizing it.

1.  **Clean Transcript**: Remove filler words (like "um") and fix grammar errors.
2.  **Generate Title**: Create a concise 5-word title that accurately reflects the content.
3.  **Categorize**: Review the cleaned transcript and select one or more of the most relevant categories from the following list.

Available Categories: {{{json categories}}}

Transcript: {{{transcript}}}`,
});

const cleanAndSummarizeTranscriptFlow = ai.defineFlow(
  {
    name: 'cleanAndSummarizeTranscriptFlow',
    inputSchema: CleanAndSummarizeTranscriptInputSchema,
    outputSchema: CleanAndSummarizeTranscriptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
