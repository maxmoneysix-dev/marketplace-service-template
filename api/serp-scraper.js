/**
 * SERP Scraper - Google Search with Proxies.sx integration
 * Returns organic results, AI Overviews, Featured Snippets, People Also Ask
 */

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Proxies.sx configuration
const PROXIES_SX_API_KEY = process.env.PROXIES_SX_API_KEY || 'free_trial';

/**
 * Get proxy from Proxies.sx
 */
async function getProxy() {
  try {
    // For free trial, use a default proxy configuration
    if (PROXIES_SX_API_KEY === 'free_trial') {
      return null; // Will use puppeteer without proxy for demo
    }
    
    // Real Proxies.sx integration would fetch here
    const response = await fetch('https://api.proxies.sx/mobile', {
      headers: { 'Authorization': `Bearer ${PROXIES_SX_API_KEY}` }
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.log('Proxy fetch failed, using direct connection');
  }
  return null;
}

/**
 * Scrape Google SERP with all features
 */
export async function scrapeGoogleSERP(query, options = {}) {
  const { 
    limit = 10, 
    location = 'us',
    device = 'mobile'
  } = options;
  
  console.log(`🔍 Scraping Google for: "${query}"`);
  
  let browser = null;
  
  try {
    // Launch browser with Chromium (Vercel compatible)
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080'
      ],
      defaultViewport: device === 'mobile' 
        ? { width: 375, height: 812 }
        : { width: 1920, height: 1080 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    
    const page = await browser.newPage();
    
    // Set mobile user agent
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    );
    
    // Navigate to Google
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&gl=${location}&num=${limit}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Accept cookies if present (EU/US compliance)
    try {
      const acceptBtn = await page.$('button[aria-label*="Accept"], button:has-text("Accept all")');
      if (acceptBtn) await acceptBtn.click();
    } catch (e) {}
    
    // Wait for results
    await page.waitForSelector('#search, #rso, .g, [data-async-context]', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000)); // Extra wait for JS rendering
    
    // Extract all SERP features
    const results = await page.evaluate(() => {
      const data = {
        query: '',
        total_results: '',
        search_time: '',
        organic_results: [],
        ai_overview: null,
        featured_snippet: null,
        people_also_ask: [],
        related_searches: [],
        knowledge_panel: null,
        top_stories: [],
        shopping_results: [],
        video_results: [],
        local_results: [],
        ads: []
      };
      
      // Get query
      const searchInput = document.querySelector('input[name="q"], textarea[name="q"]');
      if (searchInput) data.query = searchInput.value;
      
      // Get result stats
      const stats = document.querySelector('#result-stats');
      if (stats) {
        data.total_results = stats.textContent.match(/([\d,]+) results?/)?.[1] || '';
        data.search_time = stats.textContent.match(/\(([\d.]+) seconds?\)/)?.[1] || '';
      }
      
      // AI Overview (Google's AI-generated summaries)
      const aiOverview = document.querySelector('[data-feature-name="AIOverview"], #AIOverview, .xSQxL');
      if (aiOverview) {
        data.ai_overview = {
          title: 'AI Overview',
          content: aiOverview.innerText.substring(0, 500),
          sources: Array.from(aiOverview.querySelectorAll('a')).map(a => ({
            title: a.textContent,
            url: a.href
          })).slice(0, 5)
        };
      }
      
      // Featured Snippet
      const featuredSnippet = document.querySelector('.xpdopen, .kp-blk, [data-attrid*="featured_snippet"]');
      if (featuredSnippet) {
        const title = featuredSnippet.querySelector('h3, .kp-header')?.textContent || '';
        const content = featuredSnippet.querySelector('.hgKElc, .YkQvR, .sXmW2d')?.textContent || '';
        const url = featuredSnippet.querySelector('a[href^="http"]')?.href || '';
        
        if (content) {
          data.featured_snippet = {
            title,
            content: content.substring(0, 1000),
            url,
            type: content.length > 200 ? 'paragraph' : 'list'
          };
        }
      }
      
      // People Also Ask
      const paaSection = document.querySelectorAll('[data-attrid="wa"] .g, related-question-pair, .related-question-pair');
      paaSection.forEach(item => {
        const question = item.querySelector('[role="button"], .wQiwMc, .CSkcDe')?.textContent || 
                        item.querySelector('span')?.textContent;
        const answer = item.querySelector('.YkQvR, .hgKElc, .sXmW2d')?.textContent;
        
        if (question && answer) {
          data.people_also_ask.push({
            question: question.trim(),
            answer: answer.trim().substring(0, 500),
            expanded: item.getAttribute('aria-expanded') === 'true'
          });
        }
      });
      
      // Organic Results
      const organicResults = document.querySelectorAll('#search .g, #rso .g, .yuRUbf');
      let position = 1;
      
      organicResults.forEach(result => {
        // Skip if it's a featured element
        if (result.closest('[data-feature-name]') || result.closest('.xpdopen')) return;
        
        const titleEl = result.querySelector('h3, .LC20lb');
        const linkEl = result.querySelector('a[href^="http"], .yuRUbf a');
        const snippetEl = result.querySelector('.VwiC3b, .s3v94d, .lyLwlc');
        const citeEl = result.querySelector('.byrV5b, .TbwUpd, cite');
        
        if (titleEl && linkEl) {
          data.organic_results.push({
            position: position++,
            title: titleEl.textContent.trim(),
            url: linkEl.href,
            snippet: snippetEl?.textContent?.trim() || '',
            displayed_url: citeEl?.textContent?.trim() || linkEl.hostname,
            date: result.textContent.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2},? \d{4}/)?.[0] || ''
          });
        }
      });
      
      // Related Searches
      const relatedSearches = document.querySelectorAll('[data-async-context] a[href*="search?q="], .s75CSd, .oIk2Cb');
      relatedSearches.forEach(link => {
        const text = link.textContent?.trim();
        if (text && text.length > 0 && !data.related_searches.includes(text)) {
          data.related_searches.push(text);
        }
      });
      
      // Knowledge Panel
      const knowledgePanel = document.querySelector('.kp-blk, .xpdopen');
      if (knowledgePanel && knowledgePanel.querySelector('.kno-fb-ctx, .kno-ecr-pt')) {
        data.knowledge_panel = {
          title: knowledgePanel.querySelector('.kno-ecr-pt, .kno-fb-ctx')?.textContent?.trim() || '',
          description: knowledgePanel.querySelector('.kno-rdesc span')?.textContent?.trim() || '',
          image: knowledgePanel.querySelector('img')?.src || '',
          facts: Array.from(knowledgePanel.querySelectorAll('.rVusze')).map(fact => ({
            label: fact.querySelector('.w8qArf')?.textContent?.trim() || '',
            value: fact.querySelector('.kno-fv')?.textContent?.trim() || ''
          })).filter(f => f.label && f.value)
        };
      }
      
      // Top Stories
      const topStories = document.querySelectorAll('[data-feature-name="News"] .g, .dbsr');
      topStories.forEach(story => {
        const title = story.querySelector('h3, .nDgy9d')?.textContent?.trim();
        const url = story.querySelector('a')?.href;
        const source = story.querySelector('.upDateTime, .MgUUmf')?.textContent?.trim();
        
        if (title && url) {
          data.top_stories.push({ title, url, source });
        }
      });
      
      // Video Results
      const videoResults = document.querySelectorAll('[data-feature-name="Video"] .g, .EaHP9c');
      videoResults.forEach(video => {
        const title = video.querySelector('h3')?.textContent?.trim();
        const url = video.querySelector('a')?.href;
        const thumbnail = video.querySelector('img')?.src;
        
        if (title && url) {
          data.video_results.push({ title, url, thumbnail });
        }
      });
      
      // Local Results
      const localResults = document.querySelectorAll('[data-feature-name="LocalPlaces"] .g, .VkpGBb');
      localResults.forEach(place => {
        const name = place.querySelector('.dbg0pd')?.textContent?.trim();
        const rating = place.querySelector('.YDIN4c')?.textContent?.trim();
        const address = place.querySelector('.cXedhc, .W4Efsd')?.textContent?.trim();
        
        if (name) {
          data.local_results.push({ name, rating, address });
        }
      });
      
      // Ads
      const ads = document.querySelectorAll('[data-text-ad] .g, .uEierd');
      ads.forEach(ad => {
        const title = ad.querySelector('h3')?.textContent?.trim();
        const url = ad.querySelector('a')?.href;
        const snippet = ad.querySelector('.Va3FIb, .lyLwlc')?.textContent?.trim();
        
        if (title) {
          data.ads.push({ title, url, snippet, type: 'top' });
        }
      });
      
      return data;
    });
    
    await browser.close();
    
    return {
      success: true,
      engine: 'google',
      device: device,
      timestamp: new Date().toISOString(),
      ...results
    };
    
  } catch (error) {
    if (browser) await browser.close();
    console.error('SERP Scraping error:', error);
    throw error;
  }
}

/**
 * DuckDuckGo search (fallback)
 */
export async function searchDuckDuckGo(query, limit = 10) {
  try {
    const response = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    
    // Simple parsing (in production use proper HTML parser)
    const results = [];
    const regex = /<a class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
    let match;
    let position = 1;
    
    while ((match = regex.exec(html)) !== null && results.length < limit) {
      results.push({
        position: position++,
        title: match[2].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        url: match[1],
        snippet: '',
        source: 'duckduckgo'
      });
    }
    
    return {
      success: true,
      engine: 'duckduckgo',
      timestamp: new Date().toISOString(),
      organic_results: results
    };
  } catch (error) {
    console.error('DuckDuckGo error:', error);
    throw error;
  }
}

export default { scrapeGoogleSERP, searchDuckDuckGo };
