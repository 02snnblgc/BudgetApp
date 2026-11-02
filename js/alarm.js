/**
 * Hatırlatıcı ve Sesli/Görüntülü Alarm Yönetim Modülü
 */
const AlarmManager = {
    init() {
        if ("Notification" in window) {
            Notification.requestPermission();
        }
    },

    checkAlarms(records) {
        const todayStr = new Date().toISOString().split('T')[0];
        
        records.forEach(record => {
            if (record.type === 'expense' && record.date === todayStr && !record.paid && !record.snoozedToday) {
                this.triggerAlarm(record);
            }
        });
    },

    triggerAlarm(record) {
        // Ses Çal
        const audio = document.getElementById('alarm-sound');
        if (audio) {
            audio.play().catch(e => console.log("Ses yürütme engellendi: " + e));
        }

        // Ekran Uyarısı (Görüntülü) ve Dialog
        setTimeout(() => {
            const userChoice = confirm(
                `⏰ ÖDEME HATIRLATICI!\n\n` +
                `Ödeme: ${record.category}\n` +
                `Miktar: ${record.amount} TL\n` +
                `Son Ödeme Tarihi: ${record.date}\n\n` +
                `Bu ödemeyi gerçekleştirdiniz mi?\n` +
                `[Tamam] = Ödendi İşaretle\n` +
                `[İptal] = Ödenmedi (1 Saat Sonra Tekrar Hatırlat)`
            );

            if (userChoice) {
                record.paid = true;
                App.saveData();
                App.render();
            } else {
                // 1 saat sonra (3600000 ms) tekrar tetikle
                record.snoozedToday = true;
                setTimeout(() => {
                    record.snoozedToday = false;
                    this.triggerAlarm(record);
                }, 3600000);
            }
        }, 500);

        // System Push Notification (Mobil / Cordova Destekli)
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Ödeme Zamanı Geldi!", {
                body: `${record.category} için ${record.amount} TL ödemenizin son günü!`,
                icon: 'assets/icons/app-icon.png'
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => AlarmManager.init());