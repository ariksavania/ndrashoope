export async function onRequestPost(context) {
    const { request, env } = context;
    let reqBody;
    try {
        reqBody = await request.json();
    } catch (err) {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    const { harga, persen, komisi, type } = reqBody;

    // Use current time and apply +7 hours for WIB
    const now = new Date();
    now.setHours(now.getHours() + 7);

    const pad = (n) => (n < 10 ? '0' + n : n);
    const dateStr = `${now.getUTCFullYear()}-${pad(now.getUTCMonth()+1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
    
    const mode = type === 'massal' ? '[MASSAL]' : '[SINGLE]';
    
    let hasil_teks = "";
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            .format(amount)
            .replace(/,/g, '_')
            .replace(/\./g, ',')
            .replace(/_/g, '.')
    };
    const rupiah = (val) => `Rp${formatCurrency(val)}`;

    if (type === 'massal_header') {
        hasil_teks = `[MASSAL] ${dateStr}\n${'-'.repeat(40)}\n`;
    } else if (type === 'massal_item') {
        hasil_teks += `Harga Produk : ${rupiah(harga)}\n`;
        hasil_teks += `Persentase   : ${persen}%\n`;
        hasil_teks += `Komisi Dapat : ${rupiah(komisi)}\n`;
        hasil_teks += `${'-'.repeat(40)}\n`;
    } else if (type === 'single') {
        hasil_teks = `[SINGLE] ${dateStr}\n`;
        hasil_teks += `Harga Produk : ${rupiah(harga)}\n`;
        hasil_teks += `Persentase   : ${persen}%\n`;
        hasil_teks += `Komisi Dapat : ${rupiah(komisi)}\n`;
        hasil_teks += `${'-'.repeat(40)}\n\n`;
    } else if (type === 'massal_footer') {
        const { n, total_komisi } = reqBody;
        hasil_teks = `💰 Total komisi dari ${n} produk: ${rupiah(total_komisi)}\n${'='.repeat(40)}\n\n`;
    }

    // Read existing history, append, and save
    let currentHistory = await env.HISTORY_KV.get('HISTORY_TEXT');
    if (!currentHistory) currentHistory = "";
    
    currentHistory += hasil_teks;
    
    await env.HISTORY_KV.put('HISTORY_TEXT', currentHistory);

    return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
    });
}
