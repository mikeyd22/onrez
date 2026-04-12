# OnRez

**Student housing, simplified.** OnRez is a platform for finding and reviewing rental properties near Ontario universities.

---

## About

OnRez connects students with housing listings near their campus. Browse an interactive map, filter by university, read community reviews, and bookmark your favourite properties — all in one place. Landlords can list their properties and manage their portfolio directly through the platform.

---

## Features

- **Interactive Map** — explore listings across Ontario with school and amenity filters (transit, food, shops)
- **Explore Grid** — searchable, filterable listing cards with sorting and pagination
- **University Pages** — per-campus hubs with stats, reviews, and nearby listings
- **Listing Detail** — photo gallery, amenities, pricing, location map, and reviews
- **Reviews & Ratings** — star ratings and photo-supported reviews for listings and universities
- **Bookmarks** — save and revisit favourite listings
- **Authentication** — email/password and Google OAuth via Supabase Auth
- **Role-based Access** — user and admin roles with Row-Level Security

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS 3.4, Radix UI |
| Maps | Mapbox GL JS, react-map-gl |
| Database | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth (email + Google OAuth) |
| Storage | Supabase Storage |
| Geocoding | Google Maps Places API |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Mapbox](https://mapbox.com) account
- A [Google Cloud](https://console.cloud.google.com) project with the Maps JavaScript API and Places API enabled

### Environment Variables

Create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Optional — defaults to the public Overpass API
OVERPASS_API_URL=https://overpass-api.de/api/interpreter

# Optional — used by the seed script
SEED_OWNER_EMAIL=your@email.com
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Setup

1. Create a Supabase project and add the credentials to `.env.local`.
2. Run the migrations in order from the Supabase SQL editor or CLI:

   ```
   supabase/migrations/001_schema.sql
   supabase/migrations/002_rls.sql
   supabase/migrations/003_rpc.sql
   supabase/migrations/004_storage_policies.sql
   supabase/migrations/005_feature_update.sql
   supabase/migrations/006_listings_city_nullable.sql
   supabase/migrations/007_reviews_profiles_fk.sql
   supabase/migrations/008_reviews_display_name_override.sql
   supabase/migrations/009_reviews_avatar_icon.sql
   supabase/migrations/010_review_photos.sql
   ```

3. In the Supabase dashboard, go to **Authentication → Providers** and enable Google OAuth.
4. Create a storage bucket named `listing-photos`.
5. (Optional) Promote your account to admin:

   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
   ```

6. (Optional) Seed sample data:

   ```bash
   npm run seed
   ```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Create a production build |
| `npm run lint` | Run ESLint |
| `npm run seed` | Populate the database with sample listings |

---

## Project Structure

```
onrez/
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   ├── components/       # Reusable UI components
│   └── lib/              # Supabase client, utilities, and type definitions
├── supabase/
│   └── migrations/       # Ordered SQL migration files
├── scripts/              # Standalone scripts (seed, import)
└── public/               # Static assets
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero search, university cards, top-rated listings |
| `/map` | Full-screen Ontario map with listing markers and amenity toggles |
| `/explore` | Filterable and searchable listing grid |
| `/university/[slug]` | University hub — stats, reviews, and nearby listings |
| `/listing/[id]` | Listing detail — gallery, amenities, map, and reviews |
| `/my-listings` | Manage your own listings |
| `/bookmarks` | Saved listings |
| `/auth/login` · `/auth/signup` | Authentication |

---

## Contributing

Pull requests are welcome. For significant changes, please open an issue first to discuss what you'd like to change.

---

## License

MIT
