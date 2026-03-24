const {Schema, model} = require('mongoose');

const ProjectSchema = new Schema({
    name: { type: String, required: true },
    s3Key: { type: String, required: true }, 
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ownerName: { type: String, default: 'Unknown' },
    // previewUrl: { type: String },
    visibility: { 
        type: String, 
        enum: ['PRIVATE', 'PUBLIC'], 
        default: 'PRIVATE' 
    },
    category: {
        type: String,
        enum: ['NATURE', 'ANIMALS', 'PEOPLE', 'CITY', 'TECHNOLOGY', 'ABSTRACT', 'FOOD', 'TRAVEL', 'OTHER'],
        default: 'OTHER'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    previewImage: { type: String, default: '' },
    stars: { type: Number, default: 0 }, 
    ratedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments:[{type: Schema.Types.ObjectId, ref: 'Comment'}],
});

module.exports = model('Project', ProjectSchema);