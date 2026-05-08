# NovaCraft Studio — Website

> Creative design agency portfolio and contact platform. Built with vanilla HTML/CSS/JS and deployed as a Vercel Edge application.

![Status](https://img.shields.io/badge/status-production-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Overview

This repository contains the source code for the NovaCraft Studio website — our public portfolio, service overview, and contact platform. The site is designed to be fast, lightweight, and visually stunning.

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES2020+)
- **Backend**: Vercel Edge Functions (serverless)
- **Fonts**: Google Fonts (Inter, Playfair Display)
- **Hosting**: Vercel

## Project Structure

```
├── api/
│   ├── contact.js       # Contact form handler
│   ├── gateway.js       # Form processing middleware
│   ├── status.js        # Service status endpoint
│   └── subscribe.js     # Newsletter subscription handler
├── public/
│   ├── css/
│   │   └── style.css    # Design system & styles
│   ├── js/
│   │   └── main.js      # Frontend interactions
│   ├── index.html       # Landing page
│   ├── robots.txt       # Search engine directives
│   └── sitemap.xml      # XML sitemap
├── .env.example         # Environment config template
├── package.json
├── vercel.json          # Deployment & routing config
└── README.md
```

## Getting Started

### Prerequisites

- Node.js ≥ 18.0.0
- Vercel CLI (`npm i -g vercel`)

### Local Development

```bash
# Clone the repo
git clone https://github.com/novacraft-studio/website.git
cd website

# Set up environment
cp .env.example .env
# Edit .env with your SMTP relay URL

# Start dev server
npx vercel dev
```

### Deploy

```bash
vercel --prod
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SMTP_RELAY_URL` | ✅ | URL of the email relay service for form processing |

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/contact` | POST | Process contact form submissions |
| `/api/subscribe` | POST | Handle newsletter subscriptions |
| `/api/status` | GET | Service health check |

## License

MIT © 2025 NovaCraft Studio
