const UserModel = require("../models/user-model.js")
const RoleModel = require("../models/role-model.js")
const ProjectModel = require("../models/project-model.js")
const bcrypt = require("bcrypt")
const { v4: uuidv4 } = require('uuid');
const mailService = require("../service/mail-service.js");
const tokenService = require("../service/token-service.js");
const projectService = require("../service/project-service.js");
const UserDto = require("../dtos/user-dto")
const ApiError = require("../Exceptions/api-error");
const { OAuth2Client } = require("google-auth-library");
const mongoose = require("mongoose");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


class UserService {

    async register(email,password) {
        const candidate = await UserModel.findOne({email});
        if (candidate) {
            throw ApiError.BadRequest(`Пользователь с почтой ${email} уже существует`);
        }
        const hashPassword = await bcrypt.hash(password, 4);
        const activationLink = uuidv4();
        const userRole = await RoleModel.findOne({ roleName: "USER" });
        const user = await  UserModel.create({email,password:hashPassword,activationLink,roles:[userRole.roleName]});
        await mailService.sendActivationMail(email,`${process.env.API_URL}/api/activate/${activationLink}`);

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});
        await tokenService.saveToken(userDto.id,tokens.refreshToken);
        return {
            ...tokens,
            user: userDto
        }
    }
    async activate(activationLink) {
        const user = await UserModel.findOne({activationLink});
        if(!user) {
            throw ApiError.BadRequest("Недопустимая ссылка активации");
        }
        user.isActivated = true;
        await user.save();
    }

    async login(email,password) {
        const user = await UserModel.findOne({email});
        if(!user) {
            throw ApiError.BadRequest("Неверная почта или пароль!");
        }
        const isPassEquals = await bcrypt.compare(password, user.password);
        if(!isPassEquals) {
            throw ApiError.BadRequest("Неверная почта или пароль!");
        }
        if (user.isBlocked) {
            throw ApiError.BlockedUser();
        }
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});
        await tokenService.saveToken(userDto.id,tokens.refreshToken);
        return {...tokens,user: userDto}
    }

    async logout(refreshToken) {
        const token = await tokenService.removeToken(refreshToken);
        return token;
    }

    async refresh(refreshToken) {
        if(!refreshToken) {
            throw ApiError.UnauthorizedError();
        }
        const userData = await tokenService.validateRefreshToken(refreshToken);
        const tokenFromDatabase = await tokenService.findToken(refreshToken);
        if(!tokenFromDatabase || !userData) {
           // throw ApiError.UnauthorizedError();
        }
        const user = await UserModel.findById(userData.id);

        if (!user || user.isBlocked) {
             throw ApiError.BlockedUser(); 
        }

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});
        await tokenService.saveToken(userDto.id,tokens.refreshToken);
        return {...tokens,user: userDto}
    }

    async requestPasswordResetLink(email) {
        const user  = await UserModel.findOne({email});
        if(!user) {
            throw ApiError.BadRequest("Пользователь с таким email не найден!");
        }
        const now = Date.now();
        if(user.resetRequestedAt && now - user.resetRequestedAt.getTime() < 15*60*1000) {
            throw ApiError.BadRequest("Ссылка уже была отправлена недавно. Проверьте почту.");
        }
        const {passwordToken} = tokenService.generatePasswordToken( user._id.toString());
        const resetLink = `${process.env.CLIENT_URL}/password/reset?token=${passwordToken}`;
        await mailService.sendPasswordResetLink(email,resetLink);
        user.resetRequestedAt = new Date();
        await user.save();
        return {passwordToken, message:`Ссылка для восстановления отправлена на почту ${email}.`}
    }

    async resetPassword(token,newPassword) {
        const payload = await tokenService.validatePasswordToken(token);
        console.log("payload.userId:", payload.userId);
        if (!payload) {
            throw ApiError.BadRequest("Ссылка недействительна или истекла");
        }
        const user = await UserModel.findById(payload.userId);
        if(!user) {
            throw ApiError.BadRequest("Пользователь не найден!");
        }
        user.password = await bcrypt.hash(newPassword, 4);
        await user.save();
        return {message:"Пароль успешно изменён."}
    }

    async updateMySelf(userId, updates) {
        const user = await UserModel.findByIdAndUpdate(userId, updates, { new: true });
        if (!user) {
            throw ApiError.BadRequest("Пользователь не найден!");
        }
        return user;
    } 


    // admin part

    async getAllUsers() {
        const users = await UserModel.find();
        return users;
    }

    async blockUser(userId) {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw ApiError.BadRequest("Пользователь не найден!");
        }
        user.isBlocked = true;
        await user.save();
        await projectService.deleteAllProjectsByOwner(userId.toString());
        return user;
    }

    async unblockUser(userId) {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw ApiError.BadRequest("Пользователь не найден!");
        }
        user.isBlocked = false;
        await user.save();
        return user;
    }

    async deleteUser(userId) {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw ApiError.BadRequest("Пользователь не найден!");
        }
        await UserModel.findByIdAndDelete(userId);
        await ProjectModel.deleteMany({ comments: { $in: [userId] } });
        await ProjectModel.deleteMany({ owner: userId });
        return {message: "Пользователь успешно удалён."};
    }

    async updateUser(userId,updates){
        const user = await UserModel.findByIdAndUpdate(userId, updates, { new: true });
        if (!user) {
            throw ApiError.BadRequest("Пользователь не найден!");
        }
        return user;
    }

    async getPublicProfile(userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw ApiError.BadRequest("Некорректный ID пользователя");
        }
        const user = await UserModel.findById(userId).select(
            "firstName lastName totalStars isBlocked contestBadges goldenAvatarUntil socialLink"
        );
        if (!user || user.isBlocked) {
            throw ApiError.BadRequest("Пользователь не найден");
        }
        const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || "Пользователь";
        return {
            id: user._id.toString(),
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            displayName,
            totalStars: user.totalStars || 0,
            contestBadges: user.contestBadges || [],
            goldenAvatarUntil: user.goldenAvatarUntil || null,
            socialLink: user.socialLink || "",
        };
    }

    async googleAuth(credential) {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw ApiError.BadRequest("Недействительный Google токен");
        }
        const { sub: googleId, email, given_name: firstName, family_name: lastName } = payload;

        let user = await UserModel.findOne({ $or: [{ googleId }, { email }] });

        if (!user) {
            const userRole = await RoleModel.findOne({ roleName: "USER" });
            user = await UserModel.create({
                email,
                googleId,
                firstName: firstName || "",
                lastName: lastName || "",
                isActivated: true,
                roles: [userRole.roleName],
            });
        } else if (!user.googleId) {
            user.googleId = googleId;
            if (!user.firstName && firstName) user.firstName = firstName;
            if (!user.lastName && lastName) user.lastName = lastName;
            await user.save();
        }

        if (user.isBlocked) {
            throw ApiError.BlockedUser();
        }

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({ ...userDto });
        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return { ...tokens, user: userDto };
    }


}

module.exports = new UserService();