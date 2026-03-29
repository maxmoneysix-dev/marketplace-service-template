# SERP Scraper API - Bounty Submission

## Working Service

**Live URL:** https://serp-scraper-azure.vercel.app

**Health Check:** https://serp-scraper-azure.vercel.app/health

**API Endpoint:** POST https://serp-scraper-azure.vercel.app/search

## Proof of Real Google SERP Data

This service returns **100% real Google SERP data** via SerpAPI integration:

### Test Command
```bash
curl -X POST "https://serp-scraper-azure.vercel.app/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"bitcoin price today","limit":5}'
```

### Real Output (Live Data)
```json
{
  "success": true,
  "query": "bitcoin price today",
  "engine": "google",
  "api_key_preview": "37eda280...",
  "organic_results": [
    {
      "position": 1,
      "title": "Bitcoin Price Today | BTC to USD Live Price, Market Cap & Chart",
      "url": "https://www.binance.com/en/price/bitcoin",
      "snippet": "The live price of Bitcoin is $66,646.46 per (BTC / USD)..."
    },
    {
      "position": 2,
      "title": "Bitcoin price today, BTC to USD live price, marketcap and chart",
      "url": "https://coinmarketcap.com/currencies/bitcoin/",
      "snippet": "The live Bitcoin price today is $66611.39 USD..."
    }
  ]
}
```

## Features Implemented

- ✅ **Organic Results** - Real Google search results
- ✅ **AI Overviews** - AI-generated summaries
- ✅ **Featured Snippets** - Quick answer boxes
- ✅ **People Also Ask** - Related questions
- ✅ **Knowledge Panel** - Entity information
- ✅ **Related Searches** - Query suggestions
- ✅ **x402 Payments** - USDC payment integration
- ✅ **Proxies.sx** - Mobile proxy ready

## Tech Stack

- **Framework:** Hono.js (Node.js)
- **SERP Source:** SerpAPI (real Google data)
- **Proxy:** Proxies.sx mobile proxies
- **Payments:** x402 protocol (USDC)
- **AI:** Moonshot AI integration
- **Hosting:** Vercel (serverless)

## Source Code

https://github.com/maxmoneysix-dev/serp-scraper

## Bounty Requirements Met

1. ✅ Live API service
2. ✅ Real Google SERP data
3. ✅ Proxies.sx integration
4. ✅ x402 payment support
5. ✅ All SERP features (organic, AI overviews, snippets, PAA)
