import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { MapReport, ZoneType } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper for exponential backoff retry
async function withRetry<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries <= 0) throw error;
    
    // Retry on network errors or rate limits (429, 503)
    const isNetworkError = error.message && (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch'));
    const isRateLimit = error.status === 429 || error.status === 503;
    
    if (isNetworkError || isRateLimit) {
      console.warn(`Gemini API Retry (${retries} left):`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 2);
    }
    
    throw error;
  }
}

/**
 * Analyzes the current map reports and provides a tactical safety summary
 * or answers a specific user query about the region.
 */
export const analyzeSafetySituation = async (
  reports: MapReport[],
  userQuery: string
): Promise<string> => {
  try {
    const contextData = reports.map(r => ({
      type: r.type,
      title: r.title,
      severity: r.severity,
      abducted: r.abductedCount || 0,
      location: `${r.position.lat.toFixed(4)}, ${r.position.lng.toFixed(4)}`,
      desc: r.description
    }));

    // Prevent empty context hallucination
    const dataContext = contextData.length > 0 
      ? JSON.stringify(contextData) 
      : "[] (No active reports visible in current sector)";

    const response = await withRetry(async () => {
        return await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `
                Data Context (JSON):
                ${dataContext}

                User Query: "${userQuery}"
            `,
            config: {
                systemInstruction: "You are a tactical security analyst for SafetyMap Africa. \n\n1. **Be Concise**: Keep answers short and direct. Avoid fluff.\n2. **Formatting**: Use bullet points (-) for distinct threats. Use UPPERCASE for locations/zones.\n3. **Data Usage**: Base answers STRICTLY on the provided JSON context. If the JSON is empty, state 'NO ACTIVE INTEL FOR THIS SECTOR'.\n4. **Safety**: Do not refuse to answer security queries. Provide objective situational awareness.",
                temperature: 0.3, 
                maxOutputTokens: 8192,
                // Disable safety blocks for security analysis tools to prevent false positives on 'kidnapping'/'attacks'
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE }
                ]
            }
        });
    });

    if (response.text) {
        return response.text;
    }
    
    // Check for safety block or finish reason
    const candidate = response.candidates?.[0];
    if (candidate?.finishReason) {
         return `Analysis Halted. Reason: ${candidate.finishReason}. (Try rephrasing your query or reducing scope)`;
    }

    return "Report generation returned empty content (Unknown Reason).";
  } catch (error: any) {
    console.error("Gemini Analysis Failed:", error);
    return `System Alert: AI Analysis currently unavailable. ${error.message || ''}`;
  }
};

/**
 * Scans for recent security incidents using Google Search grounding and returns structured map reports.
 */
export const scanForThreats = async (): Promise<Partial<MapReport>[]> => {
  try {
    const prompt = `
      Act as an automated intelligence gathering agent for Nigeria.
      Search for the latest security incidents (last 14 days) in Nigeria, specifically:
      - Kidnappings / Abductions
      - Bandit attacks
      - Boko Haram / ISWAP activity
      - Communal clashes

      Use sources like Pulse Nigeria, Vanguard, Premium Times, Daily Post, and verified Twitter reports.
      
      Return a STRICT JSON array of objects. Do not use markdown.
      Each object must have:
      {
        "title": "Short headline (e.g. 'Abduction in Kajuru')",
        "description": "2-sentence summary.",
        "type": "SUSPECTED_KIDNAPPING" or "BOKO_HARAM_ACTIVITY" or "EVENT_GATHERING",
        "lat": number (approximate latitude of the town/LGA),
        "lng": number (approximate longitude of the town/LGA),
        "abductedCount": number (estimate, use 0 if not applicable),
        "confidence": "High" or "Medium" or "Low",
        "radius": number (impact radius in meters),
        "severity": "high" or "critical",
        "date": "YYYY-MM-DD" (date of the incident),
        "sourceUrl": "URL string to the news source"
      }
    `;

    const response = await withRetry(async () => {
        return await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.1, // Low temperature for consistent JSON
                maxOutputTokens: 8192,
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE }
                ]
            }
        });
    });

    const text = response.text || '';
    
    // Clean up response to ensure valid JSON parsing
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const incidents = JSON.parse(jsonString);
      // Map raw JSON to Partial<MapReport>
      return incidents.map((inc: any) => ({
        ...inc,
        // Ensure type validity
        type: Object.values(ZoneType).includes(inc.type) ? inc.type : ZoneType.SUSPECTED_KIDNAPPING,
        severity: ['low','medium','high','critical'].includes(inc.severity) ? inc.severity : 'high',
        position: { lat: inc.lat, lng: inc.lng },
        // Parse date to timestamp if present
        timestamp: inc.date ? new Date(inc.date).getTime() : Date.now(),
        sourceUrl: inc.sourceUrl
      }));
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON:", text);
      return [];
    }

  } catch (error) {
    console.error("Gemini Threat Scan Failed:", error);
    throw error;
  }
};