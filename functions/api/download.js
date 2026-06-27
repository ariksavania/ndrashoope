export async function onRequestGet(context) {
    try {
        const { request } = context;
        const urlObj = new URL(request.url);
        const url = urlObj.searchParams.get('url');
        const filename = urlObj.searchParams.get('filename') || 'video.mp4';
        
        if (!url) {
            return new Response('URL is required', { status: 400 });
        }

        const response = await fetch(url);
        
        // Pass through the video stream and force download
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Content-Disposition', `attachment; filename="${filename}"`);
        newHeaders.set('Content-Type', 'video/mp4');
        
        return new Response(response.body, {
            status: response.status,
            headers: newHeaders
        });
    } catch (error) {
        return new Response('Failed to download video', { status: 500 });
    }
}
