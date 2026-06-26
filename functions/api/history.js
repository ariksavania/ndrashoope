export async function onRequestGet(context) {
    const { env } = context;
    let currentHistory = await env.HISTORY_KV.get('HISTORY_TEXT');
    
    if (!currentHistory) {
        return new Response(JSON.stringify({ history: "Belum ada hasil tersimpan." }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    return new Response(JSON.stringify({ history: currentHistory }), {
        headers: { "Content-Type": "application/json" }
    });
}
