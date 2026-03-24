const userService = require('../service/user-service');
const {validationResult} = require('express-validator');
const ApiError = require('../Exceptions/api-error');

class TokenController {

    async activate(req, res,next) {
        try{
            const activationLink = req.params.link;
            await userService.activate(activationLink);
            return res.redirect(process.env.CLIENT_URL);
        }
        catch(err){
            next(err); // ApiError
        }
    }

    async refresh(req, res,next) {
        try{
            const refreshToken = req.cookies.refreshToken;
            const userData = await userService.refresh(refreshToken);
            res.cookie('refreshToken',userData.refreshToken,{maxAge:30*24*60*60*1000,httpOnly:true});
            return res.json(userData);
        }
        catch(err){
            next(err);
        }   
    }

}

module.exports = new TokenController();