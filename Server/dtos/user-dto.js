module.exports = class UserDto{
    email;
    id;
    firstName;
    lastName;
    isActivated;
    isBlocked;
    roles;
    favorites;
    projects;
    totalStars;
    contestBadges;
    goldenAvatarUntil;
    emailContestAnnouncements;
    emailFollowingAuthorPosts;
    socialLink;

    constructor(model){
        this.email = model.email;
        this.id = model._id;
        this.firstName = model.firstName;
        this.lastName = model.lastName;
        this.isActivated = model.isActivated;
        this.isBlocked = model.isBlocked;
        this.roles = model.roles;
        this.favorites = model.favorites;
        this.projects = model.projects;
        this.totalStars = model.totalStars;
        this.contestBadges = model.contestBadges || [];
        this.goldenAvatarUntil = model.goldenAvatarUntil || null;
        this.emailContestAnnouncements = model.emailContestAnnouncements !== false;
        this.emailFollowingAuthorPosts = model.emailFollowingAuthorPosts !== false;
        this.socialLink = model.socialLink || "";
    }
}