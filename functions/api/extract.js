export async function onRequestPost(context) {
    try {
        const { request } = context;
        const body = await request.json();
        const url = body.url;
        
        if (!url) {
            return new Response(JSON.stringify({ success: false, message: 'URL is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 1. Dapatkan CSRF Token dan Cookie dari homepage
        const getRes = await fetch('https://shopeenowatermark.com/');
        const html = await getRes.text();
        const setCookieHeader = getRes.headers.get('set-cookie');
        
        let csrfToken = '';
        const match = html.match(/name="csrf-token" content="(.*?)"/);
        if (match) {
            csrfToken = match[1];
        }

        const API_URL = "https://shopeenowatermark.com/api/extract";
        const HEADERS = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "origin": "https://shopeenowatermark.com",
            "referer": "https://shopeenowatermark.com/",
            "x-csrf-token": csrfToken,
            "x-requested-with": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded"
        };

        if (setCookieHeader) {
            // Note: Cloudflare Pages might merge Set-Cookie headers with comma. 
            // We split by comma and extract the cookie name=value parts.
            const cookies = setCookieHeader.split(',').map(c => c.split(';')[0].trim());
            HEADERS["Cookie"] = cookies.join('; ');
        }

        const params = new URLSearchParams();
        params.append('url', url);

        // 2. Lakukan POST dengan Token dan Cookie
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: HEADERS,
            body: params.toString()
        });
        
        const data = await response.json();
        
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: 'Gagal mengambil data video dari server sumber.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
