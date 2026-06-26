# Texas Diesel Fleets

Marketing + booking site for **Texas Diesel Fleets** — heavy-duty diesel repair,
fleet maintenance, and DOT inspections in Midland, TX.

Built with **Next.js (App Router) + React + TypeScript**, recreated from a
Claude Design prototype.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the dev server                 |
| `npm run build` | Production build                     |
| `npm run start` | Serve the production build           |
| `npm run lint`  | Lint                                 |

## Structure

- `app/` — Next.js App Router entry (`layout.tsx`, `page.tsx`, `globals.css`)
- `components/BookingPage.tsx` — the full single-page UI and interactions
  (roll-up garage-door hero, animated dashboard gauges, clickable truck
  diagnostic, booking form, map)
- `components/data.ts` — static content (services, reviews, gauges, palettes)
- `components/css.ts` — helper that turns CSS strings into React style objects
- `public/assets/` — images from the design

## Notes / next steps

- **The booking form is visual-only.** On submit it shows the work-order
  confirmation screen but does not yet send the submission anywhere. Wiring it
  to email/SMS (Twilio) or a database (Supabase/Neon) is the natural next pass.
- **Placeholder content** to replace before launch: phone number
  `(800) 555-0199`, address `3800 W Industrial Ave, Midland, TX 79701`, and the
  hours. The map embed is keyed off that address.
- The color palette is set via the `PALETTE` constant in `BookingPage.tsx`
  (eight palettes are defined in `globals.css`); default is
  "Graphite & Safety Orange".
