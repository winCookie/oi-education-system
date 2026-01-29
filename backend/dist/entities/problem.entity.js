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
exports.Problem = void 0;
const typeorm_1 = require("typeorm");
const knowledge_point_entity_1 = require("./knowledge-point.entity");
let Problem = class Problem {
    id;
    title;
    contentMd;
    templateCpp;
    videoUrl;
    videoUpdatedAt;
    knowledgePoint;
    createdAt;
    updatedAt;
};
exports.Problem = Problem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Problem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Problem.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Problem.prototype, "contentMd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Problem.prototype, "templateCpp", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Problem.prototype, "videoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Problem.prototype, "videoUpdatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => knowledge_point_entity_1.KnowledgePoint, (kp) => kp.problems),
    __metadata("design:type", knowledge_point_entity_1.KnowledgePoint)
], Problem.prototype, "knowledgePoint", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Problem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Problem.prototype, "updatedAt", void 0);
exports.Problem = Problem = __decorate([
    (0, typeorm_1.Entity)('problems')
], Problem);
//# sourceMappingURL=problem.entity.js.map