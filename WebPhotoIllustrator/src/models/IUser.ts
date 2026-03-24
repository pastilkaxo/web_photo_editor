export interface IUser {
     _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isActivated: boolean;
    isBlocked: boolean;
    roles: string[];
    projects: string[];
    favorites: string[];
    id: string;
    totalStars: number;
}