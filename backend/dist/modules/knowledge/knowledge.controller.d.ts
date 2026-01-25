import { KnowledgeService } from './knowledge.service';
import { KnowledgeGroup } from '../../entities/knowledge-point.entity';
export declare class KnowledgeController {
    private knowledgeService;
    constructor(knowledgeService: KnowledgeService);
    getByGroup(group: KnowledgeGroup): Promise<import("../../entities/knowledge-point.entity").KnowledgePoint[]>;
    search(query: string): Promise<import("../../entities/knowledge-point.entity").KnowledgePoint[]>;
    getOne(id: string): Promise<import("../../entities/knowledge-point.entity").KnowledgePoint | null>;
    create(req: any, body: any): Promise<import("../../entities/knowledge-point.entity").KnowledgePoint>;
    addProblem(req: any, id: string, body: any): Promise<import("../../entities/problem.entity").Problem>;
    updateProblem(req: any, id: string, body: any): Promise<import("../../entities/problem.entity").Problem | null>;
    deleteProblem(req: any, id: string): Promise<{
        success: boolean;
    }>;
    getAll(): Promise<import("../../entities/knowledge-point.entity").KnowledgePoint[]>;
    update(req: any, id: string, body: any): Promise<import("../../entities/knowledge-point.entity").KnowledgePoint | null>;
    remove(req: any, id: string): Promise<{
        success: boolean;
    }>;
}
