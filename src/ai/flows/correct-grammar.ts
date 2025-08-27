'use server';

/**
 * @fileOverview This file defines a Genkit flow for correcting grammar and spelling in a given text.
 *
 * - correctGrammar - A function that corrects grammatical errors in text.
 * - CorrectGrammarInput - The input type for the correctGrammar function.
 * - CorrectGrammarOutput - The return type for the correctGrammar function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectGrammarInputSchema = z.object({
  text: z.string().describe('The text to be checked for grammar and spelling errors.'),
});
export type CorrectGrammarInput = z.infer<typeof CorrectGrammarInputSchema>;

const CorrectGrammarOutputSchema = z.object({
  correctedText: z.string().describe('The text with grammar and spelling corrections applied.'),
});
export type CorrectGrammarOutput = z.infer<typeof CorrectGrammarOutputSchema>;

export async function correctGrammar(input: CorrectGrammarInput): Promise<CorrectGrammarOutput> {
  return correctGrammarFlow(input);
}

const prompt = ai.definePrompt({
  name: 'correctGrammarPrompt',
  input: {schema: CorrectGrammarInputSchema},
  output: {schema: CorrectGrammarOutputSchema},
  prompt: `You are an expert English teacher. Please correct the grammar and spelling of the following text. Only return the corrected text.

Text:
{{{text}}}

Return the corrected text in the 'correctedText' field.`,
});

const correctGrammarFlow = ai.defineFlow(
  {
    name: 'correctGrammarFlow',
    inputSchema: CorrectGrammarInputSchema,
    outputSchema: CorrectGrammarOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
