// api/send-email.js
import { Resend } from 'resend';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, username, packageName, totalPrice, whatsappNumber, notes } = req.body;

    if (!to || !username) {
        return res.status(400).json({ error: 'Email dan username diperlukan' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
        console.error('RESEND_API_KEY not configured');
        return res.status(500).json({ error: 'Email service not configured' });
    }

    const resend = new Resend(resendApiKey);
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    const toEmail = to;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Konfirmasi Order Panel Pterodactyl - MTS4YOU XD</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
                .header { background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { padding: 20px; }
                .footer { background: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
                .detail { margin: 15px 0; padding: 10px; background: #f9f9f9; border-left: 4px solid #8b5cf6; }
                .button { display: inline-block; background: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>⚡ MTS4YOU XD</h2>
                    <p>Konfirmasi Order Panel Pterodactyl</p>
                </div>
                <div class="content">
                    <p>Halo <strong>${username}</strong>,</p>
                    <p>Terima kasih telah melakukan order panel Pterodactyl di MTS4YOU XD. Berikut adalah detail order Anda:</p>
                    <div class="detail">
                        <p><strong>📦 Paket:</strong> ${packageName}</p>
                        <p><strong>💰 Total Pembayaran:</strong> Rp ${totalPrice.toLocaleString('id-ID')}</p>
                        <p><strong>📱 WhatsApp:</strong> ${whatsappNumber}</p>
                        <p><strong>📝 Catatan:</strong> ${notes || '-'}</p>
                    </div>
                    <p>Kami telah menerima bukti transfer Anda dan sedang memproses order. Owner akan segera membuatkan panel Anda dan mengirimkan informasi login ke email ini.</p>
                    <p>Jika ada pertanyaan, silakan hubungi owner via WhatsApp:</p>
                    <p><a href="https://wa.me/6285137572401" class="button">💬 Hubungi Owner</a></p>
                    <p style="font-size: 13px;">Garansi berlaku 30 hari, maksimal 5 kali penggantian.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 MTS4YOU XD. All rights reserved.</p>
                    <p>Syarat & Ketentuan | Kebijakan Privasi</p>
                </div>
            </div>
        </body>
        </html>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: `MTS4YOU XD <${fromEmail}>`,
            to: [toEmail],
            subject: `Konfirmasi Order Panel - ${packageName}`,
            html: htmlContent,
        });

        if (error) {
            console.error('Resend error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ success: true, message: 'Email konfirmasi terkirim', data });
    } catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({ error: 'Gagal mengirim email: ' + error.message });
    }
}
