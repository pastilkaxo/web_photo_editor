export interface IContestBadge {
    kind: string;
    weekIndex: number;
    theme?: string;
    awardedAt?: string;
}

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
    contestBadges?: IContestBadge[];
    goldenAvatarUntil?: string | null;
    socialLink?: string;
    emailContestAnnouncements?: boolean;
    /** Письма о новых публичных работах подписанных авторов */
    emailFollowingAuthorPosts?: boolean;
}