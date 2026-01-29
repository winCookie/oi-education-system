"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_progress_entity_1 = require("../../entities/student-progress.entity");
const user_entity_1 = require("../../entities/user.entity");
const parent_student_relation_entity_1 = require("../../entities/parent-student-relation.entity");
const knowledge_point_entity_1 = require("../../entities/knowledge-point.entity");
let ProgressService = class ProgressService {
    progressRepository;
    kpRepository;
    userRepository;
    relationRepository;
    constructor(progressRepository, kpRepository, userRepository, relationRepository) {
        this.progressRepository = progressRepository;
        this.kpRepository = kpRepository;
        this.userRepository = userRepository;
        this.relationRepository = relationRepository;
    }
    async findUserById(id) {
        return this.userRepository.findOne({ where: { id } });
    }
    async isBoundToStudent(parentId, studentId) {
        const count = await this.relationRepository.count({
            where: { parent: { id: parentId }, student: { id: studentId } }
        });
        return count > 0;
    }
    async markAsCompleted(userId, kpId) {
        let progress = await this.progressRepository.findOne({
            where: { user: { id: userId }, knowledgePoint: { id: kpId } },
        });
        if (!progress) {
            progress = this.progressRepository.create({
                user: { id: userId },
                knowledgePoint: { id: kpId },
            });
        }
        progress.isCompleted = true;
        return this.progressRepository.save(progress);
    }
    async getProgress(userId) {
        return this.progressRepository.find({
            where: { user: { id: userId }, isCompleted: true },
            relations: ['knowledgePoint'],
        });
    }
    async getProgressStats(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (user && user.role === 'parent') {
            return {
                groups: {},
                categories: {},
                totalKPs: 0,
                totalCompleted: 0,
                overallPercent: 0,
                recentKPs: [],
                isParent: true,
            };
        }
        const allKPs = await this.kpRepository.find({
            select: ['id', 'category', 'group'],
        });
        const completedProgress = await this.progressRepository.find({
            where: { user: { id: userId }, isCompleted: true },
            relations: ['knowledgePoint'],
        });
        const completedKpIds = new Set(completedProgress.map((p) => p.knowledgePoint.id));
        const groupStats = {};
        allKPs.forEach((kp) => {
            const g = kp.group;
            const c = kp.category || '未分类';
            if (!groupStats[g])
                groupStats[g] = {};
            if (!groupStats[g][c])
                groupStats[g][c] = { total: 0, completed: 0, percent: 0 };
            groupStats[g][c].total++;
            if (completedKpIds.has(kp.id)) {
                groupStats[g][c].completed++;
            }
        });
        Object.keys(groupStats).forEach((g) => {
            Object.keys(groupStats[g]).forEach((c) => {
                const s = groupStats[g][c];
                s.percent = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
            });
        });
        const categoryStats = {};
        const categories = Array.from(new Set(allKPs.map(kp => kp.category))).filter(Boolean);
        categories.forEach((cat) => {
            const totalInCat = allKPs.filter((kp) => kp.category === cat).length;
            const completedInCat = completedProgress.filter((p) => p.knowledgePoint.category === cat).length;
            categoryStats[cat] = {
                total: totalInCat,
                completed: completedInCat,
                percent: totalInCat > 0 ? Math.round((completedInCat / totalInCat) * 100) : 0,
            };
        });
        return {
            groups: groupStats,
            categories: categoryStats,
            totalKPs: allKPs.length,
            totalCompleted: completedProgress.length,
            overallPercent: allKPs.length > 0 ? Math.round((completedProgress.length / allKPs.length) * 100) : 0,
            recentKPs: completedProgress
                .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                .slice(0, 5)
                .map(p => ({
                id: p.knowledgePoint.id,
                title: p.knowledgePoint.title,
                completedAt: p.updatedAt
            }))
        };
    }
};
exports.ProgressService = ProgressService;
exports.ProgressService = ProgressService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_progress_entity_1.StudentProgress)),
    __param(1, (0, typeorm_1.InjectRepository)(knowledge_point_entity_1.KnowledgePoint)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(parent_student_relation_entity_1.ParentStudentRelation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ProgressService);
//# sourceMappingURL=progress.service.js.map