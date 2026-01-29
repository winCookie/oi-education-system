import { Repository } from 'typeorm';
import { StudentProgress } from '../../entities/student-progress.entity';
import { User } from '../../entities/user.entity';
import { ParentStudentRelation } from '../../entities/parent-student-relation.entity';
import { KnowledgePoint } from '../../entities/knowledge-point.entity';
export declare class ProgressService {
    private progressRepository;
    private kpRepository;
    private userRepository;
    private relationRepository;
    constructor(progressRepository: Repository<StudentProgress>, kpRepository: Repository<KnowledgePoint>, userRepository: Repository<User>, relationRepository: Repository<ParentStudentRelation>);
    findUserById(id: number): Promise<User | null>;
    isBoundToStudent(parentId: number, studentId: number): Promise<boolean>;
    markAsCompleted(userId: number, kpId: number): Promise<StudentProgress>;
    getProgress(userId: number): Promise<StudentProgress[]>;
    getProgressStats(userId: number): Promise<{
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
