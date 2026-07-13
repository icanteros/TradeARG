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

## 🗄️ Database Schema Setup (Supabase)

To enable user profiles, collection syncing, and community binder lookups, execute the following script in your Supabase **SQL Editor**:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User Profiles Table (synced with auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  location text,
  favorite_stores text,
  rating numeric(3,2) default 5.0,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Card Collections / Inventory Table
create table public.collections (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  scryfall_id text not null,
  card_name text not null,
  price_usd numeric(10,2) not null default 1.00,
  quantity integer not null default 1 check (quantity >= 0),
  rarity text not null default 'Common',
  image_url text not null,
  set_name text,
  collector_number text,
  is_foil boolean default false,
  language text default 'EN',
  condition text default 'NM',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.collections enable row level security;
create policy "Collections are viewable by everyone" on public.collections for select using (true);
create policy "Users can modify their own collection" on public.collections for all using (auth.uid() = profile_id);

-- Auto-create profile trigger on registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, location, favorite_stores, avatar_url, rating)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'User_' || substr(new.id::text, 1, 8)),
    'Argentina',
    'Local General',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBbdoIxp_Cnk7hU5w0DX4ZH_TSG_MByPvwQyeIP58d1q89JJOw8ze26_JmPuIdS3ImrcV1bDUfNg01DYsW5biuiu-2y37bxw6w5ULCET2XIgG23uctjIEa-v-_A1u5CDQP5tGJaREtDq4BmfaYANOMTojgGR-bywm3I3DB4DKEsP9o8SfAXElwDlQqtGy8dAr6lmJk8rMwLBkWdapJY8-KYbTB47OUvTArd-1wwARK7eyiGltZw7Zpei7D9kH4sJN6W8xc7cDJQPE0',
    5.0
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```
