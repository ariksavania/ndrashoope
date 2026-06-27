document.addEventListener('DOMContentLoaded', () => {
    
    // Main App Navigation Logic
    const mainNavBtns = document.querySelectorAll('.main-nav-btn');
    const appSections = document.querySelectorAll('.app-section');

    mainNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            mainNavBtns.forEach(b => b.classList.remove('active'));
            appSections.forEach(s => s.classList.remove('active'));
            
            btn.classList.add('active');
            const targetApp = btn.getAttribute('data-app');
            document.getElementById(`app-${targetApp}`).classList.add('active');
        });
    });

    // Tab Navigation Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active classes
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            if (targetId === 'history') {
                loadHistory();
            }
        });
    });

    // Formatting utilities
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            .format(amount)
            .replace(/,/g, '_')
            .replace(/\./g, ',')
            .replace(/_/g, '.');
    };
    
    const rupiah = (val) => `Rp${formatCurrency(val)}`;

    // Show Toast
    const showToast = (message) => {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.remove('hidden');
        // Trigger reflow
        void toast.offsetWidth;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    // --- Mode Single ---
    const btnHitungSingle = document.getElementById('btn-hitung-single');
    
    btnHitungSingle.addEventListener('click', async () => {
        const harga = parseFloat(document.getElementById('harga-single').value);
        const persen = parseFloat(document.getElementById('persen-single').value);
        
        if (isNaN(harga) || isNaN(persen)) {
            alert('Silakan masukkan angka yang valid!');
            return;
        }

        const komisi = harga * (persen / 100);

        // Update UI
        document.getElementById('res-harga-single').textContent = rupiah(harga);
        document.getElementById('res-persen-single').textContent = `${persen}%`;
        document.getElementById('res-komisi-single').textContent = rupiah(komisi);
        document.getElementById('result-single').classList.remove('hidden');

        // Save to backend
        try {
            const res = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ harga, persen, komisi, type: 'single' })
            });
            if(res.ok) showToast('✅ Hasil Single disimpan!');
        } catch(e) {
            console.error('Error saving:', e);
        }
    });

    // --- Mode Massal ---
    const btnSetMassal = document.getElementById('btn-set-massal');
    const massalContainer = document.getElementById('massal-container');
    const massalInputs = document.getElementById('massal-inputs');
    const btnHitungMassal = document.getElementById('btn-hitung-massal');
    
    let jumlahMassal = 0;

    btnSetMassal.addEventListener('click', () => {
        jumlahMassal = parseInt(document.getElementById('jumlah-massal').value);
        
        if (isNaN(jumlahMassal) || jumlahMassal < 1) {
            alert('Masukkan jumlah produk yang valid (minimal 1)');
            return;
        }

        massalContainer.innerHTML = '';
        for(let i = 1; i <= jumlahMassal; i++) {
            const div = document.createElement('div');
            div.className = 'massal-item-card';
            div.innerHTML = `
                <h4>Produk ke-${i}</h4>
                <div class="input-group">
                    <label>Harga Produk (Rp)</label>
                    <input type="number" id="harga-massal-${i}" placeholder="Harga produk..." step="any">
                </div>
                <div class="input-group" style="margin-bottom:0;">
                    <label>Persentase (%)</label>
                    <input type="number" id="persen-massal-${i}" placeholder="Persentase komisi..." step="any">
                </div>
            `;
            massalContainer.appendChild(div);
        }
        
        massalInputs.classList.remove('hidden');
        document.getElementById('result-massal').classList.add('hidden');
    });

    btnHitungMassal.addEventListener('click', async () => {
        const items = [];
        let total_komisi = 0;

        for(let i = 1; i <= jumlahMassal; i++) {
            const harga = parseFloat(document.getElementById(`harga-massal-${i}`).value);
            const persen = parseFloat(document.getElementById(`persen-massal-${i}`).value);
            
            if (isNaN(harga) || isNaN(persen)) {
                alert(`Data produk ke-${i} tidak lengkap atau tidak valid.`);
                return;
            }

            const komisi = harga * (persen / 100);
            total_komisi += komisi;
            items.push({ harga, persen, komisi });
        }

        // Display results
        document.getElementById('res-total-massal').textContent = rupiah(total_komisi);
        const detailsList = document.getElementById('massal-details-list');
        detailsList.innerHTML = '';

        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'detail-row';
            div.innerHTML = `
                <span>Produk ${index + 1}: ${rupiah(item.harga)} x ${item.persen}%</span>
                <span class="cyan-text">${rupiah(item.komisi)}</span>
            `;
            detailsList.appendChild(div);
        });

        document.getElementById('result-massal').classList.remove('hidden');

        // Save to backend
        try {
            await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'massal_header' })
            });

            for(const item of items) {
                await fetch('/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...item, type: 'massal_item' })
                });
            }

            await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'massal_footer', n: items.length, total_komisi })
            });
            
            showToast('✅ Semua Hasil Massal disimpan!');
        } catch(e) {
            console.error('Error saving massal:', e);
        }
    });

    // --- History Mode ---
    const btnRefreshHistory = document.getElementById('btn-refresh-history');
    const historyContent = document.getElementById('history-content');

    const loadHistory = async () => {
        historyContent.textContent = 'Memuat data...';
        try {
            const res = await fetch('/api/history');
            const data = await res.json();
            if (data.history) {
                historyContent.textContent = data.history;
            } else if (data.error) {
                historyContent.textContent = 'Error: ' + data.error;
            }
        } catch(e) {
            historyContent.textContent = 'Gagal terhubung ke server.';
        }
    };

    btnRefreshHistory.addEventListener('click', loadHistory);

    // --- Shopee Video Logic ---
    const btnProcessVideo = document.getElementById('btn-process-video');
    if (btnProcessVideo) {
        btnProcessVideo.addEventListener('click', async () => {
            const url = document.getElementById('video-url').value;
            if (!url) {
                showToast('Masukkan URL video terlebih dahulu!');
                return;
            }
            
            const originalText = btnProcessVideo.innerHTML;
            btnProcessVideo.innerHTML = 'MEMPROSES...';
            btnProcessVideo.disabled = true;
            
            try {
                const res = await fetch('/api/extract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                
                const data = await res.json();
                
                if (data.error || data.success === false) {
                    showToast(data.message || 'Gagal mengekstrak video');
                    btnProcessVideo.innerHTML = originalText;
                    btnProcessVideo.disabled = false;
                    return;
                }

                // Parsing according to the API structure from main.py
                const coverUrl = data.preview || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400&auto=format&fit=crop';
                const username = data.username || 'nandaandhika9';
                
                let streams = data.streams_array || [];
                
                if (streams.length === 0) {
                    showToast('Video stream tidak ditemukan');
                    console.log('API Response:', data);
                    btnProcessVideo.innerHTML = originalText;
                    btnProcessVideo.disabled = false;
                    return;
                }

                // Setup video player
                const bestStream = streams.find(s => s.quality && s.quality.includes('720')) || streams[0];
                const videoPlayer = document.getElementById('video-player');
                videoPlayer.src = bestStream.stream_url;
                videoPlayer.poster = coverUrl;
                
                // Update username
                document.getElementById('video-username').textContent = username;
                
                // Render quality list
                const qualityList = document.getElementById('quality-list-container');
                qualityList.innerHTML = '';
                
                // Sort streams based on python logic
                const qualityPriority = (q) => {
                    const qUp = q.toUpperCase();
                    if (qUp.includes('V720P') || qUp.includes('720P')) return 0;
                    if (qUp.includes('V480P') || qUp.includes('480P')) return 1;
                    if (qUp.includes('V360P') || qUp.includes('360P')) return 2;
                    return 3;
                };
                streams.sort((a, b) => qualityPriority(a.quality || '') - qualityPriority(b.quality || ''));
                
                streams.forEach(stream => {
                    const isBest = (stream.quality || '').toUpperCase().includes('720');
                    const badgeClass = isBest ? 'quality-badge' : 'quality-badge standard';
                    const icon = isBest ? '⭐ ' : '';
                    
                    const row = document.createElement('div');
                    row.className = 'quality-row';
                    row.innerHTML = `
                        <div class="quality-badge-container">
                            <span class="${badgeClass}">${icon}${stream.quality || 'Unknown'}</span>
                        </div>
                        <div class="quality-details">
                            <span>Codec: ${stream.codec || 'MP4'}</span>
                            <span>Durasi: ${stream.duration || 0}s</span>
                        </div>
                        <button class="btn-download-outline" data-url="${stream.stream_url}" data-quality="${stream.quality}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                            </svg>
                            Unduh
                        </button>
                    `;
                    qualityList.appendChild(row);
                });
                
                // Add event listeners to download buttons
                document.querySelectorAll('.btn-download-outline').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const url = e.currentTarget.getAttribute('data-url');
                        const quality = e.currentTarget.getAttribute('data-quality');
                        const filename = `${username}_${quality}.mp4`;
                        window.location.href = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
                    });
                });

                document.getElementById('video-preview-container').classList.remove('hidden');
                
                btnProcessVideo.innerHTML = originalText;
                btnProcessVideo.disabled = false;
                showToast('Video berhasil ditemukan!');
            } catch (err) {
                showToast('Terjadi kesalahan jaringan');
                console.error(err);
                btnProcessVideo.innerHTML = originalText;
                btnProcessVideo.disabled = false;
            }
        });
    }

});
