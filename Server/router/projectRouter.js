const Router = require('express');
const projectController = require('../controllers/project-controller');
const authMiddleware = require("../middlewares/auth-middleware");
const roleMiddleware = require("../middlewares/role-middleware");
const router = new Router();

router.get('/public', projectController.getAllPublicProjects);
router.get('/admin/projects', authMiddleware,roleMiddleware(["ADMIN"]), projectController.getAllProjects); 
router.post('/', authMiddleware, projectController.create);
router.get('/', authMiddleware, projectController.getAll);
router.get('/:id', authMiddleware, projectController.getOne);
router.put('/:id', authMiddleware, projectController.update);
router.patch('/:id/meta', authMiddleware, projectController.updateMeta);
router.delete('/:id', authMiddleware, projectController.delete);
router.put('/comments/:commentId', authMiddleware, projectController.updateMyComments);
router.post('/:projectId/favorite', authMiddleware, projectController.toggleFavorite);
router.post('/:projectId/comment', authMiddleware, projectController.addComment);
router.get('/:projectId/comments', authMiddleware, projectController.getComments);
router.post('/:projectId/rate', authMiddleware, projectController.rateProject);
router.delete('/admin/projects/:id', authMiddleware,roleMiddleware(["ADMIN"]), projectController.deleteAnyProject); 
router.delete('/comments/:commentId/admin', authMiddleware,roleMiddleware(["ADMIN"]), projectController.deleteAnyComment);
router.delete('/comments/:commentId', authMiddleware, projectController.deleteMyComment);


module.exports = router;