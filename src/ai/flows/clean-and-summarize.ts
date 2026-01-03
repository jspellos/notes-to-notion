'use server';

/**
 * @fileOverview Cleans a transcript and generates a concise title.
 *
 * - cleanAndSummarizeTranscript - Cleans the transcript, fixes grammar, and generates a 5-word title.
 * - CleanAndSummarizeTranscriptInput - The input type for the cleanAndSummarizeTranscript function.
 * - CleanAndSummarizeTranscriptOutput - The return type for the cleanAndSummarizeTranscript function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CleanAndSummarizeTranscriptInputSchema = z.object({
  transcript: z.string().describe('The transcript to clean and summarize.'),
});
export type CleanAndSummarizeTranscriptInput = z.infer<typeof CleanAndSummarizeTranscriptInputSchema>;

const CleanAndSummarizeTranscriptOutputSchema = z.object({
  cleanedTranscript: z.string().describe('The cleaned transcript with filler words removed and grammar fixed.'),
  title: z.string().describe('A concise 5-word title generated from the transcript.'),
});
export type CleanAndSummarizeTranscriptOutput = z.infer<typeof CleanAndSummarizeTranscriptOutputSchema>;

export async function cleanAndSummarizeTranscript(input: CleanAndSummarizeTranscriptInput): Promise<CleanAndSummarizeTranscriptOutput> {
  return cleanAndSummarizeTranscriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cleanAndSummarizeTranscriptPrompt',
  input: {schema: CleanAndSummarizeTranscriptInputSchema},
  output: {schema: CleanAndSummarizeTranscriptOutputSchema},
  prompt: `You are an AI assistant tasked with cleaning up a transcript and generating a title for it.\n\nClean the transcript by removing filler words like \"um\" and fixing any grammar errors. Then, generate a concise 5-word title that accurately reflects the content of the cleaned transcript.\n\nTranscript: {{{transcript}}}`,
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
