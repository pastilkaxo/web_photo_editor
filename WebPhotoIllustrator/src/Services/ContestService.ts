import { AxiosResponse } from "axios";

import $api from "../http";

export interface IContestState {
    weekId: string;
    weekIndex: number;
    theme: string;
    startsAt: string;
    submissionEndsAt: string;
    votingEndsAt: string;
    phase: "SUBMISSION" | "VOTING" | "CLOSED";
    status: string;
}

export interface IContestSpotlight {
    weekIndex: number;
    theme: string;
    projectId: string;
    previewImage: string;
    projectName: string;
    ownerId: string;
    ownerDisplayName: string;
    socialLink: string;
}

export interface IHallWeek {
    weekIndex: number;
    theme: string;
    closedAt: string | null;
    community: Array<{
        _id: string;
        previewImage?: string;
        name?: string;
        ownerName?: string;
        owner?: string;
    }>;
    mostDiscussed: {
        _id: string;
        previewImage?: string;
        name?: string;
        ownerName?: string;
    } | null;
}

export default class ContestService {
    static async getState(): Promise<AxiosResponse<IContestState | null>> {
        return $api.get<IContestState | null>("/contests/state");
    }

    static async getSpotlight(): Promise<AxiosResponse<IContestSpotlight | null>> {
        return $api.get<IContestSpotlight | null>("/contests/spotlight");
    }

    static async getHallOfFame(): Promise<AxiosResponse<IHallWeek[]>> {
        return $api.get<IHallWeek[]>("/contests/hall-of-fame");
    }

    static async submitToContest(projectId: string): Promise<AxiosResponse<{ message: string }>> {
        return $api.post("/contests/submit", { projectId });
    }

    static async withdrawFromContest(projectId: string): Promise<AxiosResponse<{ message: string }>> {
        return $api.post("/contests/withdraw", { projectId });
    }

    static async reportProject(projectId: string, reason?: string): Promise<AxiosResponse<{ message: string }>> {
        return $api.post(`/contests/report/${projectId}`, { reason: reason || "" });
    }

    static async toggleFollow(userId: string): Promise<AxiosResponse<{ following: boolean }>> {
        return $api.post(`/contests/follow/${userId}`);
    }

    static async followStatus(userId: string): Promise<AxiosResponse<{ following: boolean }>> {
        return $api.get(`/contests/follow/${userId}`);
    }
}
