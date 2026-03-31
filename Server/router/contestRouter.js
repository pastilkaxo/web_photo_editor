const Router = require("express");
const authMiddleware = require("../middlewares/auth-middleware");
const contestController = require("../controllers/contest-controller");

const router = new Router();

router.get("/state", contestController.state);
router.get("/spotlight", contestController.spotlight);
router.get("/hall-of-fame", contestController.hallOfFame);
router.get("/entries", contestController.entries);

router.post("/submit", authMiddleware, contestController.submit);
router.post("/withdraw", authMiddleware, contestController.withdraw);
router.post("/report/:projectId", authMiddleware, contestController.report);
router.post("/follow/:userId", authMiddleware, contestController.follow);
router.get("/follow/:userId", authMiddleware, contestController.followStatus);

module.exports = router;
