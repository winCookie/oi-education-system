import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, ForbiddenException, BadRequestException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) { }

  @Get()
  async getAll(@Request() req) {
    return this.notificationsService.findAll(req.user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.findUnreadCount(req.user.id);
    return { count };
  }

  @Patch(':id/read')
  async markRead(@Request() req, @Param('id') id: string) {
    await this.notificationsService.markAsRead(+id, req.user.id);
    return { success: true };
  }

  @Post('binding-request')
  async createBindingRequest(@Request() req, @Body() body: { studentUsername: string }) {
    if (req.user.role !== 'parent') {
      throw new ForbiddenException('只有家长可以发起绑定申请');
    }

    if (!body || !body.studentUsername || body.studentUsername.trim() === '') {
      throw new BadRequestException('请提供学生用户名');
    }

    return this.notificationsService.createBindingRequest(req.user.id, body.studentUsername.trim());
  }

  @Post('binding-request/:id/:action')
  async handleBindingRequest(
    @Request() req,
    @Param('id') id: string,
    @Param('action') action: 'accept' | 'reject'
  ) {
    if (req.user.role !== 'student') {
      throw new ForbiddenException('只有学生可以处理绑定申请');
    }
    return this.notificationsService.handleBindingRequest(+id, req.user.id, action);
  }
}
