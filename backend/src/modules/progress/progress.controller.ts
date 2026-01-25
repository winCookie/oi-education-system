import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('progress')
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':kpId/complete')
  async complete(@Request() req, @Param('kpId') kpId: string) {
    return this.progressService.markAsCompleted(req.user.userId, +kpId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyProgress(@Request() req) {
    return this.progressService.getProgress(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getMyStats(@Request() req) {
    return this.progressService.getProgressStats(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/:userId')
  async getUserStats(@Request() req, @Param('userId') userId: string) {
    const targetUserId = +userId;
    const currentUser = await this.progressService.findUserById(req.user.id);
    
    // Authorization check
    let authorized = false;
    if (req.user.role === 'admin' || req.user.role === 'teacher' || req.user.id === targetUserId) {
      authorized = true;
    } else if (req.user.role === 'parent') {
      authorized = await this.progressService.isBoundToStudent(req.user.id, targetUserId);
    }

    if (!authorized) {
      throw new Error('Unauthorized access to progress stats');
    }
    
    return this.progressService.getProgressStats(targetUserId);
  }
}
