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
exports.StudentProgress = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const knowledge_point_entity_1 = require("./knowledge-point.entity");
let StudentProgress = class StudentProgress {
    id;
    user;
    knowledgePoint;
    isCompleted;
    createdAt;
    updatedAt;
};
exports.StudentProgress = StudentProgress;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], StudentProgress.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    __metadata("design:type", user_entity_1.User)
], StudentProgress.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => knowledge_point_entity_1.KnowledgePoint),
    __metadata("design:type", knowledge_point_entity_1.KnowledgePoint)
], StudentProgress.prototype, "knowledgePoint", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], StudentProgress.prototype, "isCompleted", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StudentProgress.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StudentProgress.prototype, "updatedAt", void 0);
exports.StudentProgress = StudentProgress = __decorate([
    (0, typeorm_1.Entity)('student_progress')
], StudentProgress);
//# sourceMappingURL=student-progress.entity.js.map