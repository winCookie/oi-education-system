import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgePoint } from '../../entities/knowledge-point.entity';
import { Problem } from '../../entities/problem.entity';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { UploadController } from './upload.controller';
import { VideoService } from './video.service';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgePoint, Problem])],
  providers: [KnowledgeService, VideoService],
  controllers: [KnowledgeController, UploadController],
})
export class KnowledgeModule { }
