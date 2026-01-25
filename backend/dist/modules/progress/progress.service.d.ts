import { Repository } from 'typeorm';
import { StudentProgress } from '../../entities/student-progress.entity';
import { KnowledgePoint } from '../../entities/knowledge-point.entity';
export declare class ProgressService {
    private progressRepository;
    private kpRepository;
    constructor(progressRepository: Repository<StudentProgress>, kpRepository: Repository<KnowledgePoint>);
    markAsCompleted(userId: number, kpId: number): Promise<StudentProgress>;
    getProgress(userId: number): Promise<StudentProgress[]>;
    getProgressStats(userId: number): Promise<{
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
    }>;
}
