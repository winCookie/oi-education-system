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
var VideoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoService = void 0;
const common_1 = require("@nestjs/common");
const ffmpeg = __importStar(require("fluent-ffmpeg"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
let VideoService = VideoService_1 = class VideoService {
    logger = new common_1.Logger(VideoService_1.name);
    async convertToHls(inputPath, outputDir) {
        await fs.ensureDir(outputDir);
        const outputFileName = 'index.m3u8';
        const outputPath = path.join(outputDir, outputFileName);
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .outputOptions([
                '-profile:v baseline',
                '-level 3.0',
                '-start_number 0',
                '-hls_time 10',
                '-hls_list_size 0',
                '-f hls',
            ])
                .output(outputPath)
                .on('start', (commandLine) => {
                this.logger.log('Spawned Ffmpeg with command: ' + commandLine);
            })
                .on('progress', (progress) => {
                this.logger.log(`Processing: ${progress.percent}% done`);
            })
                .on('end', () => {
                this.logger.log('Transcoding finished !');
                resolve(`/uploads/hls/${path.basename(outputDir)}/${outputFileName}`);
            })
                .on('error', (err) => {
                this.logger.error('Cannot process video: ' + err.message);
                reject(err);
            })
                .run();
        });
    }
    async mergeChunks(uploadId, fileName, totalChunks) {
        const chunkDir = path.join(process.cwd(), 'uploads/chunks', uploadId);
        const finalPath = path.join(process.cwd(), 'uploads/videos', `${uploadId}${path.extname(fileName)}`);
        const writeStream = fs.createWriteStream(finalPath);
        for (let i = 0; i < totalChunks; i++) {
            const chunkPath = path.join(chunkDir, `${i}`);
            const chunkBuffer = await fs.readFile(chunkPath);
            writeStream.write(chunkBuffer);
        }
        writeStream.end();
        return new Promise((resolve, reject) => {
            writeStream.on('finish', async () => {
                await fs.remove(chunkDir);
                resolve(finalPath);
            });
            writeStream.on('error', reject);
        });
    }
};
exports.VideoService = VideoService;
exports.VideoService = VideoService = VideoService_1 = __decorate([
    (0, common_1.Injectable)()
], VideoService);
//# sourceMappingURL=video.service.js.map