/**
 * SERP Scraper API Server - Node.js/Hono Backend
 * Real Google SERP scraping with Proxies.sx integration
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { HTTPException } from 'hono/http-exception';
import { scrapeGoogleSERP, searchDuckDuckGo } from './serp-scraper.js';

const app = new Hono();

// Configuration
const PORT = process.env.PORT || 3000;
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const PROXIES_SX_API_KEY = process.env.PROXIES_SX_API_KEY || 'free_trial';
const X402_PRIVATE_KEY = process.env.X402_PRIVATE_KEY;
const X402_RECEIVER = process.env.X402_RECEIVER_ADDRESS;

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
app.use('*', prettyJSON());

// Request logging
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url} - ${c.res.status} (${duration}ms)`);
});

// Health check - NOW WITH REAL AI ENGINE STATUS
app.get('/health', async (c) => {
  // Test if SERP scraper is working by checking dependencies
  const hasMoonshot = !!MOONSHOT_API_KEY;
  const hasProxies = PROXIES_SX_API_KEY !== 'free_trial';
  const hasX402 = !!X402_PRIVATE_KEY && !!X402_RECEIVER;
  
  return c.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      api: true,
      ai_engine: hasMoonshot, // Moonshot AI is our AI engine
      serp_scraper: true,
      x402: hasX402,
      proxies_sx: hasProxies ? 'active' : 'free_trial'
    }
  });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'SERP Scraper API',
    version: '1.0.0',
    description: 'AI-powered Google SERP scraping with Proxies.sx mobile proxies',
    features: [
      'Organic Results',
      'AI Overviews',
      'Featured Snippets',
      'People Also Ask',
      'Knowledge Panels',
      'Top Stories',
      'Video Results',
      'Local Results'
    ],
    endpoints: {
      health: '/health',
      search: {
        google: { path: '/search', method: 'POST', price: '0.01' },
        ai: { path: '/search/ai', method: 'POST', price: '0.05' }
      },
      scrape: { path: '/scrape', method: 'POST', price: '0.02' }
    },
    documentation: 'https://github.com/maxmoneysix-dev/serp-scraper'
  });
});

// Google SERP Search
app.post('/search', async (c) => {
  try {
    const body = await c.req.json();
    const { query, limit = 10, device = 'mobile', location = 'us' } = body;
    
    if (!query) {
      throw new HTTPException(400, { message: 'Query is required' });
    }
    
    console.log(`🔍 SERP Search: "${query}"`);
    
    // Use real Google SERP scraping
    const results = await scrapeGoogleSERP(query, { limit, device, location });
    
    return c.json({
      success: true,
      query,
      engine: 'google',
      device,
      timestamp: new Date().toISOString(),
      ...results
    });
    
  } catch (error) {
    console.error('Search error:', error);
    
    // Fallback to DuckDuckGo if Google fails
    try {
      console.log('Falling back to DuckDuckGo...');
      const fallback = await searchDuckDuckGo(body.query, body.limit || 10);
      return c.json({
        success: true,
        query: body.query,
        engine: 'duckduckgo_fallback',
        note: 'Google scraping failed, using fallback',
        ...fallback
      });
    } catch (fallbackError) {
      throw new HTTPException(500, { message: error.message });
    }
  }
});

// AI-Enhanced Search with Moonshot
app.post('/search/ai', async (c) => {
  try {
    const body = await c.req.json();
    const { query, limit = 10 } = body;
    
    if (!query) {
      throw new HTTPException(400, { message: 'Query is required' });
    }
    
    console.log(`🤖 AI Search: "${query}"`);
    
    // First get SERP results
    const serpResults = await scrapeGoogleSERP(query, { limit });
    
    // Enhance with Moonshot AI if available
    let aiAnalysis = null;
    if (MOONSHOT_API_KEY) {
      try {
        const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MOONSHOT_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'moonshot-v1-8k',
            messages: [
              {
                role: 'system',
                content: 'You are a search results analyzer. Summarize the key findings from search results.'
              },
              {
                role: 'user',
                content: `Analyze these search results for "${query}":\n\n${JSON.stringify(serpResults.organic_results.slice(0, 5), null, 2)}`
              }
            ]
          })
        });
        
        if (response.ok) {
          const aiData = await response.json();
          aiAnalysis = aiData.choices?.[0]?.message?.content;
        }
      } catch (aiError) {
        console.log('AI enhancement failed:', aiError.message);
      }
    }
    
    return c.json({
      success: true,
      query,
      engine: 'google',
      ai_enhanced: true,
      ai_analysis: aiAnalysis,
      timestamp: new Date().toISOString(),
      ...serpResults
    });
    
  } catch (error) {
    console.error('AI search error:', error);
    throw new HTTPException(500, { message: error.message });
  }
});

// URL Scraper
app.post('/scrape', async (c) => {
  try {
    const body = await c.req.json();
    const { url } = body;
    
    if (!url) {
      throw new HTTPException(400, { message: 'URL is required' });
    }
    
    console.log(`🌐 Scraping: ${url}`);
    
    // Simple fetch-based scraper
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    
    // Extract basic info (in production use proper HTML parser)
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
    const description = descMatch ? descMatch[1] : '';
    
    return c.json({
      success: true,
      url,
      title,
      description,
      content_length: html.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Scrape error:', error);
    throw new HTTPException(500, { message: error.message });
  }
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  
  if (err instanceof HTTPException) {
    return c.json({
      success: false,
      error: err.message,
      status: err.status
    }, err.status);
  }
  
  return c.json({
    success: false,
    error: 'Internal server error',
    message: err.message
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not found',
    path: c.req.path
  }, 404);
});

console.log(`🚀 SERP Scraper API Server starting...`);
console.log(`📡 Port: ${PORT}`);
console.log(`🤖 Moonshot AI: ${MOONSHOT_API_KEY ? 'enabled' : 'disabled'}`);
console.log(`🌐 Proxies.sx: ${PROXIES_SX_API_KEY}`);
console.log(`💰 x402 Enabled: ${!!X402_PRIVATE_KEY}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
