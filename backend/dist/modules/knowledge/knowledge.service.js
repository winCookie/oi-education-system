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
exports.KnowledgeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const knowledge_point_entity_1 = require("../../entities/knowledge-point.entity");
const problem_entity_1 = require("../../entities/problem.entity");
let KnowledgeService = class KnowledgeService {
    kpRepository;
    problemRepository;
    constructor(kpRepository, problemRepository) {
        this.kpRepository = kpRepository;
        this.problemRepository = problemRepository;
    }
    async findAllByGroup(group) {
        return this.kpRepository.find({
            where: { group },
            select: ['id', 'title', 'category', 'group'],
            order: { id: 'ASC' },
        });
    }
    async search(query) {
        return this.kpRepository.find({
            where: [
                { title: (0, typeorm_2.Like)(`%${query}%`) },
                { category: (0, typeorm_2.Like)(`%${query}%`) },
            ],
            select: ['id', 'title', 'category', 'group'],
        });
    }
    async findOne(id) {
        return this.kpRepository.findOne({
            where: { id },
            relations: ['problems'],
        });
    }
    async create(data) {
        const kp = this.kpRepository.create(data);
        return this.kpRepository.save(kp);
    }
    async addProblem(kpId, problemData) {
        const kp = await this.kpRepository.findOne({ where: { id: kpId } });
        if (!kp)
            throw new Error('Knowledge point not found');
        const problem = this.problemRepository.create({
            ...problemData,
            knowledgePoint: kp,
        });
        return this.problemRepository.save(problem);
    }
    async findAll() {
        return this.kpRepository.find({
            select: ['id', 'title', 'category', 'group'],
            order: { id: 'ASC' },
        });
    }
    async update(id, data) {
        await this.kpRepository.update(id, data);
        return this.findOne(id);
    }
    async remove(id) {
        await this.kpRepository.delete(id);
    }
    async updateProblem(id, data) {
        await this.problemRepository.update(id, data);
        return this.problemRepository.findOne({ where: { id } });
    }
    async deleteProblem(id) {
        await this.problemRepository.delete(id);
    }
};
exports.KnowledgeService = KnowledgeService;
exports.KnowledgeService = KnowledgeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(knowledge_point_entity_1.KnowledgePoint)),
    __param(1, (0, typeorm_1.InjectRepository)(problem_entity_1.Problem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], KnowledgeService);
//# sourceMappingURL=knowledge.service.js.map