
import { GoogleGenAI } from "@google/genai";
import { MapReport, ZoneType } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    const prompt = `
      You are a tactical security analyst for SafetyMap Africa. 
      Here is the current situational report data on the map (JSON format):
      ${JSON.stringify(contextData)}

      User Query: "${userQuery}"

      Based on the data provided and your general knowledge of the region (Nigeria/Africa), provide a concise, tactical response.
      If the user asks about safety, reference specific nearby markers if relevant.
      Keep the tone professional, alert, and objective.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.4, 
        maxOutputTokens: 500,
      }
    });

    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return "System Alert: AI Analysis currently unavailable due to network or API restrictions.";
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Low temperature for consistent JSON
      }
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
