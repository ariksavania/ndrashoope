document.addEventListener('DOMContentLoaded', () => {
    
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
});
