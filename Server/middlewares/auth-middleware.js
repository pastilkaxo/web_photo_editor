const ApiError = require('../Exceptions/api-error');
const tokenService = require("../service/token-service")

module.exports = async function(req, res, next){
    try{
        const authorization = req.headers.authorization;
        if(!authorization){
            return next(ApiError.UnauthorizedError());
        }
        const accessToken = authorization.split(' ')[1];
        if(!accessToken){
            return next(ApiError.UnauthorizedError());
        }
        const userData = await tokenService.validateAccessToken(accessToken);
        if(!userData){
            return next(ApiError.UnauthorizedError());
        }
        req.user = userData;
        next();
    }
    catch(err){
        return next(ApiError.UnauthorizedError());
    }
}