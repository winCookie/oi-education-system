import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../../entities/notification.entity';
import { BindingRequest, BindingStatus } from '../../entities/binding-request.entity';
import { ParentStudentRelation } from '../../entities/parent-student-relation.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(BindingRequest)
    private bindingRepository: Repository<BindingRequest>,
    @InjectRepository(ParentStudentRelation)
    private relationRepository: Repository<ParentStudentRelation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async findAll(userId: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: { user: { id: userId }, isRead: false },
    });
  }

  async markAsRead(notificationId: number, userId: number) {
    await this.notificationRepository.update(
      { id: notificationId, user: { id: userId } },
      { isRead: true }
    );
  }

  async createNotification(userId: number, title: string, content: string, type: NotificationType, relatedId?: number) {
    const notification = this.notificationRepository.create({
      user: { id: userId } as User,
      title,
      content,
      type,
      relatedId,
    });
    return this.notificationRepository.save(notification);
  }

  // Binding Request Logic
  async createBindingRequest(parentId: number, studentUsername: string) {
    const parent = await this.userRepository.findOne({ where: { id: parentId } });
    const student = await this.userRepository.findOne({ where: { username: studentUsername } });

    if (!student || student.role !== 'student') {
      throw new BadRequestException('未找到该学生账号');
    }

    // Check if already bound in ParentStudentRelation
    const alreadyBound = await this.relationRepository.findOne({
      where: { parent: { id: parentId }, student: { id: student.id } }
    });
    if (alreadyBound) {
      throw new BadRequestException('您已经绑定了该学生');
    }

    // Check for existing pending request
    const existing = await this.bindingRepository.findOne({
      where: { parent: { id: parentId }, student: { id: student.id }, status: BindingStatus.PENDING }
    });
    if (existing) {
      throw new BadRequestException('已向该学生发送过绑定申请，请耐心等待对方同意');
    }

    const request = this.bindingRepository.create({
      parent: { id: parentId } as User,
      student: { id: student.id } as User,
      status: BindingStatus.PENDING,
    });
    const savedRequest = await this.bindingRepository.save(request);

    // Create notification for student
    await this.createNotification(
      student.id,
      '新的家长绑定申请',
      `家长 ${parent?.username} 申请绑定您的账号以查看练习进度。`,
      NotificationType.BINDING_REQUEST,
      savedRequest.id
    );

    return savedRequest;
  }

  async handleBindingRequest(requestId: number, studentId: number, action: 'accept' | 'reject') {
    const request = await this.bindingRepository.findOne({
      where: { id: requestId, student: { id: studentId } },
      relations: ['parent', 'student'],
    });

    if (!request || request.status !== BindingStatus.PENDING) {
      throw new BadRequestException('申请不存在或已处理');
    }

    if (action === 'accept') {
      request.status = BindingStatus.ACCEPTED;
      
      // Create actual relation in the ParentStudentRelation table
      const existingRelation = await this.relationRepository.findOne({
        where: { parent: { id: request.parent.id }, student: { id: studentId } }
      });
      
      if (!existingRelation) {
        const relation = this.relationRepository.create({
          parent: { id: request.parent.id } as User,
          student: { id: studentId } as User,
        });
        await this.relationRepository.save(relation);
      }
      
      // Notify parent
      await this.createNotification(
        request.parent.id,
        '绑定申请已通过',
        `学生 ${request.student.username} 已同意您的绑定申请。`,
        NotificationType.SYSTEM
      );
    } else {
      request.status = BindingStatus.REJECTED;
      
      // Notify parent
      await this.createNotification(
        request.parent.id,
        '绑定申请被拒绝',
        `学生 ${request.student.username} 拒绝了您的绑定申请。`,
        NotificationType.SYSTEM
      );
    }

    await this.bindingRepository.save(request);

    // Mark related notification as read
    await this.notificationRepository.update(
      { relatedId: requestId, type: NotificationType.BINDING_REQUEST },
      { isRead: true }
    );

    return { success: true };
  }
}
