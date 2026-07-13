# TradeARG 🇦🇷⚖️

**TradeARG** is the ultimate web platform for Magic: The Gathering (MTG) card cataloging, pricing, and trading, tailored specifically for the MTG community in Argentina.

---

## 🌟 Key Features

* **💵 Dual Dollar Rate Conversion (Official & Blue)**:
  * The Argentine MTG market is benchmarked in USD, but transactions are conducted in Argentine Pesos (ARS). TradeARG fetches live rates for both **Dólar Oficial** and **Dólar Blue** via `DolarApi`.
  * Includes an interactive toggle in the header to switch between rates in real time, automatically recalculating the value of your entire collection in ARS.
* **🔍 Card Catalog & Search**:
  * Seamless integration with the **Scryfall API** to instantly fetch card artwork, rarities, printings, and up-to-date pricing history in USD.
* **📦 Collection & Inventory Management**:
  * Track your binder/collection with precision. Add individual cards, update quantities, set languages, mark foil printings ✨, specify conditions (NM, SP, MP, HP), and add custom notes.
* **☁️ Cloud Sync & Authentication (Supabase)**:
  * Fully integrated authentication via **Supabase Auth**.
  * Persist your collection and profile information in a cloud PostgreSQL database.
  * **Guest Mode (Fallback)**: If you prefer to stay logged out, all your collection data is stored locally in your browser's `localStorage`.
* **🤝 Community Trade Searches**:
  * Search public binders from other operators across Argentina. View profiles with user ratings, physical locations, and preferred local game stores (LGS) to schedule face-to-face trades.
* **🤖 Smart Auto-Matcher**:
  * A trade matchmaking engine that analyzes your inventory and automatically highlights matching trade proposals with other community members offering cards of equivalent value.
* **📋 Bulk Decklist Importer**:
  * Quickly upload large lists of cards by pasting raw text (e.g., `4 Sheoldred, the Apocalypse`). The app parses quantities and fetches details from Scryfall in batches.

---

## 🛠️ Tech Stack

* **Frontend**: React (v19), TypeScript, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
* **Database & Auth**: Supabase (Auth and PostgreSQL database).
* **External APIs**: Scryfall API (MTG database) and DolarApi (exchange rates).

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended).

### Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/icanteros/TradeARG.git
   cd TradeARG
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory based on `.env.example` and insert your API keys and Supabase credentials:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---
