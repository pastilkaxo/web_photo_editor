const userService = require('../service/user-service');
const {validationResult} = require('express-validator');
const ApiError = require('../Exceptions/api-error');

class AuthController {
    async register(req, res,next) {
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return next(ApiError.BadRequest("Ошибка при валидации",errors.array()));
            }
            const {email,password} = req.body;
            const userData = await userService.register(email,password);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
           return res.json(userData);
        }
        catch(err){
           next(err);
        }
    }

    async login(req, res,next) {
        try{
            const {email,password} = req.body;
            const userData = await userService.login(email,password);
            res.cookie('refreshToken',userData.refreshToken,{maxAge:30*24*60*60*1000,httpOnly:true});
            return res.json(userData);

        }
        catch(err){
            next(err);
        }
    }

    async logout(req, res,next) {
        try{
            const {refreshToken} = req.cookies;
            const token = await userService.logout(refreshToken);
            res.clearCookie('refreshToken');
            return res.json(token);
        }
        catch(err){
            next(err);
        }
    }

    async googleAuth(req, res, next) {
        try {
            const { credential } = req.body;
            const userData = await userService.googleAuth(credential);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            return res.json(userData);
        }
        catch(err) {
            next(err);
        }
    }

}

module.exports = new AuthController();