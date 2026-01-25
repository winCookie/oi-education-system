import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentProgress } from '../../entities/student-progress.entity';
import { User } from '../../entities/user.entity';
import { ParentStudentRelation } from '../../entities/parent-student-relation.entity';
import { KnowledgePoint } from '../../entities/knowledge-point.entity';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(StudentProgress)
    private progressRepository: Repository<StudentProgress>,
    @InjectRepository(KnowledgePoint)
    private kpRepository: Repository<KnowledgePoint>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ParentStudentRelation)
    private relationRepository: Repository<ParentStudentRelation>,
  ) {}

  async findUserById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async isBoundToStudent(parentId: number, studentId: number): Promise<boolean> {
    const count = await this.relationRepository.count({
      where: { parent: { id: parentId }, student: { id: studentId } }
    });
    return count > 0;
  }

  async markAsCompleted(userId: number, kpId: number): Promise<StudentProgress> {
    let progress = await this.progressRepository.findOne({
      where: { user: { id: userId }, knowledgePoint: { id: kpId } },
    });

    if (!progress) {
      progress = this.progressRepository.create({
        user: { id: userId } as User,
        knowledgePoint: { id: kpId } as KnowledgePoint,
      });
    }

    progress.isCompleted = true;
    return this.progressRepository.save(progress);
  }

  async getProgress(userId: number) {
    return this.progressRepository.find({
      where: { user: { id: userId }, isCompleted: true },
      relations: ['knowledgePoint'],
    });
  }

  async getProgressStats(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.role === 'parent') {
      return {
        groups: {},
        categories: {},
        totalKPs: 0,
        totalCompleted: 0,
        overallPercent: 0,
        recentKPs: [],
        isParent: true,
      };
    }

    // Get all knowledge points
    const allKPs = await this.kpRepository.find({
      select: ['id', 'category', 'group'],
    });

    // Get user's completed knowledge points
    const completedProgress = await this.progressRepository.find({
      where: { user: { id: userId }, isCompleted: true },
      relations: ['knowledgePoint'],
    });

    const completedKpIds = new Set(completedProgress.map((p) => p.knowledgePoint.id));

    // Calculate stats by Group AND Category
    const groupStats: Record<string, Record<string, { total: number; completed: number; percent: number }>> = {};
    
    allKPs.forEach((kp) => {
      const g = kp.group;
      const c = kp.category || '未分类';

      if (!groupStats[g]) groupStats[g] = {};
      if (!groupStats[g][c]) groupStats[g][c] = { total: 0, completed: 0, percent: 0 };

      groupStats[g][c].total++;
      if (completedKpIds.has(kp.id)) {
        groupStats[g][c].completed++;
      }
    });

    // Calculate percentages for each group/category
    Object.keys(groupStats).forEach((g) => {
      Object.keys(groupStats[g]).forEach((c) => {
        const s = groupStats[g][c];
        s.percent = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
      });
    });

    // Keep global category stats for backward compatibility (optional but good for Profile page)
    const categoryStats: Record<string, { total: number; completed: number; percent: number }> = {};
    const categories = Array.from(new Set(allKPs.map(kp => kp.category))).filter(Boolean);
    
    categories.forEach((cat) => {
      const totalInCat = allKPs.filter((kp) => kp.category === cat).length;
      const completedInCat = completedProgress.filter(
        (p) => p.knowledgePoint.category === cat,
      ).length;

      categoryStats[cat] = {
        total: totalInCat,
        completed: completedInCat,
        percent: totalInCat > 0 ? Math.round((completedInCat / totalInCat) * 100) : 0,
      };
    });

    return {
      groups: groupStats, // New group-aware stats
      categories: categoryStats, // Global category stats
      totalKPs: allKPs.length,
      totalCompleted: completedProgress.length,
      overallPercent: allKPs.length > 0 ? Math.round((completedProgress.length / allKPs.length) * 100) : 0,
      recentKPs: completedProgress
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 5)
        .map(p => ({
          id: p.knowledgePoint.id,
          title: p.knowledgePoint.title,
          completedAt: p.updatedAt
        }))
    };
  }
}
