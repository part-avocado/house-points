# Points Dashboard

A real-time dashboard for displaying and tracking house points, integrated with Google Sheets.

## Features

- Real-time points display
- Automatic updates every 30 seconds
- Fullscreen mode (Ctrl+K)
- Responsive design
- Google Sheets integration

## Deployment on Render

1. Fork or clone this repository
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Add the following environment variables in Render:
   - `GOOGLE_SHEETS_ID`: Your Google Sheets ID
   - `GOOGLE_CLIENT_EMAIL`: Service account email from Google Cloud
   - `GOOGLE_PRIVATE_KEY`: Service account private key from Google Cloud

### Google Sheets Setup

1. Create a Google Cloud Project
2. Enable the Google Sheets API
3. Create a service account and download credentials
4. Share your Google Sheet with the service account email (view access)
5. Copy your Google Sheet ID from the URL

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Environment Variables

Create a `.env.local` file with:

```
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_CLIENT_EMAIL=your_service_account_email_here
GOOGLE_PRIVATE_KEY="your_service_account_private_key_here"
```

## Requirements

- Node.js 18 or higher
- Google Cloud account with Sheets API enabled
- Google service account with appropriate permissions

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
