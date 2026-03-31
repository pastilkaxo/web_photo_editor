const ApiError = require("../Exceptions/api-error");

const MS_DAY = 24 * 60 * 60 * 1000;

function accountCreatedAt(user) {
  if (user.createdAt) return user.createdAt;
  try {
    return user._id.getTimestamp();
  } catch {
    return new Date(0);
  }
}

function assertEmailOrGoogle(user) {
  if (user.isActivated || user.googleId) return;
  throw ApiError.BadRequest(
    "Для участия в конкурсе и голосования подтвердите email или войдите через Google"
  );
}

function assertAccountAge24h(user) {
  const created = accountCreatedAt(user);
  if (Date.now() - created.getTime() < MS_DAY) {
    throw ApiError.BadRequest(
      "Голосовать и комментировать можно с аккаунта старше 24 часов с момента регистрации"
    );
  }
}

function assertContestParticipant(user) {
  assertEmailOrGoogle(user);
  assertAccountAge24h(user);
}

function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) {
    return xf.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "";
}

function deviceIdFromReq(req) {
  const fromBody = req.body?.deviceId;
  const fromHeader = req.headers["x-device-id"];
  const id = (fromBody || fromHeader || "").toString().trim();
  return id;
}

module.exports = {
  assertContestParticipant,
  assertEmailOrGoogle,
  accountCreatedAt,
  clientIp,
  deviceIdFromReq,
};
