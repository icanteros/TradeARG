# TradeARG 🇦🇷⚖️

**TradeARG** es la plataforma web definitiva para la cotización, gestión y canjes de cartas de **Magic: The Gathering (MTG)** diseñada específicamente para la comunidad de jugadores en Argentina.

---

## 🌟 Características Principales

* **💵 Doble Cotización de Dólar (Oficial & Blue)**:
  * El mercado local de MTG se rige por valores en dólares. TradeARG consulta en tiempo real las cotizaciones del **Dólar Oficial** y del **Dólar Blue** (vía `DolarApi`).
  * Cuenta con un selector interactivo en la cabecera para alternar entre ambas tasas y recalcular de inmediato el precio de todo tu inventario en Pesos Argentinos (ARS).
* **🔍 Buscador y Catálogo de Cartas**:
  * Integración directa con la API de **Scryfall** para obtener de forma instantánea imágenes oficiales, rarezas, colecciones y precios actualizados en dólares.
* **📦 Gestión de Inventario**:
  * Lleva un control detallado de tu carpeta de cambios. Agrega cartas individuales o personaliza sus especificaciones: cantidad, idioma, si es Foil ✨, notas de conservación (NM, SP, MP, HP), etc.
* **☁️ Autenticación y Sincronización en la Nube (Supabase)**:
  * Soporte completo para sesiones en la nube con **Supabase Auth**.
  * Sincronización persistente en tiempo real de tu perfil y colección con la base de datos PostgreSQL.
  * **Modo Invitado (Fallback)**: Si no deseas iniciar sesión, la plataforma guarda de forma local todos tus datos usando `localStorage`.
* **🤝 Canjes de la Comunidad**:
  * Busca cartas en posesión de otros coleccionistas en el país, visualiza sus perfiles (ubicación, reputación, tiendas habituales) y envíales consultas de canje directas.
* **🤖 Canjes Inteligentes (Auto-Matcher)**:
  * Algoritmo inteligente que analiza las cartas en tu inventario y busca coincidencias exactas con otros jugadores de la comunidad que tengan cartas de valor y magnitud equivalentes.
* **📋 Importación Masiva (Bulk Import)**:
  * Sube listas de mazos enteras pegando texto plano (formato `Cantidad Nombre`). La app se encarga de parsear y resolver el lote completo consultando la API de Scryfall.

---

## 🛠️ Stack Tecnológico

* **Frontend**: React (v19), TypeScript, Vite, Tailwind CSS, Lucide React, Motion (Framer Motion).
* **Base de Datos y Auth**: Supabase (Auth y base de datos PostgreSQL en tiempo real).
* **APIs de Terceros**: Scryfall API (MTG Data) y DolarApi (Tipos de cambio).

---

## 🚀 Instalación y Desarrollo Local

### Prerrequisitos
* [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).

### Pasos para Ejecutar
1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/icanteros/TradeARG.git
   cd TradeARG
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno**:
   Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example` y define tus credenciales de Supabase y API keys correspondientes:
   ```env
   GEMINI_API_KEY="tu-api-key-de-gemini"
   VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
   VITE_SUPABASE_ANON_KEY="tu-anon-key-de-supabase"
   ```

4. **Correr en Entorno de Desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en `http://localhost:3000`.

---

## 🗄️ Esquema de Base de Datos (Supabase)

Para el correcto funcionamiento del guardado en la nube y el buscador de usuarios, ejecuta el siguiente script SQL en el panel **SQL Editor** de tu consola de Supabase:

```sql
-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- Tabla de Perfiles de Usuario (sincronizada con auth.users)
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
create policy "Perfiles públicos visibles para todos" on public.profiles for select using (true);
create policy "Usuarios pueden actualizar su propio perfil" on public.profiles for update using (auth.uid() = id);

-- Tabla de Colección / Inventario de Cartas
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
create policy "Colecciones visibles para todos" on public.collections for select using (true);
create policy "Usuarios pueden modificar su propia colección" on public.collections for all using (auth.uid() = profile_id);

-- Trigger automático para crear perfil tras registro en Supabase Auth
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
