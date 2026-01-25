import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException, Body, Request, Get, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UserRole } from '../../entities/user.entity';
import { VideoService } from './video.service';
import * as fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('upload')
export class UploadController {
  constructor(private readonly videoService: VideoService) {}

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Post('video/init')
  async initUpload(@Request() req, @Body() body: { fileName: string }) {
    if (req.user.role !== UserRole.TEACHER && req.user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Only teachers or admins can upload videos');
    }
    const uploadId = uuidv4();
    await fs.ensureDir(join(process.cwd(), 'uploads/chunks', uploadId));
    return { uploadId };
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Post('video/chunk')
  @UseInterceptors(FileInterceptor('file'))
  async uploadChunk(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { uploadId: string; index: string | number },
    @Request() req,
  ) {
    if (req.user.role !== UserRole.TEACHER && req.user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Only teachers or admins can upload videos');
    }
    console.log(`Receiving chunk ${body.index} for upload ${body.uploadId}`);
    if (!file) {
      console.error('No file in chunk upload');
      throw new BadRequestException('No file uploaded');
    }
    const chunkPath = join(process.cwd(), 'uploads/chunks', body.uploadId, `${body.index}`);
    try {
      await fs.writeFile(chunkPath, file.buffer);
      return { success: true };
    } catch (err) {
      console.error('Failed to write chunk:', err);
      throw new BadRequestException('Failed to write chunk: ' + err.message);
    }
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Post('video/complete')
  async completeUpload(
    @Request() req,
    @Body() body: { uploadId: string; fileName: string; totalChunks: number },
  ) {
    if (req.user.role !== UserRole.TEACHER && req.user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Only teachers or admins can upload videos');
    }

    console.log(`Completing upload ${body.uploadId}, merging ${body.totalChunks} chunks`);

    try {
      // 1. Merge chunks into an MP4
      const mergedPath = await this.videoService.mergeChunks(
        body.uploadId,
        body.fileName,
        body.totalChunks,
      );

      console.log(`Merged MP4 created at ${mergedPath}, starting HLS conversion`);

      // 2. Convert to HLS
      const hlsOutputDir = join(process.cwd(), 'uploads/hls', body.uploadId);
      const hlsUrl = await this.videoService.convertToHls(mergedPath, hlsOutputDir);

      console.log(`HLS conversion finished: ${hlsUrl}`);

      return { url: hlsUrl };
    } catch (err) {
      console.error('Error in completeUpload:', err);
      throw new BadRequestException('Failed to process video: ' + err.message);
    }
  }

  // Fallback for smaller files or backward compatibility
  @UseGuards(JwtAuthGuard)
  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (req, file, cb) => {
          const randomName = uuidv4();
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(mp4|webm|quicktime)$/)) {
          return cb(new BadRequestException('Only video files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit for direct upload
      },
    }),
  )
  async uploadVideo(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (req.user.role !== UserRole.TEACHER && req.user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Only teachers or admins can upload videos');
    }
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Still convert to HLS even for direct uploads for better playback
    const uploadId = uuidv4();
    const hlsOutputDir = join(process.cwd(), 'uploads/hls', uploadId);
    const hlsUrl = await this.videoService.convertToHls(file.path, hlsOutputDir);

    return {
      url: hlsUrl,
    };
  }
}
