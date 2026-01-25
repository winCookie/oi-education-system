import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentReport, ReportStatus } from '../../entities/student-report.entity';
import { User, UserRole } from '../../entities/user.entity';
import { ParentStudentRelation } from '../../entities/parent-student-relation.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../entities/notification.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(StudentReport)
    private reportRepository: Repository<StudentReport>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ParentStudentRelation)
    private relationRepository: Repository<ParentStudentRelation>,
    private notificationsService: NotificationsService,
  ) {}

  async createReport(teacherId: number, createDto: any) {
    const teacher = await this.userRepository.findOne({ where: { id: teacherId } });
    if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'admin')) {
      throw new ForbiddenException('只有教师或管理员可以创建学情报告');
    }

    const student = await this.userRepository.findOne({ where: { id: createDto.studentId } });
    if (!student || student.role !== 'student') {
      throw new BadRequestException('学生不存在');
    }

    const report = this.reportRepository.create({
      teacher: { id: teacherId } as User,
      student: { id: createDto.studentId } as User,
      studentName: createDto.studentName || student.username,
      stage: createDto.stage,
      startDate: createDto.startDate,
      endDate: createDto.endDate,
      groupType: createDto.groupType,
      knowledgeModules: createDto.knowledgeModules || [],
      trainingData: createDto.trainingData || [],
      abilityScores: createDto.abilityScores || [],
      coachComments: createDto.coachComments,
      status: ReportStatus.DRAFT,
    });

    return this.reportRepository.save(report);
  }

  async updateReport(reportId: number, teacherId: number, updateDto: any) {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: ['teacher', 'student'],
    });

    if (!report) {
      throw new NotFoundException('报告不存在');
    }

    if (report.teacher.id !== teacherId) {
      throw new ForbiddenException('您无权编辑此报告');
    }

    Object.assign(report, {
      studentName: updateDto.studentName,
      stage: updateDto.stage,
      startDate: updateDto.startDate,
      endDate: updateDto.endDate,
      groupType: updateDto.groupType,
      knowledgeModules: updateDto.knowledgeModules,
      trainingData: updateDto.trainingData,
      abilityScores: updateDto.abilityScores,
      coachComments: updateDto.coachComments,
    });

    return this.reportRepository.save(report);
  }

  async sendReport(reportId: number, teacherId: number) {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: ['teacher', 'student'],
    });

    if (!report) {
      throw new NotFoundException('报告不存在');
    }

    if (report.teacher.id !== teacherId) {
      throw new ForbiddenException('您无权发送此报告');
    }

    report.status = ReportStatus.SENT;
    const savedReport = await this.reportRepository.save(report);

    // 发送通知给学生
    await this.notificationsService.createNotification(
      report.student.id,
      '新的学情报告',
      `教师 ${report.teacher.username} 发送了一份学情分析报告，请查看。`,
      NotificationType.SYSTEM,
      report.id,
    );

    // 查询绑定的家长并发送通知
    const relations = await this.relationRepository.find({
      where: { student: { id: report.student.id } },
      relations: ['parent'],
    });

    // 发送通知给所有绑定的家长
    for (const relation of relations) {
      await this.notificationsService.createNotification(
        relation.parent.id,
        '孩子的新学情报告',
        `教师 ${report.teacher.username} 为您的孩子 ${report.studentName} 发送了一份学情分析报告，请查看。`,
        NotificationType.SYSTEM,
        report.id,
      );
    }

    return savedReport;
  }

  async getReportsByTeacher(teacherId: number) {
    return this.reportRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ['student'],
      order: { createdAt: 'DESC' },
    });
  }

  async getReportsByStudent(studentId: number) {
    return this.reportRepository.find({
      where: { student: { id: studentId }, status: ReportStatus.SENT },
      relations: ['teacher', 'student'],
      order: { createdAt: 'DESC' },
    });
  }

  async getReportsByParent(parentId: number) {
    // 查询家长绑定的所有学生
    const relations = await this.relationRepository.find({
      where: { parent: { id: parentId } },
      relations: ['student'],
    });

    if (relations.length === 0) {
      return [];
    }

    // 获取所有绑定学生的ID
    const studentIds = relations.map(rel => rel.student.id);

    // 查询这些学生的所有已发送报告
    return this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.teacher', 'teacher')
      .leftJoinAndSelect('report.student', 'student')
      .where('report.student.id IN (:...studentIds)', { studentIds })
      .andWhere('report.status = :status', { status: ReportStatus.SENT })
      .orderBy('report.createdAt', 'DESC')
      .getMany();
  }

  async getReportDetail(reportId: number, userId: number, userRole: string) {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: ['teacher', 'student'],
    });

    if (!report) {
      throw new NotFoundException('报告不存在');
    }

    // 权限检查：只有报告创建者、学生本人、学生的家长或管理员可以查看
    let hasPermission = false;

    if (userRole === 'admin' || report.teacher.id === userId || report.student.id === userId) {
      hasPermission = true;
    } else if (userRole === 'parent') {
      // 检查家长是否绑定了该学生
      const relation = await this.relationRepository.findOne({
        where: {
          parent: { id: userId },
          student: { id: report.student.id },
        },
      });
      if (relation) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      throw new ForbiddenException('您无权查看此报告');
    }

    // 如果不是教师或管理员，只能查看已发送的报告
    if (
      (userRole !== 'teacher' && userRole !== 'admin') &&
      report.status !== ReportStatus.SENT
    ) {
      throw new ForbiddenException('该报告尚未发送');
    }

    return report;
  }

  async deleteReport(reportId: number, teacherId: number) {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: ['teacher'],
    });

    if (!report) {
      throw new NotFoundException('报告不存在');
    }

    if (report.teacher.id !== teacherId) {
      throw new ForbiddenException('您无权删除此报告');
    }

    await this.reportRepository.remove(report);
    return { message: '报告已删除' };
  }

  async getStudentList(teacherId: number) {
    // 返回所有学生用户供教师选择
    return this.userRepository.find({
      where: { role: UserRole.STUDENT },
      select: ['id', 'username'],
      order: { username: 'ASC' },
    });
  }
}
