import { IContestBadge } from "./IUser";

export interface IPublicUserProfile {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    totalStars: number;
    contestBadges?: IContestBadge[];
    goldenAvatarUntil?: string | null;
    socialLink?: string;
}
