# Product Launchpad

AI-powered marketing strategy generator for product launches. Enter your product details and get a comprehensive marketing plan with content ideas, vision board, and actionable next steps.

## Features

- **AI Marketing Plans**: Generate complete marketing strategies in minutes
- **Content Ideas**: Get tailored content suggestions for your product
- **Vision Board**: Visual inspiration and brand direction
- **Actionable Steps**: Clear next steps to launch your product
- **Plan History**: Save and revisit previous marketing plans
- **Secure Authentication**: Email/password with password reset

## How It Works

1. **Enter Product Details**: Product name and value proposition
2. **AI Generation**: Our AI creates a comprehensive marketing strategy
3. **Review Plan**: View content ideas, vision board, and action items
4. **Launch**: Follow the actionable steps to market your product

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI**: Gemini API for marketing plan generation
- **Build**: Vite

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Nas20two/product-launchpad.git
cd product-launchpad

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials

# Run development server
npm run dev
```

## Environment Variables

Create a `.env.local` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

Deploy to Vercel:
```bash
npm run build
npx vercel --prod
```

## License

MIT
