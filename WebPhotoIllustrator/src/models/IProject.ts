import { IComment } from "./IComment";

export interface IStarVote {
    user: string;
    stars: number;
    at?: string;
}

export interface IContestSubmission {
    weekId?: string | null | undefined;
    submittedAt?: string | null | undefined;
}

export interface IProject {
    _id: string;
    name: string;
    s3Key: string;
    createdAt: string;
    updatedAt: string;
    visibility: 'PRIVATE' | 'PUBLIC';
    owner: string;
    ownerName: string;
    previewImage: string;
    category: 'NATURE' | 'ANIMALS' | 'PEOPLE' | 'CITY' | 'TECHNOLOGY' | 'ABSTRACT' | 'FOOD' | 'TRAVEL' | 'OTHER';
    ratedBy: string[];
    starVotes?: IStarVote[];
    comments: IComment[]; 
    stars: number;
    lastSavedFromEditorAt?: string | null;
    contestSubmission?: IContestSubmission | null;
    contestReportsCount?: number;
}
    