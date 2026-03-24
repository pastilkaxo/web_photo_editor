import { IUser } from "./IUser";

export interface IComment {
    _id: string;
    project: string;
    author: IUser;
    text: string;
    createdAt: string;
}
    