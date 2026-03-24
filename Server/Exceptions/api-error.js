module.exports = class ApiError extends Error {
    status;
    errors;
    
    constructor(status, message,errors) {
        super(message);
        this.status = status; 
        this.errors = errors;
    }
    
    static UnauthorizedError() {
        return new ApiError(401,"Пользователь не авторизован");
    }
    
    static BadRequest(message , errors = []) {
        return new ApiError(400,message , errors);
    }

    static NoAccess() {
        return new ApiError(403, "У вас нет доступа к этому ресурсу!");
    }

    static BlockedUser() {
        return new ApiError(423, "Ваш аккаунт заблокирован. Обратитесь к администратору.");
    }

    static EmailLimit() {
        return new ApiError(550, "Email limit exceed!");
    }

    static Internal(message, errors = []) {
        return new ApiError(500, message, errors);
    }
    
}
