import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentProgress } from '../../entities/student-progress.entity';
import { KnowledgePoint } from '../../entities/knowledge-point.entity';
import { User } from '../../entities/user.entity';
import { ParentStudentRelation } from '../../entities/parent-student-relation.entity';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StudentProgress, KnowledgePoint, User, ParentStudentRelation])],
  providers: [ProgressService],
  controllers: [ProgressController],
  exports: [ProgressService],
})
export class ProgressModule {}
