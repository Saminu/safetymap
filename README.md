
# SafetyMap Africa 🌍🛡️

![SafetyMap Interface](screenshot.png)

**A collaborative surveillance and safety mapping platform, currently focusing on Nigeria, then Africa and the World.**

## What is it?

SafetyMap is a surveillance grid that combines community reporting with AI automation. In regions where information gaps exist, SafetyMap aims to provide real-time situational awareness regarding kidnappings, banditry, and insurgent activity.

It is built to serve the public good, helping travelers, residents, and analysts stay informed about safety risks in real-time.

## Key Intelligence Capabilities

### 🔹 Autonomous Reconnaissance
*   **Automated Web Patrol**: The system utilizes **Firecrawl** to autonomously scrape real-time data from news outlets, blogs, and social media, scanning for threat vectors like "bandits", "kidnapping", and "Boko Haram".
*   **Unstructured Data Parsing**: Google Gemini (Gemini 3 Pro) digests raw news text to extract structured intelligence, including specific threat types, casualty estimates, and timestamps.

### 🔹 AI-Powered Analysis
*   **Geospatial Estimation**: The AI agent analyzes location context within text (Towns, LGAs, Landmarks) to pinpoint precise Latitude/Longitude coordinates for the map grid.
*   **Media Extraction**: The system automatically hunts for **Video Evidence** (YouTube, X.com) and **Image Intelligence** embedded in reports to provide visual corroboration for incidents.
*   **Semantic Deduplication**: Intelligent agents compare the narrative context of incoming reports against the database to identify and merge duplicate events, keeping the intelligence grid clean.

### 🔹 Tactical Support & Verification
*   **Interactive Safety Agent**: A context-aware Chat Bot that answers specific route safety queries (e.g., *"Is the Abuja-Kaduna road safe?"*) based on the live data grid.
*   **Hybrid Verification**: Combines AI confidence scoring with **Crowdsourced Intelligence** (OSINT), allowing the community to vote on the accuracy of reports (Confirm/Fake/Recovered).
*   **Live Safety Index**: Real-time algorithmic scoring (0-100) of state safety levels based on the density and severity of active threats.

---

## Technical Stack

*   **Frontend**: React (v19), TypeScript, Vite
*   **Styling**: Tailwind CSS
*   **Mapping**: Leaflet, React-Leaflet, CartoDB Dark Matter Tiles
*   **AI & Logic**: Google Gemini API (`gemini-3-pro-preview`)
*   **Data Scraper**: Firecrawl API
*   **Database**: Firebase Firestore (Real-time updates) with LocalStorage fallback for offline capability.

---

## Getting Started

To run this project locally, follow these steps:

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Saminu/safetymap.git
    cd safetymap
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory. You will need a Google Gemini API key.
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```
    *Note: For the map to persist data globally, you will need to configure the Firebase credentials in `services/storage.ts`.*

4.  **Run the App**
    ```bash
    npm run dev
    ```

---

## Contributing

Technology works best when it serves the people. We are calling on the community in two ways:

### 1. Contribute Data
If you have verified information about security incidents, please use the platform to submit reports. Accurate data saves lives.

### 2. Contribute Code
This is an open-source project for the public good. If you are a developer, data scientist, or UI/UX designer, your skills are needed.

**Areas for improvement:**
*   Enhanced mobile optimization.
*   More granular data sources for the AI Agent.
*   Verification algorithms for crowdsourced data.
*   Offline-first mobile application wrappers (PWA).

**How to contribute code:**
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## Disclaimer

This tool is for informational purposes only. While we strive for accuracy through AI verification and community moderation, safety conditions can change rapidly. Always cross-reference with official local authorities and exercise extreme caution in high-risk zones.

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Built with ❤️ for a safer World.*
