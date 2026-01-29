"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const student_progress_entity_1 = require("../../entities/student-progress.entity");
const knowledge_point_entity_1 = require("../../entities/knowledge-point.entity");
const user_entity_1 = require("../../entities/user.entity");
const parent_student_relation_entity_1 = require("../../entities/parent-student-relation.entity");
const progress_service_1 = require("./progress.service");
const progress_controller_1 = require("./progress.controller");
let ProgressModule = class ProgressModule {
};
exports.ProgressModule = ProgressModule;
exports.ProgressModule = ProgressModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([student_progress_entity_1.StudentProgress, knowledge_point_entity_1.KnowledgePoint, user_entity_1.User, parent_student_relation_entity_1.ParentStudentRelation])],
        providers: [progress_service_1.ProgressService],
        controllers: [progress_controller_1.ProgressController],
        exports: [progress_service_1.ProgressService],
    })
], ProgressModule);
//# sourceMappingURL=progress.module.js.map