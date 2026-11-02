/**
 * Ana Uygulama Mantığı (Ana Modül)
 */
const App = {
    state: {
        user: null,
        theme: 'dark',
        pastelTheme: 'pastel-blue',
        currentDate: new Date(),
        records: [],
        periodNotes: {},
        categories: {
            income: [
                "Maaş", "Ek Gelir", "Kira Geliri", "Türkiye Finanstan Çekilen", "Diğer"
            ],
            expense: [
                "Ziraat Bankası Troy", "Ziraat Bankası M.Card", "Halk Bankası Troy", "Halk Bankası M.Card", 
                "Türkiye Finans", "Elektrik Faturası", "Su Faturası", "Doğal gaz Faturası", 
                "Sıcak Su Doğal gaz Faturası", "İnternet Faturası", "Site Aidatı", "Sabiha Telefon Faturası", 
                "Sinan Telefon Faturası", "Hüda Nur Telefon Faturası", "Hüda Nur Aylık", "Sabihaya", 
                "Sinana", "Traş İçin", "İş Yeri Yemek", "İş Yeri Çay", "İş Yeri Su", "Araç Sigortası", 
                "Araç Muayenesi", "Araç Bakımı", "Araç Lastiği", "Kira / Konut", "Mutfak & Market", 
                "Eğitim & Kurs", "Sağlık & Bakım", "Diğer"
            ]
        }
    },

    init() {
        this.loadData();
        this.checkAuth();
        this.render();
        // 1 dakikada bir alarmları denetle
        setInterval(() => AlarmManager.checkAlarms(this.state.records), 60000);
    },

    // --- Kimlik Doğrulama / Kullanıcı Mantığı ---
    checkAuth() {
        const authScreen = document.getElementById('auth-screen');
        const appContainer = document.getElementById('app-container');
        if (this.state.user) {
            authScreen.classList.add('hidden');
            appContainer.classList.remove('hidden');
            document.getElementById('user-display-name').textContent = this.state.user.username;
            document.getElementById('user-avatar').src = this.state.user.avatar || 'assets/icons/app-icon.png';
        } else {
            authScreen.classList.remove('hidden');
            appContainer.classList.add('hidden');
        }
    },

    login() {
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;
        const avatarInput = document.getElementById('avatar-input');

        if (!u || !p) return alert("Kullanıcı adı ve parola zorunludur!");

        let avatarData = '';
        if (avatarInput.files && avatarInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarData = e.target.result;
                this.completeLogin(u, avatarData);
            };
            reader.readAsDataURL(avatarInput.files[0]);
        } else {
            this.completeLogin(u, 'assets/icons/app-icon.png');
        }
    },

    completeLogin(username, avatar) {
        this.state.user = { username, avatar };
        this.saveData();
        this.checkAuth();
    },

    logout() {
        this.state.user = null;
        this.saveData();
        this.checkAuth();
    },

    // --- Tema Yönetimi ---
    toggleThemeMode() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.state.theme);
        this.saveData();
    },

    changePastelTheme(themeName) {
        this.state.pastelTheme = themeName;
        document.documentElement.setAttribute('data-pastel-theme', themeName);
        this.saveData();
    },

    // --- Dönem Navigasyonu ---
    getPeriodKey(date = this.state.currentDate) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    },

    changeMonth(delta) {
        this.state.currentDate.setMonth(this.state.currentDate.getMonth() + delta);
        this.render();
    },

    // --- Veri Modelleri & Depolama ---
    saveData() {
        localStorage.setItem('budget_app_state', JSON.stringify(this.state));
    },

    loadData() {
        const local = localStorage.getItem('budget_app_state');
        if (local) {
            const parsed = JSON.parse(local);
            this.state = { ...this.state, ...parsed };
            this.state.currentDate = new Date(this.state.currentDate || Date.now());
            document.documentElement.setAttribute('data-theme', this.state.theme || 'dark');
            document.documentElement.setAttribute('data-pastel-theme', this.state.pastelTheme || 'pastel-blue');
        }
    },

    // --- Kayıt İşlemleri (Ekle, Sil, Düzenle, Mükerrer Kontrolü) ---
    openRecordModal(type, recordId = null) {
        const modal = document.getElementById('record-modal');
        const title = document.getElementById('modal-title');
        const catSelect = document.getElementById('record-category');
        
        document.getElementById('record-form').reset();
        document.getElementById('record-id').value = recordId || '';
        document.getElementById('record-type').value = type;

        catSelect.innerHTML = this.state.categories[type]
            .map(c => `<option value="${c}">${c}</option>`).join('');

        if (recordId) {
            const rec = this.state.records.find(r => r.id === recordId);
            if (rec) {
                title.textContent = "Kayıt Düzenle";
                catSelect.value = rec.category;
                document.getElementById('record-amount').value = rec.amount;
                document.getElementById('record-date').value = rec.date;
                document.getElementById('record-note').value = rec.note;
            }
        } else {
            title.textContent = type === 'income' ? 'Gelir Ekle' : 'Gider Ekle';
            document.getElementById('record-date').value = new Date().toISOString().split('T')[0];
        }

        modal.classList.remove('hidden');
    },

    closeRecordModal() {
        document.getElementById('record-modal').classList.add('hidden');
    },

    handleRecordSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('record-id').value || Date.now().toString();
        const type = document.getElementById('record-type').value;
        const category = document.getElementById('record-category').value;
        const amount = parseFloat(document.getElementById('record-amount').value);
        const date = document.getElementById('record-date').value;
        const note = document.getElementById('record-note').value;
        const period = date.substring(0, 7);

        // Mükerrer (Yinelenen) Kayıt Kontrolü
        const isDuplicate = this.state.records.some(r => 
            r.id !== id && r.type === type && r.category === category && r.amount === amount && r.date === date
        );

        if (isDuplicate) {
            const confirmAdd = confirm("⚠️ Bu tarih, miktar ve kategoride zaten bir kayıt mevcut. Yine de eklensin mi?");
            if (!confirmAdd) return;
        }

        const existingIdx = this.state.records.findIndex(r => r.id === id);
        const newRecord = { id, type, category, amount, date, period, note, paid: false };

        if (existingIdx > -1) {
            this.state.records[existingIdx] = newRecord;
        } else {
            this.state.records.push(newRecord);
        }

        this.saveData();
        this.closeRecordModal();
        this.render();
        AlarmManager.checkAlarms(this.state.records);
    },

    deleteRecord(id) {
        if (confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
            this.state.records = this.state.records.filter(r => r.id !== id);
            this.saveData();
            this.render();
        }
    },

    // --- Notlar ve Karşılaştırma ---
    savePeriodNote() {
        const periodKey = this.getPeriodKey();
        const noteText = document.getElementById('period-note').value;
        this.state.periodNotes[periodKey] = noteText;
        this.saveData();
    },

    comparePeriods() {
        const targetPeriod = document.getElementById('compare-period-select').value;
        const currentPeriod = this.getPeriodKey();

        const getStats = (p) => {
            const recs = this.state.records.filter(r => r.period === p);
            const inc = recs.filter(r => r.type === 'income').reduce((a, b) => a + b.amount, 0);
            const exp = recs.filter(r => r.type === 'expense').reduce((a, b) => a + b.amount, 0);
            return { inc, exp, bal: inc - exp };
        };

        const currentStats = getStats(currentPeriod);
        const targetStats = getStats(targetPeriod);

        const resDiv = document.getElementById('compare-result');
        resDiv.innerHTML = `
            <p><b>Mevcut Dönem (${currentPeriod}):</b> Gelir: ${currentStats.inc} TL | Gider: ${currentStats.exp} TL</p>
            <p><b>Seçilen Dönem (${targetPeriod}):</b> Gelir: ${targetStats.inc} TL | Gider: ${targetStats.exp} TL</p>
            <hr style="margin:5px 0">
            <p><b>Gider Farkı:</b> ${(currentStats.exp - targetStats.exp).toFixed(2)} TL</p>
        `;
    },

    // --- Dışa / İçe Aktar (Backup & PDF & Excel) ---
    exportBackup() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", `Butce_Yedek_${this.getPeriodKey()}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
    },

    importBackup(e) {
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
            try {
                const importedState = JSON.parse(event.target.result);
                this.state = importedState;
                this.saveData();
                this.render();
                alert("Yedek başarıyla yüklendi!");
            } catch (err) {
                alert("Hatalı yedek dosyası!");
            }
        };
        fileReader.readAsText(e.target.files[0]);
    },

    exportExcel() {
        const periodKey = this.getPeriodKey();
        const currentRecords = this.state.records.filter(r => r.period === periodKey);
        const wsData = currentRecords.map(r => ({
            "Tip": r.type === 'income' ? 'Gelir' : 'Gider',
            "Kategori": r.category,
            "Miktar (TL)": r.amount,
            "Tarih": r.date,
            "Not": r.note
        }));

        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Dönem Raporu");
        XLSX.writeFile(wb, `Butce_Raporu_${periodKey}.xlsx`);
    },

    exportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const periodKey = this.getPeriodKey();

        doc.text(`Aylik Butce Raporu - Dönem: ${periodKey}`, 14, 15);

        const currentRecords = this.state.records.filter(r => r.period === periodKey);
        const tableData = currentRecords.map(r => [
            r.type === 'income' ? 'Gelir' : 'Gider',
            r.category,
            `${r.amount} TL`,
            r.date,
            r.note || ''
        ]);

        doc.autoTable({
            head: [['Tip', 'Kategori', 'Miktar', 'Tarih', 'Not']],
            body: tableData,
            startY: 20
        });

        doc.save(`Butce_Raporu_${periodKey}.pdf`);
    },

    // --- Arama & Filtreleme ---
    filterRecords() {
        const query = document.getElementById('search-input').value.toLowerCase();
        const periodKey = this.getPeriodKey();
        const filtered = this.state.records.filter(r => 
            r.period === periodKey && 
            (r.category.toLowerCase().includes(query) || r.note.toLowerCase().includes(query) || r.amount.toString().includes(query))
        );
        this.renderTable(filtered);
    },

    // --- Render (Arayüz Güncelleme) ---
    render() {
        const periodKey = this.getPeriodKey();
        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        document.getElementById('current-period-label').textContent = `${monthNames[this.state.currentDate.getMonth()]} ${this.state.currentDate.getFullYear()}`;

        // İstatistikler
        const currentRecords = this.state.records.filter(r => r.period === periodKey);
        const totalInc = currentRecords.filter(r => r.type === 'income').reduce((a, b) => a + b.amount, 0);
        const totalExp = currentRecords.filter(r => r.type === 'expense').reduce((a, b) => a + b.amount, 0);

        document.getElementById('total-income').textContent = `${totalInc.toFixed(2)} TL`;
        document.getElementById('total-expense').textContent = `${totalExp.toFixed(2)} TL`;
        document.getElementById('net-balance').textContent = `${(totalInc - totalExp).toFixed(2)} TL`;

        // Dönem Notu Render
        document.getElementById('period-note').value = this.state.periodNotes[periodKey] || '';

        // Dönem Karşılaştırma Select Render
        const periods = [...new Set(this.state.records.map(r => r.period))];
        document.getElementById('compare-period-select').innerHTML = periods
            .map(p => `<option value="${p}">${p}</option>`).join('');

        this.renderTable(currentRecords);
    },

    renderTable(records) {
        const tbody = document.getElementById('records-list');
        tbody.innerHTML = records.map(r => `
            <tr>
                <td><span style="color:${r.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)'}; font-weight:bold;">${r.type === 'income' ? 'Gelir' : 'Gider'}</span></td>
                <td>${r.category}</td>
                <td><b>${r.amount.toFixed(2)} TL</b></td>
                <td>${r.date} ${r.paid ? '✅' : ''}</td>
                <td>${r.note || '-'}</td>
                <td>
                    <button class="btn btn-outline" onclick="App.openRecordModal('${r.type}', '${r.id}')">✏️</button>
                    <button class="btn btn-outline" onclick="App.deleteRecord('${r.id}')">🗑️</button>
                </td>
            </tr>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());