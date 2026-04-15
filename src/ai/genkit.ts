import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const hasGoogleAIKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

export const ai = genkit({
  plugins: hasGoogleAIKey ? [googleAI()] : [],
  model: hasGoogleAIKey ? 'googleai/gemini-2.5-flash' : undefined,
});

export const aiAvailable = hasGoogleAIKey;
