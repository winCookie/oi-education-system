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
exports.ProgressController = void 0;
const common_1 = require("@nestjs/common");
const progress_service_1 = require("./progress.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const throttler_1 = require("@nestjs/throttler");
let ProgressController = class ProgressController {
    progressService;
    constructor(progressService) {
        this.progressService = progressService;
    }
    async complete(req, kpId) {
        return this.progressService.markAsCompleted(req.user.userId, +kpId);
    }
    async getMyProgress(req) {
        return this.progressService.getProgress(req.user.userId);
    }
    async getMyStats(req) {
        return this.progressService.getProgressStats(req.user.userId);
    }
    async getUserStats(req, userId) {
        const targetUserId = +userId;
        const currentUser = await this.progressService.findUserById(req.user.id);
        let authorized = false;
        if (req.user.role === 'admin' || req.user.role === 'teacher' || req.user.id === targetUserId) {
            authorized = true;
        }
        else if (req.user.role === 'parent') {
            authorized = await this.progressService.isBoundToStudent(req.user.id, targetUserId);
        }
        if (!authorized) {
            throw new Error('Unauthorized access to progress stats');
        }
        return this.progressService.getProgressStats(targetUserId);
    }
};
exports.ProgressController = ProgressController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':kpId/complete'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('kpId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "complete", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "getMyProgress", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "getMyStats", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('stats/:userId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "getUserStats", null);
exports.ProgressController = ProgressController = __decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Controller)('progress'),
    __metadata("design:paramtypes", [progress_service_1.ProgressService])
], ProgressController);
//# sourceMappingURL=progress.controller.js.map