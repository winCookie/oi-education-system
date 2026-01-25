"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const multer_1 = require("multer");
const path_1 = require("path");
const user_entity_1 = require("../../entities/user.entity");
const video_service_1 = require("./video.service");
const fs = __importStar(require("fs-extra"));
const uuid_1 = require("uuid");
let UploadController = class UploadController {
    videoService;
    constructor(videoService) {
        this.videoService = videoService;
    }
    async initUpload(req, body) {
        if (req.user.role !== user_entity_1.UserRole.TEACHER && req.user.role !== user_entity_1.UserRole.ADMIN) {
            throw new common_1.BadRequestException('Only teachers or admins can upload videos');
        }
        const uploadId = (0, uuid_1.v4)();
        await fs.ensureDir((0, path_1.join)(process.cwd(), 'uploads/chunks', uploadId));
        return { uploadId };
    }
    async uploadChunk(file, body, req) {
        if (req.user.role !== user_entity_1.UserRole.TEACHER && req.user.role !== user_entity_1.UserRole.ADMIN) {
            throw new common_1.BadRequestException('Only teachers or admins can upload videos');
        }
        const chunkPath = (0, path_1.join)(process.cwd(), 'uploads/chunks', body.uploadId, `${body.index}`);
        await fs.writeFile(chunkPath, file.buffer);
        return { success: true };
    }
    async completeUpload(req, body) {
        if (req.user.role !== user_entity_1.UserRole.TEACHER && req.user.role !== user_entity_1.UserRole.ADMIN) {
            throw new common_1.BadRequestException('Only teachers or admins can upload videos');
        }
        try {
            const mergedPath = await this.videoService.mergeChunks(body.uploadId, body.fileName, body.totalChunks);
            const hlsOutputDir = (0, path_1.join)(process.cwd(), 'uploads/hls', body.uploadId);
            const hlsUrl = await this.videoService.convertToHls(mergedPath, hlsOutputDir);
            return { url: hlsUrl };
        }
        catch (err) {
            throw new common_1.BadRequestException('Failed to process video: ' + err.message);
        }
    }
    async uploadVideo(file, req) {
        if (req.user.role !== user_entity_1.UserRole.TEACHER && req.user.role !== user_entity_1.UserRole.ADMIN) {
            throw new common_1.BadRequestException('Only teachers or admins can upload videos');
        }
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        const uploadId = (0, uuid_1.v4)();
        const hlsOutputDir = (0, path_1.join)(process.cwd(), 'uploads/hls', uploadId);
        const hlsUrl = await this.videoService.convertToHls(file.path, hlsOutputDir);
        return {
            url: hlsUrl,
        };
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('video/init'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "initUpload", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('video/chunk'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadChunk", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('video/complete'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "completeUpload", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('video'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/videos',
            filename: (req, file, cb) => {
                const randomName = (0, uuid_1.v4)();
                return cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(mp4|webm|quicktime)$/)) {
                return cb(new common_1.BadRequestException('Only video files are allowed!'), false);
            }
            cb(null, true);
        },
        limits: {
            fileSize: 100 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadVideo", null);
exports.UploadController = UploadController = __decorate([
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [video_service_1.VideoService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map