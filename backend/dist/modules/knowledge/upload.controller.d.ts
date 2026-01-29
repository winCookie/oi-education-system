import { VideoService } from './video.service';
export declare class UploadController {
    private readonly videoService;
    constructor(videoService: VideoService);
    initUpload(req: any, body: {
        fileName: string;
    }): Promise<{
        uploadId: string;
    }>;
    uploadChunk(file: Express.Multer.File, body: {
        uploadId: string;
        index: string | number;
    }, req: any): Promise<{
        success: boolean;
    }>;
    completeUpload(req: any, body: {
        uploadId: string;
        fileName: string;
        totalChunks: number;
    }): Promise<{
        url: string;
    }>;
    uploadVideo(file: Express.Multer.File, req: any): Promise<{
        url: string;
    }>;
}
