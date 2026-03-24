const ProjectModel = require("../models/project-model");
const UserModel = require("../models/user-model");
const ApiError = require("../Exceptions/api-error");
const S3Service = require("../utils/s3.service");
const CommentModel = require("../models/comment-model");
const mongoose = require("mongoose");

class ProjectService {

    async createProject(userId, projectName, projectData, visibility = 'PRIVATE', previewImage, category = 'OTHER') {
        const fileName = `${projectName}_${Date.now()}.json`;
        const s3Key = await S3Service.uploadJson(userId, projectData, fileName);
        const user = await UserModel.findById(userId);
        const project = await ProjectModel.create({
            name: projectName,
            s3Key,
            owner: userId,
            ownerName: user.firstName + " " + user.lastName,
            visibility,
            previewImage,
            category
        });
        if (user) {
            user.projects.push(project._id);
            await user.save();
        }

        return project;
    }

    async getProjectContent(projectId, userId) {
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            throw ApiError.BadRequest("Некорректный ID проекта");
        }
        const project = await ProjectModel.findById(projectId);
        if (!project) {
            throw ApiError.BadRequest("Проект не найден");
        }

        const isOwner = project.owner.toString() === userId;
        const isPublic = project.visibility === 'PUBLIC';
        
        if (!isOwner && !isPublic) {
             throw ApiError.Forbidden("Это приватный проект. У вас нет доступа.");
        }

