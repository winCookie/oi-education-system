import { User } from './user.entity';
import { KnowledgePoint } from './knowledge-point.entity';
export declare class StudentProgress {
    id: number;
    user: User;
    knowledgePoint: KnowledgePoint;
    isCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
