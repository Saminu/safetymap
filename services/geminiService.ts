
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { MapReport, ZoneType } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const FIRECRAWL_API_KEY = 'fc-69724fa1974c4e1b88e329483042b346';

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
      console.warn(`API Retry (${retries} left):`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 2);
    }
    
    throw error;
  }
}

/**
 * Perform a search using Firecrawl API
 */
async function searchWithFirecrawl(queryStr: string): Promise<string> {
  const url = 'https://api.firecrawl.dev/v2/search';
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "query": queryStr,
      "sources": ["web"],
      "categories": [],
      "limit": 10,
      "scrapeOptions": {
          "onlyMainContent": false,
          "maxAge": 172800000,
          "parsers": ["pdf"],
          "formats": []
        }
    })
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (result.success && result.data && result.data.web) {
      // Map relevant fields to string context
      return result.data.web.map((item: any) => `
        SOURCE URL: ${item.url}
        TITLE: ${item.title}
        DESCRIPTION: ${item.description}
        SUMMARY: ${item.summary || 'N/A'}
        ---
      `).join('\n');
    }
    return '';
  } catch (error) {
    console.error(`Firecrawl search failed for "${queryStr}":`, error);
    return '';
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
                maxOutputTokens: 2048,
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
 * Scans for recent security incidents using Firecrawl (Web Scrape) -> Gemini (Processing).
 */
export const scanForThreats = async (): Promise<Partial<MapReport>[]> => {
  try {
    // 1. Gather Intelligence via Firecrawl
    const queries = [
        "bandits spotted nigeria",
        "kidnapping incident nigeria video",
        "boko haram attack footage nigeria",
        "communal clash nigeria news"
    ];

    console.log("Initiating Firecrawl Scan...");
    const searchPromises = queries.map(q => searchWithFirecrawl(q));
    const rawResults = await Promise.all(searchPromises);
    const aggregatedIntel = rawResults.join('\n\n');

    if (!aggregatedIntel.trim()) {
        console.warn("Firecrawl returned no results.");
        return [];
    }

    // 2. Process Intelligence via Gemini
    const prompt = `
      Act as an automated intelligence analyst.
      Analyze the following RAW WEB SEARCH DATA gathered from Firecrawl regarding security incidents in Nigeria.

      RAW DATA:
      ${aggregatedIntel}

      ---
      
      YOUR TASK:
      Extract confirmed security incidents into a STRICT JSON array.
      
      CRITICAL RULES:
      1. **Media Extraction**: 
         - Look for 'videoUrl' (URLs pointing to X.com/Twitter, YouTube, Facebook videos).
         - Look for 'imageUrl' (URLs pointing to article main images, jpg/png evidence).
         - Look for 'mediaUrls' (Any array of image/video evidence).
      2. **Geolocation**: Estimate the Lat/Lng based on the town/LGA mentioned.
      3. **Deduplication**: Do not create multiple entries for the same event found in different search results.
      4. **Dates**: Only include recent events (implied within last 7 days based on context).
      
      Output JSON Format:
      [
        {
            "title": "Short Headline",
            "description": "2-sentence summary.",
            "type": "SUSPECTED_KIDNAPPING" | "BOKO_HARAM_ACTIVITY" | "EVENT_GATHERING" | "MILITARY_CHECKPOINT",
            "lat": number,
            "lng": number,
            "abductedCount": number (0 if none),
            "confidence": "High" | "Medium",
            "radius": number (meters),
            "severity": "high" | "critical" | "medium",
            "sourceUrl": "URL of the article/page",
            "videoUrl": "URL of video evidence if found (otherwise null)",
            "imageUrl": "URL of image evidence if found (otherwise null)",
            "mediaUrls": ["url1", "url2"]
        }
      ]
    `;

    const response = await withRetry(async () => {
        return await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                temperature: 0.1,
                maxOutputTokens: 8192,
                responseMimeType: 'application/json',
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
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const incidents = JSON.parse(jsonString);
      
      // Post-processing to ensure data shape
      return incidents.map((inc: any) => ({
        ...inc,
        type: Object.values(ZoneType).includes(inc.type) ? inc.type : ZoneType.SUSPECTED_KIDNAPPING,
        severity: ['low','medium','high','critical'].includes(inc.severity) ? inc.severity : 'high',
        position: { lat: inc.lat, lng: inc.lng },
        timestamp: Date.now(), // Timestamp set to scan time
        sourceUrl: inc.sourceUrl,
        videoUrl: inc.videoUrl,
        imageUrl: inc.imageUrl,
        mediaUrls: inc.mediaUrls || []
      }));
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON:", text);
      return [];
    }

  } catch (error) {
    console.error("Gemini/Firecrawl Threat Scan Failed:", error);
    throw error;
  }
};

export const identifyDuplicates = async (reports: MapReport[]): Promise<string[]> => {
    // (Existing duplicate logic preserved)
    if (reports.length < 2) return [];
    try {
        const simplifiedReports = reports.map(r => ({
            id: r.id,
            title: r.title,
            desc: r.description.substring(0, 100),
            loc: `${r.position.lat.toFixed(3)},${r.position.lng.toFixed(3)}`,
            date: new Date(r.timestamp).toISOString().split('T')[0],
            source: r.sourceUrl || ''
        }));
        const prompt = `
            You are a Data Deduplication Expert.
            Analyze this JSON list of security reports.
            Identify groups of reports that refer to the EXACT SAME real-world incident.
            For each duplicate group, keep the one that appears most detailed or has a source URL.
            Return a JSON object: { "duplicateIds": ["id_to_delete_1", "id_to_delete_2"] }
            
            Input Data:
            ${JSON.stringify(simplifiedReports)}
        `;
        const response = await withRetry(async () => {
            return await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.1,
                    maxOutputTokens: 4096,
                }
            });
        });
        const text = response.text || '{}';
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(jsonString);
        return result.duplicateIds || [];
    } catch (error) {
        return [];
    }
};
