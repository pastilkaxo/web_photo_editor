const { Schema, model } = require('mongoose');

const CommentSchema = new Schema({
    text: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = model('Comment', CommentSchema);