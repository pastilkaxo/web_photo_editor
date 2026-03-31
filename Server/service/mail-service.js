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

    async sendContestWeekStarted(to, theme) {
        const client = process.env.CLIENT_URL || "";
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: `Новая тема недели в WebIllustrator: ${theme}`,
            text: `Стартовала новая неделя конкурса. Тема: ${theme}. Откройте приложение: ${client}`,
            html: `
            <div>
              <h1>Новая неделя конкурса</h1>
              <p>Тема: <strong>${theme}</strong></p>
              <p>До пятницы можно отправить работу из редактора, на выходных — активное голосование.</p>
              <p><a href="${client}">Открыть приложение</a></p>
            </div>`,
        });
    }

    async sendContestWeekStartedBulk(theme) {
        const UserModel = require("../models/user-model");
        const users = await UserModel.find({
            emailContestAnnouncements: true,
            isBlocked: { $ne: true },
        })
            .select("email")
            .lean();
        for (const u of users) {
            if (!u.email) continue;
            try {
                await this.sendContestWeekStarted(u.email, theme);
            } catch (e) {
                console.error("SMTP contest mail to", u.email, e.message);
            }
        }
    }

    async sendFollowedAuthorNewPublicProject(to, { authorDisplayName, projectName, authorId, projectId }) {
        const client = (process.env.CLIENT_URL || "").replace(/\/$/, "");
        const storageUrl = client ? `${client}/storage` : "";
        const profileUrl = client && authorId ? `${client}/profile/${authorId}` : "";
        const safeName = (projectName || "Новая работа").replace(/</g, "");
        const safeAuthor = (authorDisplayName || "Автор").replace(/</g, "");
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: `${safeAuthor} опубликовал новую работу: ${safeName}`,
            text: `${safeAuthor} опубликовал публичный проект «${safeName}». Откройте каталог: ${storageUrl}`,
            html: `
            <div>
              <h1>Новая работа у автора, на которого вы подписаны</h1>
              <p><strong>${safeAuthor}</strong> опубликовал проект «<strong>${safeName}</strong>».</p>
              ${profileUrl ? `<p><a href="${profileUrl}">Профиль автора</a></p>` : ""}
              ${storageUrl ? `<p><a href="${storageUrl}">Открыть каталог</a></p>` : ""}
              ${projectId ? `<p style="color:#666;font-size:12px">ID проекта: ${String(projectId)}</p>` : ""}
            </div>`,
        });
    }

    /**
     * Рассылка подписчикам (following содержит authorId), у кого включены уведомления.
     */
    async notifyFollowersNewPublicProject(authorId, project) {
        const UserModel = require("../models/user-model");
        const mongoose = require("mongoose");
        const oid = mongoose.Types.ObjectId.isValid(authorId)
            ? new mongoose.Types.ObjectId(authorId)
            : authorId;
        const followers = await UserModel.find({
            following: oid,
            isBlocked: { $ne: true },
            emailFollowingAuthorPosts: { $ne: false },
        })
            .select("email")
            .lean();
        const displayName = (project.ownerName && String(project.ownerName).trim()) || "Автор";
        const name = project.name || "Новая работа";
        const pid = project._id ? project._id.toString() : "";
        const aid = oid.toString();
        for (const f of followers) {
            if (!f.email) continue;
            try {
                await this.sendFollowedAuthorNewPublicProject(f.email, {
                    authorDisplayName: displayName,
                    projectName: name,
                    authorId: aid,
                    projectId: pid,
                });
            } catch (e) {
                console.error("SMTP follow-author post to", f.email, e.message);
            }
        }
    }
}

module.exports = new MailService();