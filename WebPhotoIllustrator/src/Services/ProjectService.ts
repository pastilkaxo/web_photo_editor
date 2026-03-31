
import { AxiosResponse } from "axios";

import $api from "../http";
import { IProject } from "../models/IProject";
import { IProjectData } from "../models/IProjectData";
import { ProjectCategory } from "../constants/projectCategories";

export interface IPublicProjectsQuery {
    page?: number;
    limit?: number;
    search?: string;
    category?: "ALL" | ProjectCategory;
    owner?: string;
    sortBy?: "createdAt" | "updatedAt" | "stars" | "name";
    sortOrder?: "asc" | "desc";
    contestWeekId?: string;
    prioritizeContest?: boolean | string;
}

export interface IPublicProjectsResponse {
    items: IProject[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default class ProjectService {
    static async createProject(
        name: string,
        json: object,
        visibility = "PRIVATE",
        previewImage?: string,
        category: ProjectCategory = "OTHER"
    ): Promise<AxiosResponse<IProject>> {
        return $api.post<IProject>("/projects", {
            name,
            json,
            visibility,
            previewImage,
            category,
            savedFromEditor: false,
        });
    }

    static async createProjectFromEditor(
        name: string,
        json: object,
        visibility = "PRIVATE",
        previewImage?: string,
        category: ProjectCategory = "OTHER"
    ): Promise<AxiosResponse<IProject>> {
        return $api.post<IProject>("/projects", {
            name,
            json,
            visibility,
            previewImage,
            category,
            savedFromEditor: true,
        });
    }

    static async fetchMyProjects(): Promise<AxiosResponse<IProject[]>> {
        return $api.get<IProject[]>("/projects");
    }

    static async getPublicProjects(params: IPublicProjectsQuery = {}): Promise<AxiosResponse<IPublicProjectsResponse>> {
        return $api.get<IPublicProjectsResponse>('/projects/public', { params });
    }

    static async rateProject(projectId: string, stars: number): Promise<AxiosResponse<IProject>> {
        return $api.post<IProject>(`/projects/${projectId}/rate`, { stars });
    }

    static async getProjectById(id: string): Promise<AxiosResponse<IProjectData>> {
        return $api.get<IProjectData>(`/projects/${id}`);
    }
    
    static async updateProject(
        id: string,
        json: object,
        visibility?: string,
        previewImage?: string,
        name?: string,
        category?: ProjectCategory,
        savedFromEditor?: boolean
    ): Promise<AxiosResponse<IProject>> {
        return $api.put<IProject>(`/projects/${id}`, {
            json,
            visibility,
            previewImage,
            name,
            category,
            savedFromEditor: !!savedFromEditor,
        });
    }

    static async updateProjectMeta(
        id: string,
        payload: { name?: string; visibility?: "PRIVATE" | "PUBLIC"; category?: ProjectCategory }
    ): Promise<AxiosResponse<IProject>> {
        return $api.patch<IProject>(`/projects/${id}/meta`, payload);
    }

    static async deleteProject(id: string): Promise<any> {
        return $api.delete(`/projects/${id}`);
    }

    static async toggleFavorite(projectId: string): Promise<AxiosResponse<string[]>> {
        return $api.post<string[]>(`/projects/${projectId}/favorite`);
    }

    static async addComment(projectId: string, text: string): Promise<AxiosResponse<any>> {
        return $api.post(`/projects/${projectId}/comment`, { text });
    }

    static async getComments(projectId: string): Promise<AxiosResponse<any[]>> {
        return $api.get<any[]>(`/projects/${projectId}/comments`);
    }

    static async deleteMyComment(commentId: string): Promise<any> {
        return $api.delete(`/projects/comments/${commentId}`);
    }

    static async updateMyComments(commentId: string, text: string): Promise<any> {
        return $api.put(`/projects/comments/${commentId}`, { text });
    }

    // Admin functions

    static async deleteAnyComment(commentId: string): Promise<any> {
        return $api.delete(`/projects/comments/${commentId}/admin`);
    }

    static async fetchAllProjects(): Promise<AxiosResponse<IProject[]>> {
        return $api.get<IProject[]>("/projects/admin/projects");
    }
    static async deleteAnyProject(id: string): Promise<any> {
        return $api.delete(`/projects/admin/projects/${id}`);
    }
}