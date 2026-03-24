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
    }
}