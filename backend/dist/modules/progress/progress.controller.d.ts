import { ProgressService } from './progress.service';
export declare class ProgressController {
    private progressService;
    constructor(progressService: ProgressService);
    complete(req: any, kpId: string): Promise<import("../../entities/student-progress.entity").StudentProgress>;
    getMyProgress(req: any): Promise<import("../../entities/student-progress.entity").StudentProgress[]>;
    getMyStats(req: any): Promise<{
        groups: {};
        categories: {};
        totalKPs: number;
        totalCompleted: number;
        overallPercent: number;
        recentKPs: never[];
        isParent: boolean;
    } | {
        groups: Record<string, Record<string, {
            total: number;
            completed: number;
            percent: number;
        }>>;
        categories: Record<string, {
            total: number;
            completed: number;
            percent: number;
        }>;
        totalKPs: number;
        totalCompleted: number;
        overallPercent: number;
        recentKPs: {
            id: number;
            title: string;
            completedAt: Date;
        }[];
        isParent?: undefined;
    }>;
    getUserStats(req: any, userId: string): Promise<{
        groups: {};
        categories: {};
        totalKPs: number;
        totalCompleted: number;
        overallPercent: number;
        recentKPs: never[];
        isParent: boolean;
    } | {
        groups: Record<string, Record<string, {
            total: number;
            completed: number;
            percent: number;
        }>>;
        categories: Record<string, {
            total: number;
            completed: number;
            percent: number;
        }>;
        totalKPs: number;
        totalCompleted: number;
        overallPercent: number;
        recentKPs: {
            id: number;
            title: string;
            completedAt: Date;
        }[];
        isParent?: undefined;
    }>;
}
