const nodemailer = require('nodemailer');

class EmailController {
    constructor() {
        this.transporter = null;
    }

    initTransporter(config) {
        if (config.provider === 'gmail') {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: config.user,
                    pass: config.pass // App Password
                }
            });
        } else {
            this.transporter = nodemailer.createTransport({
                host: config.host,
                port: parseInt(config.port) || 465,
                secure: parseInt(config.port) === 465, // true for 465, false for other ports
                auth: {
                    user: config.user,
                    pass: config.pass
                }
            });
        }
    }

    async verifyConnection() {
        if (!this.transporter) throw new Error('Servidor SMTP no configurado');
        return await this.transporter.verify();
    }

    async sendEmail(to, subject, htmlBody, fromEmail) {
        if (!this.transporter) throw new Error('Servidor SMTP no configurado');
        
        const mailOptions = {
            from: fromEmail,
            to: to,
            subject: subject,
            html: htmlBody
        };

        return await this.transporter.sendMail(mailOptions);
    }
}

module.exports = new EmailController();
