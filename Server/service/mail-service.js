const nodemailer = require('nodemailer');

class MailService {

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth:{
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
            secure: false,
        })
    }
    async sendActivationMail(to,link) {
                    await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to:to,
            subject:"Activation Mail " + process.env.API_URL,
            text:"",
            html:
                `
                <div class="container">
                <h1>Для активации перейдите по ссылке</h1>
                <a href="${link}">${link}</a>
</div>
                `
        })

    }

    async sendPasswordResetLink (to,link) {
                    await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to:to,
            subject:"Reset Password " + process.env.CLIENT_URL,
            text:"",
            html:`
            <div class="container">
            <h1>Для того что бы сбросить пароль перейдите по ссылке:</h1>
            <a href="${link}">${link}</a>
            </div>
            `
        })

    }
}

module.exports = new MailService();