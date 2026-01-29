import { KnowledgePoint } from './knowledge-point.entity';
export declare class Problem {
    id: number;
    title: string;
    contentMd: string;
    templateCpp: string;
    videoUrl: string;
    videoUpdatedAt: Date | null;
    knowledgePoint: KnowledgePoint;
    createdAt: Date;
    updatedAt: Date;
}
