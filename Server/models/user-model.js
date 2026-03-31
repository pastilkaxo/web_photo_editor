const {Schema, model} = require('mongoose');

const UserSchema = new Schema({
    email: { type: String, unique: true, required: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    password: {type: String, required: false},
    googleId: {type: String, default: null},
    isActivated: {type: Boolean, default: false},
    activationLink: {type: String},
    roles: [{type: String, ref: 'Role'}],
    resetRequestedAt: { type: Date, default: null },
    isBlocked: { type: Boolean, default: false },
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    totalStars: { type: Number, default: 0 },
    /** Подписки на авторов (email при их активности — расширяемо) */
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    /** Почтовые уведомления о старте недельного конкурса */
    emailContestAnnouncements: { type: Boolean, default: true },
    /** Письма о новых публичных работах авторов, на которых подписан */
    emailFollowingAuthorPosts: { type: Boolean, default: true },
    contestBadges: [{
        kind: { type: String, required: true },
        weekIndex: { type: Number, required: true },
        theme: { type: String, default: '' },
        awardedAt: { type: Date, default: Date.now },
    }],
    goldenAvatarUntil: { type: Date, default: null },
    socialLink: { type: String, default: '' },
}, { timestamps: true })

module.exports = model('User', UserSchema);