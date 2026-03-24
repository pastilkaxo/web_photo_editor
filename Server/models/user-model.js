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

})

module.exports = model('User', UserSchema);