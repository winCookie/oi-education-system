export declare class VideoService {
    private readonly logger;
    convertToHls(inputPath: string, outputDir: string): Promise<string>;
    mergeChunks(uploadId: string, fileName: string, totalChunks: number): Promise<string>;
}
