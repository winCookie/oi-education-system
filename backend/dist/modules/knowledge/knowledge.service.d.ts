import { Repository } from 'typeorm';
import { KnowledgePoint, KnowledgeGroup } from '../../entities/knowledge-point.entity';
import { Problem } from '../../entities/problem.entity';
export declare class KnowledgeService {
    private kpRepository;
    private problemRepository;
    constructor(kpRepository: Repository<KnowledgePoint>, problemRepository: Repository<Problem>);
    findAllByGroup(group: KnowledgeGroup): Promise<KnowledgePoint[]>;
    search(query: string): Promise<KnowledgePoint[]>;
    findOne(id: number): Promise<KnowledgePoint | null>;
    create(data: Partial<KnowledgePoint>): Promise<KnowledgePoint>;
    addProblem(kpId: number, problemData: Partial<Problem>): Promise<Problem>;
    findAll(): Promise<KnowledgePoint[]>;
    update(id: number, data: Partial<KnowledgePoint>): Promise<KnowledgePoint | null>;
    remove(id: number): Promise<void>;
    updateProblem(id: number, data: Partial<Problem>): Promise<Problem | null>;
    deleteProblem(id: number): Promise<void>;
}
