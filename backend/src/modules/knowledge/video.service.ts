import { Injectable, Logger } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs-extra';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  async convertToHls(inputPath: string, outputDir: string): Promise<string> {
    await fs.ensureDir(outputDir);
    const outputFileName = 'index.m3u8';
    const outputPath = path.join(outputDir, outputFileName);

    // Handle different import styles for fluent-ffmpeg
    const ffmpegCommand = typeof ffmpeg === 'function' ? ffmpeg : (ffmpeg as any).default || ffmpeg;

    return new Promise((resolve, reject) => {
      ffmpegCommand(inputPath)
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

  async mergeChunks(uploadId: string, fileName: string, totalChunks: number): Promise<string> {
    const chunkDir = path.join(process.cwd(), 'uploads/chunks', uploadId);
    const videosDir = path.join(process.cwd(), 'uploads/videos');
    const finalPath = path.join(videosDir, `${uploadId}${path.extname(fileName)}`);

    await fs.ensureDir(videosDir);

    const writeStream = fs.createWriteStream(finalPath);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(chunkDir, `${i}`);
        if (!await fs.pathExists(chunkPath)) {
          throw new Error(`Chunk ${i} is missing at ${chunkPath}`);
        }
        const chunkBuffer = await fs.readFile(chunkPath);
        writeStream.write(chunkBuffer);
      }
    } catch (err) {
      writeStream.end();
      throw err;
    }

    writeStream.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', async () => {
        try {
          await fs.remove(chunkDir); // Clean up chunks
          resolve(finalPath);
        } catch (cleanupErr) {
          this.logger.warn(`Failed to clean up chunks: ${cleanupErr.message}`);
          resolve(finalPath); // Still resolve if only cleanup failed
        }
      });
      writeStream.on('error', reject);
    });
  }
}
