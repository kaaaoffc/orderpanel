// api/submit-order.js
import fetch from 'node-fetch';
import FormData from 'form-data';

export default async function handler(req, res) {
    // CORS headers untuk keamanan
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username, email, packageName, totalPrice, whatsappNumber, notes, imageBase64, imageMime } = req.body;

    // Validasi input
    if (!username || !email || !packageName || !totalPrice === undefined || !whatsappNumber || !imageBase64) {
        return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    // Ambil environment variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        console.error('Missing Telegram environment variables');
        return res.status(500).json({ error: 'Konfigurasi server error' });
    }

    // Format pesan untuk Telegram
    const caption = `⚡ *ORDER PANEL PTERODACTYL* ⚡
    
👤 *Username:* ${username}
📧 *Email:* ${email}
📦 *Paket:* ${packageName}
💰 *Total:* Rp ${totalPrice.toLocaleString('id-ID')}
📱 *WA User:* ${whatsappNumber}
📝 *Catatan:* ${notes}

🔔 *Silakan proses pembuatan panel dan kirim kredensial ke email user.*`;

    try {
        // Kirim foto ke Telegram
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Format base64 tidak valid');
        }
        const mime = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        const form = new FormData();
        form.append('chat_id', chatId);
        form.append('caption', caption);
        form.append('photo', buffer, {
            filename: `bukti_${username}_${Date.now()}.jpg`,
            contentType: mime,
        });
        form.append('parse_mode', 'Markdown');

        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
        const telegramResponse = await fetch(telegramUrl, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const telegramResult = await telegramResponse.json();
        if (!telegramResult.ok) {
            console.error('Telegram error:', telegramResult);
            throw new Error(telegramResult.description || 'Gagal kirim ke Telegram');
        }

        // Kirim email konfirmasi ke user via Resend (opsional, bisa diaktifkan)
        // Panggil API send-email jika diperlukan
        try {
            const emailPayload = {
                to: email,
                username: username,
                packageName: packageName,
                totalPrice: totalPrice,
                whatsappNumber: whatsappNumber,
                notes: notes
            };
            const emailResponse = await fetch(`${process.env.VERCEL_URL || 'https://' + req.headers.host}/api/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailPayload)
            });
            if (!emailResponse.ok) {
                console.error('Email sending failed:', await emailResponse.text());
            }
        } catch (emailError) {
            console.error('Error sending email:', emailError);
        }

        res.status(200).json({ success: true, message: 'Notifikasi terkirim ke owner, email konfirmasi akan menyusul' });
    } catch (error) {
        console.error('Submit order error:', error);
        res.status(500).json({ error: 'Gagal mengirim notifikasi: ' + error.message });
    }
    }