        const content = await S3Service.getJson(project.s3Key);
        return {
            info: project,
            content: content,
            isOwner: isOwner
        };
    }

    async getUserProjects(userId) {
        const projects = await ProjectModel.find({ owner: userId }).sort({ updatedAt: -1 });
        return projects;
    }

    async deleteProject(projectId, userId) {
        const project = await ProjectModel.findById(projectId);
        const user = await UserModel.findById(userId);
        if (!user) throw ApiError.BadRequest("Пользователь не найден");
        if (!project) throw ApiError.BadRequest("Проект не найден");

        if (project.owner.toString() !== userId) {
            throw ApiError.Forbidden("Нет прав на удаление");
        }

        await S3Service.deleteFile(project.s3Key);

        await UserModel.updateOne({ _id: userId }, { $pull: { projects: projectId }, $inc: { totalStars: -project.stars } });
        await UserModel.updateMany({favorites: projectId}, {$pull: {favorites: projectId}});

        await ProjectModel.deleteOne({ _id: projectId });


        return { message: "Проект удален" };
    }

    async updateProject(projectId, userId, projectJson, visibility, previewImage, name, category) {
        const project = await ProjectModel.findById(projectId);
        if (!project) throw ApiError.BadRequest("Проект не найден");
        
        if (project.owner.toString() !== userId) {
             throw ApiError.Forbidden("Вы не являетесь владельцем этого проекта");
        }
        await S3Service.uploadJson(userId, projectJson, project.s3Key);
            
        if (visibility) {
            project.visibility = visibility;
            if (visibility === 'PRIVATE') {
                const previousStars = project.stars;
                project.stars = 0;
                project.ratedBy = [];
                await UserModel.updateOne({ _id: userId }, { $inc: { totalStars: -previousStars } });
                await UserModel.updateMany({favorites: projectId}, {$pull: {favorites: projectId}});
            }
        }
        if (name) project.name = name;
        if (category) project.category = category;
        if (previewImage) project.previewImage = previewImage;
        project.updatedAt = new Date();
        await project.save();
        return project;
    }

    async updateProjectMeta(projectId, userId, payload) {
        const project = await ProjectModel.findById(projectId);
        if (!project) throw ApiError.BadRequest("Проект не найден");
        if (project.owner.toString() !== userId) {
            throw ApiError.Forbidden("Вы не являетесь владельцем этого проекта");
        }

        const { name, visibility, category } = payload || {};

        if (typeof name === "string" && name.trim()) {
            project.name = name.trim();
        }
        if (visibility) {
            project.visibility = visibility;
            if (visibility === 'PRIVATE') {
                const previousStars = project.stars;
                project.stars = 0;
                project.ratedBy = [];
                await UserModel.updateOne({ _id: userId }, { $inc: { totalStars: -previousStars } });
                await UserModel.updateMany({favorites: projectId}, {$pull: {favorites: projectId}});
            }
        }
        if (category) {
            project.category = category;
        }

        project.updatedAt = new Date();
        await project.save();
        return project;
    }

    async getAllPublicProjects(filters = {}) {
        const {
            page = 1,
            limit = 12,
            search = "",
            category,
            sortBy = "createdAt",
            sortOrder = "desc"
        } = filters;

        const normalizedPage = Math.max(parseInt(page, 10) || 1, 1);
        const normalizedLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 60);
        const skip = (normalizedPage - 1) * normalizedLimit;

        const query = { visibility: 'PUBLIC' };
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }
        if (category && category !== "ALL") {
            query.category = category;
        }

        const allowedSortFields = ["createdAt", "updatedAt", "stars", "name"];
        const normalizedSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
        const normalizedSortOrder = sortOrder === "asc" ? 1 : -1;
        const sort = { [normalizedSortBy]: normalizedSortOrder };

        const [projects, total] = await Promise.all([
            ProjectModel.find(query).sort(sort).skip(skip).limit(normalizedLimit),
            ProjectModel.countDocuments(query)
        ]);

        return {
            items: projects,
            page: normalizedPage,
            limit: normalizedLimit,
            total,
            totalPages: Math.max(Math.ceil(total / normalizedLimit), 1)
        };
    }

    async rateProject(projectId, userId, stars) {
        const project = await ProjectModel.findById(projectId);
        if (!project) throw ApiError.BadRequest("Проект не найден");
        if (project.owner.toString() === userId) {
            throw ApiError.BadRequest("Нельзя оценивать свои работы");
        }
        if(project.ratedBy.includes(userId)) {
            throw ApiError.BadRequest("Вы уже оценили этот проект");
        }
        project.stars += stars;
        project.ratedBy.push(userId);
        await project.save();
        const owner = await UserModel.findById(project.owner);
        if (owner) {
            owner.totalStars += stars;
            await owner.save();
        }
    }

    async toggleFavorite(projectId, userId) {
        const user = await UserModel.findById(userId);
        if (!user) throw ApiError.BadRequest("Пользователь не найден");
        const index = user.favorites.indexOf(projectId);
        if (index === -1) {
            user.favorites.push(projectId);
        } else {
            user.favorites.splice(index, 1);
        }
        await user.save();
        return user.favorites;
    }
    
    async addComment(projectId, userId, text) {
        const comment = await CommentModel.create({ text, author: userId, project: projectId });
        const project = await ProjectModel.findById(projectId);
        if (!project) throw ApiError.BadRequest("Проект не найден");
        project.comments.push(comment._id);
        await project.save();
        return await comment.populate('author', 'email');
    }

    async deleteMyComment(commentId, userId) { 
        const comment = await CommentModel.findById(commentId);
        if (!comment) throw ApiError.BadRequest("Комментарий не найден");
        if (comment.author.toString() !== userId) {
            throw ApiError.Forbidden("Нет прав на удаление этого комментария");
        }
        await CommentModel.deleteOne({ _id: commentId });
        await ProjectModel.updateOne({ _id: comment.project }, { $pull: { comments: commentId } });
        return { message: "Комментарий удален" };
    }

    async updateMyComments(commentId, userId, text) {
        const comment = await CommentModel.findById(commentId);
        if (!comment) throw ApiError.BadRequest("Комментарий не найден");
        if (comment.author.toString() !== userId) {
            throw ApiError.Forbidden("Нет прав на изменение этого комментария");
        }
        comment.text = text;
        await comment.save();
        return await comment.populate('author', 'email');
    }
    
    async getProjectComments(projectId) { 
        return await CommentModel.find({ project: projectId }).populate('author', 'email').sort({ createdAt: -1 });
    }


    // admin functions

    async deleteAnyComment(commentId) {
        const comment = await CommentModel.findById(commentId);
        if (!comment) throw ApiError.BadRequest("Комментарий не найден");
        await CommentModel.deleteOne({ _id: commentId });
        await ProjectModel.updateOne({ _id: comment.project }, { $pull: { comments: commentId } });
        return { message: "Комментарий удален администратором" };
    }

    async getAllProjects() {
        const projects = await ProjectModel.find().sort({ createdAt: -1 });
        return projects;
    }

    async deleteAnyProject(projectId) {
        const project = await ProjectModel.findById(projectId);
        if (!project) throw ApiError.BadRequest("Проект не найден");
        await S3Service.deleteFile(project.s3Key);
        await UserModel.updateOne({ _id: project.owner }, { $pull: { projects: projectId }, $inc: { totalStars: -project.stars } });
        await UserModel.updateMany({favorites: projectId}, {$pull: {favorites: projectId}});
        await ProjectModel.deleteOne({ _id: projectId });
        return { message: "Проект удален администратором" };
    }


}


module.exports = new ProjectService();