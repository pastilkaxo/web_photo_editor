const ApiError = require('../Exceptions/api-error');
const tokenService = require("../service/token-service")

module.exports = function (roles) {
    return async function(req, res, next){
        try {
        let hasRole = false;
        const { roles: userRole } = req.user;
        userRole.forEach(role => {
            if (roles.includes(role)) {
                hasRole = true;
            }
        });
        if (!hasRole) {
            return next(ApiError.NoAccess());
        }
        next();
    }
    catch(err){
        return next(ApiError.UnauthorizedError());
    }
}
}