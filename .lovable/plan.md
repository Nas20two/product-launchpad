

# Marketing Maven

An AI-powered marketing strategy app that generates content ideas, vision boards, and next steps from a product description.

## Pages & Flow

1. **Auth Pages** — Login/signup with email (Supabase Auth)
2. **Dashboard** — List of saved marketing plans with ability to create new ones
3. **New Plan** — Form with two inputs: Product Name + One-sentence Value Proposition → submit triggers AI generation
4. **Plan Results** — Displays the generated marketing plan with:
   - **Marketing Ideas** organized into Content Marketing, Social Media, and Partnerships tabs
   - **Top Pick** per category with Pros/Cons analysis
   - **Vision Board** — AI-generated images (3 images, one per category) displayed in a collage layout
   - **Next Steps** — Actionable checklist with checkable items
5. **Saved Plans** — View previously generated plans

## Design

- Teal/cyan primary color scheme matching the provided palette
- Clean card-based layout with the splash screen logo as branding
- Dark mode support

## Backend (Lovable Cloud)

- **Database tables**: `profiles`, `marketing_plans` (stores product info, generated content, image URLs, next steps)
- **Edge function: `generate-plan`** — Calls Lovable AI (Gemini) to generate the categorized marketing ideas, pros/cons, and next steps
- **Edge function: `generate-vision-board`** — Calls Lovable AI image model to generate 3 vision board images, uploads them to Supabase Storage
- **Storage bucket** for vision board images

## Key Features

- Streaming AI response so users see content as it generates
- Save/delete plans
- Re-generate individual sections (images or text)
- Export plan as formatted text (copy to clipboard)

