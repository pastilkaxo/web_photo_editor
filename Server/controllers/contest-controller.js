const contestService = require("../service/contest-service");

class ContestController {
  async state(req, res, next) {
    try {
      const state = await contestService.getState();
      return res.json(state);
    } catch (e) {
      next(e);
    }
  }

  async submit(req, res, next) {
    try {
      const { projectId } = req.body;
      const result = await contestService.submitProject(projectId, req.user.id);
      return res.json(result);
    } catch (e) {
      next(e);
    }
  }

  async withdraw(req, res, next) {
    try {
      const { projectId } = req.body;
      const result = await contestService.withdrawProject(projectId, req.user.id);
      return res.json(result);
    } catch (e) {
      next(e);
    }
  }

  async report(req, res, next) {
    try {
      const { projectId } = req.params;
      const { reason } = req.body;
      const result = await contestService.reportProject(
        projectId,
        req.user.id,
        reason
      );
      return res.json(result);
    } catch (e) {
      next(e);
    }
  }

  async hallOfFame(req, res, next) {
    try {
      const data = await contestService.getHallOfFame();
      return res.json(data);
    } catch (e) {
      next(e);
    }
  }

  async spotlight(req, res, next) {
    try {
      const data = await contestService.getSpotlight();
      return res.json(data);
    } catch (e) {
      next(e);
    }
  }

  async entries(req, res, next) {
    try {
      const { weekId } = req.query;
      const items = await contestService.listEntries(weekId || null);
      return res.json(items);
    } catch (e) {
      next(e);
    }
  }

  async follow(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await contestService.toggleFollow(req.user.id, userId);
      return res.json(result);
    } catch (e) {
      next(e);
    }
  }

  async followStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const following = await contestService.isFollowing(
        req.user.id,
        userId
      );
      return res.json({ following });
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new ContestController();
