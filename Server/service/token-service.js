const jwt = require("jsonwebtoken");
const tokenModel = require("../models/token-model");

class TokenService {
    generateTokens(payload){
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET,{expiresIn:"15d"});
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET,{expiresIn:"30d"});
        return {accessToken, refreshToken};
    }

    generatePasswordToken(userId){
        const passwordToken = jwt.sign({userId}, process.env.JWT_RESET_SECRET,{expiresIn:"15m"});
        return {passwordToken};
    }

    async validatePasswordToken(token){
        try{
            const userData = jwt.verify(token, process.env.JWT_RESET_SECRET);
            return userData;
        }
        catch(error){
            return null;
        }
    }

    async validateAccessToken(token) {
        try{
            const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            return userData;
        }
        catch(err){
            return null;
        }
    }

    async validateRefreshToken(token) {
        try{
            const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
            return userData;
        }
        catch(err){
            return null;
        }
    }

    async saveToken(userId, refreshToken) {
        const tokenData = await tokenModel.findOne({ user: userId });
        if (tokenData) {
            tokenData.refreshToken = refreshToken;
            return tokenData.save();
        }
        const token = await tokenModel.create({user: userId, refreshToken})
        return token;
    }

    async removeToken(refreshToken) {
        const tokenData = await tokenModel.deleteOne({ refreshToken: refreshToken });
        return tokenData;
    }

    async findToken(refreshToken) {
        const tokenData = await tokenModel.findOne({ refreshToken: refreshToken });
        return tokenData;
    }


}

module.exports = new TokenService();