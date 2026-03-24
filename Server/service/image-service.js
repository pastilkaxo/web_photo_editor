const ImageModel = require("../models/image-model");
const ApiError = require("../Exceptions/api-error");
const S3Service = require("../utils/s3.service");
const UserModel = require("../models/user-model");

class ImageService {
    async createImage(userId,filename,json={}) {
        const s3key = await S3Service.uploadJson(userId, json, filename);
        const image = await ImageModel.create({
            filename,
            s3key,
            owner: userId,
            visibility: "PRIVATE",
            sharedWith: [],
            sharedWithEmails:[]
        });
        return image;
    }

    async getImage() {
        
    }

    async updateImage() {
        
    }

    async setVisability() {
        
    }

    async shareByEmail() {
        
    }


    async getAccessUrl() {
        
    }


}

module.exports = new ImageService();
