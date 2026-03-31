const mongoose = require("mongoose");
const ContestWeekModel = require("../models/contest-week-model");
const ProjectModel = require("../models/project-model");
const UserModel = require("../models/user-model");
const CommentModel = require("../models/comment-model");
const ContestReportModel = require("../models/contest-report-model");
const ApiError = require("../Exceptions/api-error");
const mailService = require("./mail-service");
const { assertContestParticipant } = require("./contest-eligibility");

const MIN_RATINGS_FOR_TOP = 15;
const THEMES = [
  "Неоновый город",
  "Чёрно-белая меланхолия",
  "Макромир",
  "Только красный цвет",
  "Золотой час",
  "Минимализм",
  "Ретрофутуризм",
  "Подводный мир",
];

function mondayStartUTC(date = new Date()) {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const dow = d.getUTCDay();
  const toMonday = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + toMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function fridayEndUTC(fromMonday) {
  const d = new Date(fromMonday);
  d.setUTCDate(d.getUTCDate() + 4);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function sundayEndUTC(fromMonday) {
  const d = new Date(fromMonday);
  d.setUTCDate(d.getUTCDate() + 6);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function nextMonday(fromMonday) {
  const d = new Date(fromMonday);
  d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

async function nextWeekIndex() {
  const last = await ContestWeekModel.findOne()
    .sort({ weekIndex: -1 })
    .select("weekIndex")
    .lean();
  return (last?.weekIndex || 0) + 1;
}

async function createWeekFromMonday(startsAt) {
  const weekIndex = await nextWeekIndex();
  const theme = THEMES[(weekIndex - 1) % THEMES.length];
  const submissionEndsAt = fridayEndUTC(startsAt);
  const votingEndsAt = sundayEndUTC(startsAt);
  return ContestWeekModel.create({
    weekIndex,
    theme,
    startsAt,
    submissionEndsAt,
    votingEndsAt,
    status: "ACTIVE",
  });
}

async function computeWinners(week) {
  const weekId = week._id;
  const entries = await ProjectModel.find({
    "contestSubmission.weekId": weekId,
    visibility: "PUBLIC",
  })
    .populate("owner", "firstName lastName")
    .lean();

  if (entries.length === 0) {
    week.winners = { communityPlaces: [], mostDiscussedProject: null, recognitionByProject: {} };
    return week.save();
  }

  const metrics = [];
  for (const p of entries) {
    const votes = p.starVotes || [];
    const sumStars = votes.reduce((a, v) => a + (v.stars || 0), 0);
    const nVotes = votes.length;
    const avgStars = nVotes ? sumStars / nVotes : 0;
    const normAvg = nVotes >= MIN_RATINGS_FOR_TOP ? (avgStars - 1) / 4 : 0;

    const commentIds = p.comments || [];
    const comments = await CommentModel.find({ _id: { $in: commentIds } })
      .select("author")
      .lean();
    const uniqueCommenters = new Set(
      comments.map((c) => String(c.author)).filter(Boolean)
    ).size;
    const commentCount = commentIds.length;

    const favCount = await UserModel.countDocuments({ favorites: p._id });

    const ownerId = p.owner?._id || p.owner;
    const rangeStart = week.startsAt;
    const rangeEnd = week.votingEndsAt;

    const commentsOnOthers = await CommentModel.countDocuments({
      author: ownerId,
      project: { $ne: p._id },
      createdAt: { $gte: rangeStart, $lte: rangeEnd },
    });

    const ratingsOnOthers = await ProjectModel.countDocuments({
      _id: { $ne: p._id },
      starVotes: {
        $elemMatch: {
          user: ownerId,
          at: { $gte: rangeStart, $lte: rangeEnd },
        },
      },
    });

    const authorActivity = commentsOnOthers + ratingsOnOthers;

    metrics.push({
      project: p,
      normAvg,
      uniqueCommenters,
      favCount,
      commentCount,
      authorActivity,
      avgStars,
      nVotes,
    });
  }

  let maxEng = 0;
  let maxAuth = 0;
  for (const m of metrics) {
    const eng = m.uniqueCommenters + m.favCount;
    if (eng > maxEng) maxEng = eng;
    if (m.authorActivity > maxAuth) maxAuth = m.authorActivity;
  }
  if (maxEng === 0) maxEng = 1;
  if (maxAuth === 0) maxAuth = 1;

  const scored = metrics.map((m) => {
    const engNorm = (m.uniqueCommenters + m.favCount) / maxEng;
    const authNorm = m.authorActivity / maxAuth;
    const recognition =
      100 * (0.6 * m.normAvg + 0.3 * engNorm + 0.1 * authNorm);
    return { ...m, recognition, engNorm, authNorm };
  });

  const eligibleForCommunity = scored.filter((s) => s.nVotes >= MIN_RATINGS_FOR_TOP);
  const pool = eligibleForCommunity.length ? eligibleForCommunity : scored;
  pool.sort((a, b) => b.recognition - a.recognition);
  const communityPlaces = pool.slice(0, 3).map((s) => s.project._id);

  scored.sort((a, b) => b.commentCount - a.commentCount);
  const mostDiscussedProject = scored[0]?.project._id || null;

  const recognitionByProject = {};
  for (const s of scored) {
    recognitionByProject[s.project._id.toString()] = {
      recognition: Math.round(s.recognition * 100) / 100,
      avgStars: Math.round(s.avgStars * 100) / 100,
      ratingsCount: s.nVotes,
      uniqueCommenters: s.uniqueCommenters,
      favorites: s.favCount,
      commentsTotal: s.commentCount,
    };
  }

  week.winners = {
    communityPlaces,
    mostDiscussedProject,
    recognitionByProject,
  };

  const goldenUntil = new Date();
  goldenUntil.setUTCDate(goldenUntil.getUTCDate() + 7);

  const badgeTheme = week.theme;
  const wIdx = week.weekIndex;

  const award = async (projectId, kind) => {
    if (!projectId) return;
    const proj = await ProjectModel.findById(projectId).select("owner");
    if (!proj) return;
    const owner = await UserModel.findById(proj.owner);
    if (!owner) return;
    owner.contestBadges = owner.contestBadges || [];
    owner.contestBadges.push({
      kind,
      weekIndex: wIdx,
      theme: badgeTheme,
      awardedAt: new Date(),
    });
    owner.goldenAvatarUntil = goldenUntil;
    await owner.save();
  };

  if (communityPlaces[0]) await award(communityPlaces[0], "COMMUNITY_GOLD");
  if (communityPlaces[1]) await award(communityPlaces[1], "COMMUNITY_SILVER");
  if (communityPlaces[2]) await award(communityPlaces[2], "COMMUNITY_BRONZE");
  if (mostDiscussedProject) await award(mostDiscussedProject, "MOST_DISCUSSED");

  return week.save();
}

async function rolloverIfNeeded() {
  let active = await ContestWeekModel.findOne({ status: "ACTIVE" }).sort({
    startsAt: -1,
  });
  const now = new Date();
  while (active && now > active.votingEndsAt) {
    await computeWinners(active);
    active.status = "CLOSED";
    active.closedAt = new Date();
    await active.save();
    const nextStart = nextMonday(active.startsAt);
    active = await createWeekFromMonday(nextStart);
    try {
      await mailService.sendContestWeekStartedBulk(active.theme);
    } catch (e) {
      console.error("Contest announcement mail error", e.message);
    }
  }

  if (!active) {
    let mon = mondayStartUTC(now);
    const endVoting = sundayEndUTC(mon);
    if (now > endVoting) {
      mon = nextMonday(mon);
    }
    active = await createWeekFromMonday(mon);
  }
  return active || null;
}

class ContestService {
  async ensureWeek() {
    return rolloverIfNeeded();
  }

  async getState() {
    const week = await ContestWeekModel.findOne({ status: "ACTIVE" }).sort({
      startsAt: -1,
    });
    if (!week) {
      const w = await this.ensureWeek();
      return this.formatState(w);
    }
    const now = new Date();
    if (now > week.votingEndsAt) {
      await rolloverIfNeeded();
      const w2 = await ContestWeekModel.findOne({ status: "ACTIVE" }).sort({
        startsAt: -1,
      });
      return this.formatState(w2);
    }
    return this.formatState(week);
  }

  formatState(week) {
    if (!week) return null;
    const now = new Date();
    let phase = "SUBMISSION";
    if (now > week.submissionEndsAt) phase = "VOTING";
    if (now > week.votingEndsAt) phase = "CLOSED";
    return {
      weekId: week._id,
      weekIndex: week.weekIndex,
      theme: week.theme,
      startsAt: week.startsAt,
      submissionEndsAt: week.submissionEndsAt,
      votingEndsAt: week.votingEndsAt,
      phase,
      status: week.status,
    };
  }

  async submitProject(projectId, userId) {
    const user = await UserModel.findById(userId);
    if (!user) throw ApiError.BadRequest("Пользователь не найден");
    assertContestParticipant(user);

    const weekDoc = await ContestWeekModel.findOne({ status: "ACTIVE" }).sort({
      startsAt: -1,
    });
    if (!weekDoc) throw ApiError.BadRequest("Нет активной недели конкурса");
    const now = new Date();
    if (now > weekDoc.submissionEndsAt) {
      throw ApiError.BadRequest("Приём работ на эту неделю закрыт (до пятницы включительно)");
    }

    const project = await ProjectModel.findById(projectId);
    if (!project) throw ApiError.BadRequest("Проект не найден");
    if (project.owner.toString() !== userId) {
      throw ApiError.Forbidden("Это не ваш проект");
    }
    if (project.visibility !== "PUBLIC") {
      throw ApiError.BadRequest("Сделайте проект публичным, чтобы отправить на конкурс");
    }
    if (!project.lastSavedFromEditorAt) {
      throw ApiError.BadRequest(
        "Сохраните работу из редактора приложения — так мы подтверждаем обработку в редакторе"
      );
    }
    if (project.lastSavedFromEditorAt < weekDoc.startsAt) {
      throw ApiError.BadRequest(
        "Сохраните проект в редакторе ещё раз на этой неделе конкурса"
      );
    }

    const existingWeekId = project.contestSubmission?.weekId;
    if (existingWeekId && existingWeekId.toString() === weekDoc._id.toString()) {
      throw ApiError.BadRequest(
        "Эта работа уже участвует в конкурсе текущей недели. Сначала отзовите заявку."
      );
    }

    project.contestSubmission = {
      weekId: weekDoc._id,
      submittedAt: new Date(),
    };
    await project.save();
    return {
      message: "Работа отправлена на конкурс",
      contest: this.formatState(weekDoc),
    };
  }

  async withdrawProject(projectId, userId) {
    const user = await UserModel.findById(userId);
    if (!user) throw ApiError.BadRequest("Пользователь не найден");
    assertContestParticipant(user);

    const weekDoc = await ContestWeekModel.findOne({ status: "ACTIVE" }).sort({
      startsAt: -1,
    });
    if (!weekDoc) throw ApiError.BadRequest("Нет активной недели конкурса");
    const now = new Date();
    if (now > weekDoc.submissionEndsAt) {
      throw ApiError.BadRequest(
        "Отозвать заявку можно только до окончания приёма работ (до пятницы включительно)"
      );
    }

    const project = await ProjectModel.findById(projectId);
    if (!project) throw ApiError.BadRequest("Проект не найден");
    if (project.owner.toString() !== userId) {
      throw ApiError.Forbidden("Это не ваш проект");
    }
    const wid = project.contestSubmission?.weekId;
    if (!wid || wid.toString() !== weekDoc._id.toString()) {
      throw ApiError.BadRequest("Проект не участвует в конкурсе текущей недели");
    }

    project.contestSubmission = { weekId: null, submittedAt: null };
    await project.save();
    return { message: "Заявка на конкурс отозвана" };
  }

  async listEntries(weekId) {
    const q = weekId
      ? { "contestSubmission.weekId": weekId }
      : {
          "contestSubmission.weekId": {
            $exists: true,
            $ne: null,
          },
        };
    const items = await ProjectModel.find(q)
      .sort({ "contestSubmission.submittedAt": -1 })
      .limit(120)
      .select(
        "name previewImage owner ownerName stars ratedBy starVotes comments contestSubmission category createdAt"
      )
      .lean();
    return items;
  }

  async reportProject(projectId, userId, reason) {
    const reporter = await UserModel.findById(userId);
    if (reporter) assertContestParticipant(reporter);

    const project = await ProjectModel.findById(projectId);
    if (!project) throw ApiError.BadRequest("Проект не найден");
    try {
      await ContestReportModel.create({
        project: projectId,
        reporter: userId,
        reason: (reason || "").slice(0, 2000),
      });
    } catch (e) {
      if (e.code === 11000) {
        throw ApiError.BadRequest("Вы уже отправляли жалобу на эту работу");
      }
      throw e;
    }
    project.contestReportsCount = (project.contestReportsCount || 0) + 1;
    await project.save();
    return { message: "Жалоба принята. Модераторы рассмотрят её." };
  }

  async getHallOfFame(limit = 24) {
    const weeks = await ContestWeekModel.find({ status: "CLOSED" })
      .sort({ weekIndex: -1 })
      .limit(limit)
      .lean();

    const out = [];
    for (const w of weeks) {
      const places = w.winners?.communityPlaces || [];
      const previews = await ProjectModel.find({ _id: { $in: places } })
        .select("previewImage name ownerName owner")
        .lean();
      const byId = Object.fromEntries(
        previews.map((p) => [p._id.toString(), p])
      );
      const md = w.winners?.mostDiscussedProject;
      let mdDoc = null;
      if (md) {
        mdDoc = await ProjectModel.findById(md)
          .select("previewImage name ownerName owner")
          .lean();
      }
      out.push({
        weekIndex: w.weekIndex,
        theme: w.theme,
        closedAt: w.closedAt,
        community: places.map((id) => byId[id.toString()]).filter(Boolean),
        mostDiscussed: mdDoc,
      });
    }
    return out;
  }

  async getSpotlight() {
    const week = await ContestWeekModel.findOne({ status: "CLOSED" })
      .sort({ weekIndex: -1 })
      .lean();
    if (!week?.winners?.communityPlaces?.length) return null;
    const firstId = week.winners.communityPlaces[0];
    const project = await ProjectModel.findById(firstId)
      .populate("owner", "firstName lastName socialLink contestBadges")
      .lean();
    if (!project) return null;
    const owner = project.owner;
    const displayName = owner
      ? [owner.firstName, owner.lastName].filter(Boolean).join(" ").trim() ||
        "Автор"
      : project.ownerName || "Автор";
    return {
      weekIndex: week.weekIndex,
      theme: week.theme,
      projectId: project._id,
      previewImage: project.previewImage,
      projectName: project.name,
      ownerId: owner?._id || project.owner,
      ownerDisplayName: displayName,
      socialLink: owner?.socialLink || "",
    };
  }

  async toggleFollow(viewerId, targetUserId) {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw ApiError.BadRequest("Некорректный пользователь");
    }
    if (viewerId === targetUserId) {
      throw ApiError.BadRequest("Нельзя подписаться на себя");
    }
    const target = await UserModel.findById(targetUserId);
    if (!target || target.isBlocked) {
      throw ApiError.BadRequest("Пользователь не найден");
    }
    const viewer = await UserModel.findById(viewerId);
    if (!viewer) throw ApiError.BadRequest("Пользователь не найден");
    viewer.following = viewer.following || [];
    const idx = viewer.following.findIndex(
      (id) => id.toString() === targetUserId
    );
    if (idx === -1) {
      viewer.following.push(targetUserId);
      await viewer.save();
      return { following: true };
    }
    viewer.following.splice(idx, 1);
    await viewer.save();
    return { following: false };
  }

  async isFollowing(viewerId, targetUserId) {
    const viewer = await UserModel.findById(viewerId).select("following").lean();
    if (!viewer?.following?.length) return false;
    return viewer.following.some((id) => id.toString() === targetUserId);
  }

  async getReportsForAdmin() {
    const reports = await ContestReportModel.find()
      .sort({ createdAt: -1 })
      .limit(500)
      .populate({
        path: "project",
        select: "name owner ownerName previewImage visibility _id",
        populate: {
          path: "owner",
          select: "firstName lastName email _id isBlocked",
        },
      })
      .populate("reporter", "firstName lastName email _id")
      .lean();
    return reports;
  }

  /** Ручной вызов (крон дублирует логику через rolloverIfNeeded) */
  async runMondayJob() {
    return rolloverIfNeeded();
  }
}

module.exports = new ContestService();
