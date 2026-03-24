import { IComment } from "./IComment";

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
    comments: IComment[]; 
    stars: number;
}
    