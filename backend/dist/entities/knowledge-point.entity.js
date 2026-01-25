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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgePoint = exports.KnowledgeGroup = void 0;
const typeorm_1 = require("typeorm");
const problem_entity_1 = require("./problem.entity");
var KnowledgeGroup;
(function (KnowledgeGroup) {
    KnowledgeGroup["PRIMARY"] = "\u5165\u95E8\u7EC4";
    KnowledgeGroup["ADVANCED"] = "\u63D0\u9AD8\u7EC4";
})(KnowledgeGroup || (exports.KnowledgeGroup = KnowledgeGroup = {}));
let KnowledgePoint = class KnowledgePoint {
    id;
    title;
    group;
    category;
    contentMd;
    problems;
    createdAt;
    updatedAt;
};
exports.KnowledgePoint = KnowledgePoint;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], KnowledgePoint.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], KnowledgePoint.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: KnowledgeGroup,
    }),
    __metadata("design:type", String)
], KnowledgePoint.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], KnowledgePoint.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], KnowledgePoint.prototype, "contentMd", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => problem_entity_1.Problem, (problem) => problem.knowledgePoint),
    __metadata("design:type", Array)
], KnowledgePoint.prototype, "problems", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], KnowledgePoint.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], KnowledgePoint.prototype, "updatedAt", void 0);
exports.KnowledgePoint = KnowledgePoint = __decorate([
    (0, typeorm_1.Entity)('knowledge_points')
], KnowledgePoint);
//# sourceMappingURL=knowledge-point.entity.js.map