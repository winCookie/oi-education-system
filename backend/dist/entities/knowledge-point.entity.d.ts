import { Problem } from './problem.entity';
export declare enum KnowledgeGroup {
    PRIMARY = "\u5165\u95E8\u7EC4",
    ADVANCED = "\u63D0\u9AD8\u7EC4"
}
export declare class KnowledgePoint {
    id: number;
    title: string;
    group: KnowledgeGroup;
    category: string;
    contentMd: string;
    problems: Problem[];
    createdAt: Date;
    updatedAt: Date;
}
