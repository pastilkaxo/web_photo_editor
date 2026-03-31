const projectService = require('../service/project-service');

class ProjectController {
        async create(req, res, next) {
        try {
             const { name, json, visibility, previewImage, category, savedFromEditor } = req.body;
            const project = await projectService.createProject(req.user.id, name, json, visibility, previewImage, category, !!savedFromEditor);
            return res.json(project);
        } catch (e) {
            next(e);
        }
    }

    async getAll(req, res, next) {
        try {
            const projects = await projectService.getUserProjects(req.user.id);
            return res.json(projects);
        } catch (e) {
            next(e);
        }
    }

    async getOne(req, res, next) {
        try {
            const { id } = req.params;
            const projectData = await projectService.getProjectContent(id, req.user.id);
            return res.json(projectData);
        } catch (e) {
            next(e);
        }
    }
    
    async update(req, res, next) {
        try {
             const { id } = req.params;
             const { json, visibility, previewImage, name, category, savedFromEditor } = req.body;
             const project = await projectService.updateProject(id, req.user.id, json, visibility, previewImage, name, category, !!savedFromEditor);
             return res.json(project);
        } catch (e) {
            next(e);
        }
    }

    async updateMeta(req, res, next) {
        try {
            const { id } = req.params;
            const project = await projectService.updateProjectMeta(id, req.user.id, req.body);
            return res.json(project);
        } catch (e) {
            next(e);
        }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const result = await projectService.deleteProject(id, req.user.id);
            return res.json(result);
        } catch (e) {
            next(e);
        } 
    }
    
    async getAllPublicProjects(req, res, next) {
        try {
            const projects = await projectService.getAllPublicProjects(req.query || {});
            return res.json(projects);
        } catch (e) {
            next(e);
        }
    }

    async rateProject(req, res, next) {
        try {
            const { projectId } = req.params;
            const { stars } = req.body;
            await projectService.rateProject(projectId, req.user.id, stars, req);
            return res.json({ message: "Рейтинг обновлен" });
        } catch (e) {
            next(e);
        }
    }

    async toggleFavorite(req, res, next) {
        try {
            const { projectId } = req.params;
            const favorites = await projectService.toggleFavorite(projectId, req.user.id);
            return res.json(favorites);
        }
        catch (e) {
            next(e);
        }
    }
    
    async addComment(req, res, next) {
        try {
            const { projectId } = req.params;
            const { text } = req.body;
            const comment = await projectService.addComment(projectId, req.user.id, text);
            return res.json(comment);
        } catch (e) {
            next(e);
        }
    }

    async getComments(req, res, next) { 
        try {
            const { projectId } = req.params;
            const comments = await projectService.getProjectComments(projectId);
            return res.json(comments);
        }
        catch (e) {
            next(e);
        }
    }

    async deleteMyComment(req, res, next) { 
        try {
            const { commentId } = req.params;
            const result = await projectService.deleteMyComment(commentId, req.user.id);
            return res.json(result);
        } catch (e) {
            next(e);
        }
    }

    async updateMyComments(req, res, next) { 
        try {
            const { commentId } = req.params;
            const { text } = req.body;
            const updatedComment = await projectService.updateMyComments(commentId, req.user.id, text);
            return res.json(updatedComment);
        } catch (e) {
            next(e);
        }
    }

    // admin only

    async deleteAnyComment(req, res, next) {
        try {
            const { commentId } = req.params;
            const result = await projectService.deleteAnyComment(commentId);
            return res.json(result);
        } catch (e) {
            next(e);
        }
    }

    async getAllProjects(req, res, next) {
        try {
            const projects = await projectService.getAllProjects();
            return res.json(projects);
        } catch (e) {
            next(e);
        }
    }

    async deleteAnyProject(req, res, next) {
        try {
            const { id } = req.params;
            const result = await projectService.deleteAnyProject(id);
            return res.json(result);
        } catch (e) {
            next(e);
        }
    }


}

module.exports = new ProjectController();