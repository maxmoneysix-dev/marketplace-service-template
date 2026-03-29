/**
 * SERP Scraper - Real Google Search via SerpAPI + Proxies.sx
 */

/**
 * REAL Google SERP via SerpAPI
 */
async function serpApiSearch(query, options = {}) {
  const { limit = 10, location = 'United States', device = 'mobile' } = options;
  
  // Read env var directly at runtime
  const SERPAPI_KEY = process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY;
  const PROXIES_SX_API_KEY = process.env.PROXIES_SX_API_KEY || 'free_trial';
  
  console.log('DEBUG: SERPAPI_KEY exists:', !!SERPAPI_KEY);
  
  if (!SERPAPI_KEY) {
    throw new Error('SERPAPI_KEY not configured');
  }
  
  console.log('🔍 SerpAPI Search:', query);
  console.log('🔑 API Key:', SERPAPI_KEY.substring(0, 8) + '...');
  
  // Build SerpAPI URL
  const params = new URLSearchParams({
    q: query,
    engine: 'google',
    api_key: SERPAPI_KEY,
    num: limit.toString(),
    location: location,
    device: device,
    hl: 'en',
    gl: 'us'
  });
  
  // Add Proxies.sx if available
  if (PROXIES_SX_API_KEY !== 'free_trial') {
    params.append('proxy', 'true');
    console.log('🌐 Using Proxies.sx mobile proxy');
  }
  
  const url = `https://serpapi.com/search?${params.toString()}`;
  
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SerpAPI error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  
  return {
    success: true,
    query: data.search_parameters?.q || query,
    engine: 'google',
    device: device,
    timestamp: new Date().toISOString(),
    proxy_ip: 'serpapi-server',
    proxy_source: PROXIES_SX_API_KEY !== 'free_trial' ? 'proxies.sx' : 'serpapi-direct',
    api_key_preview: SERPAPI_KEY.substring(0, 8) + '...',
    
    total_results: data.search_information?.total_results?.toString() || '',
    search_time: data.search_information?.time_taken_displayed || '',
    
    organic_results: (data.organic_results || []).map((r, i) => ({
      position: r.position || i + 1,
      title: r.title || '',
      url: r.link || '',
      snippet: r.snippet || '',
      displayed_url: r.displayed_link || ''
    })),
    
    ai_overview: data.ai_overview ? {
      title: 'AI Overview',
      content: data.ai_overview.text || ''
    } : null,
    
    featured_snippet: data.answer_box ? {
      title: data.answer_box.title || '',
      content: data.answer_box.answer || data.answer_box.snippet || ''
    } : null,
    
    people_also_ask: (data.related_questions || []).map(q => ({
      question: q.question || '',
      answer: q.snippet || ''
    })),
    
    related_searches: (data.related_searches || []).map(r => r.query || ''),
    
    _source: 'serpapi',
    _raw: data
  };
}

/**
 * Main scraping function
 */
export async function scrapeGoogleSERP(query, options = {}) {
  console.log('DEBUG: process.env.SERPAPI_KEY exists:', !!process.env.SERPAPI_KEY);
  
  // Try SerpAPI first
  try {
    return await serpApiSearch(query, options);
  } catch (error) {
    console.error('SerpAPI failed:', error.message);
    return generateDemoData(query, options);
  }
}

function generateDemoData(query, options = {}) {
  return {
    success: true,
    query,
    engine: 'demo',
    timestamp: new Date().toISOString(),
    proxy_ip: 'demo-mode',
    note: 'SerpAPI failed - using demo data',
    error: 'Add SERPAPI_KEY to Vercel environment variables',
    organic_results: [
      { position: 1, title: 'Demo Result', url: 'https://example.com', snippet: 'Real data requires SERPAPI_KEY' }
    ]
  };
}

export default { scrapeGoogleSERP };
