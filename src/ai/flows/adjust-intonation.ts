'use server';

/**
 * @fileOverview This file defines a Genkit flow for adjusting intonation and emphasis in text-to-speech conversion.
 *
 * - adjustIntonation - A function that converts text to speech with intelligent intonation adjustments.
 * - AdjustIntonationInput - The input type for the adjustIntonation function.
 * - AdjustIntonationOutput - The return type for the adjustIntonation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const AdjustIntonationInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
  voiceName: z.string().optional().describe('The name of the voice to use (optional).'),
});
export type AdjustIntonationInput = z.infer<typeof AdjustIntonationInputSchema>;

const AdjustIntonationOutputSchema = z.object({
  media: z.string().describe('The audio data URI in WAV format.'),
});
export type AdjustIntonationOutput = z.infer<typeof AdjustIntonationOutputSchema>;

export async function adjustIntonation(input: AdjustIntonationInput): Promise<AdjustIntonationOutput> {
  return adjustIntonationFlow(input);
}

const adjustIntonationFlow = ai.defineFlow(
  {
    name: 'adjustIntonationFlow',
    inputSchema: AdjustIntonationInputSchema,
    outputSchema: AdjustIntonationOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: input.voiceName || 'Algenib' },
          },
        },
      },
      prompt: input.text,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
