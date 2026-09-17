import { XMLParser } from 'fast-xml-parser';

// CONFIGURATION
const HOST = 'www.rwbjee.com';
const KEY = '78dadce3bea34738846d5a2773e9c0dc'; // Your Key
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const SITEMAP_URL = `https://${HOST}/sitemap.xml`;

async function submitToIndexNow() {
    try {
        console.log('🚀 Fetching sitemap...');
        const sitemapRes = await fetch(SITEMAP_URL);

        if (!sitemapRes.ok) throw new Error(`Failed to fetch sitemap: ${sitemapRes.statusText}`);

        const sitemapXml = await sitemapRes.text();
        const parser = new XMLParser();
        const jObj = parser.parse(sitemapXml);

        // Extract URLs (handle both single url and array of urls)
        const urlSet = jObj.urlset.url;
        const urls = Array.isArray(urlSet) ? urlSet.map(u => u.loc) : [urlSet.loc];

        console.log(`✅ Found ${urls.length} URLs in sitemap.`);

        // Prepare Payload
        const payload = {
            host: HOST,
            key: KEY,
            keyLocation: KEY_LOCATION,
            urlList: urls
        };

        console.log('📤 Submitting to IndexNow...');

        const response = await fetch('https://api.indexnow.org/IndexNow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify(payload),
        });

        if (response.status === 200 || response.status === 202) {
            console.log('🎉 Success! URLs submitted to IndexNow.');
        } else {
            console.error(`❌ Error: ${response.status} - ${await response.text()}`);
        }

    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
}

submitToIndexNow();