import { Controller, Get, Post, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GespService } from './gesp.service';
import { UserRole } from '../../entities/user.entity';

@Controller('gesp')
@UseGuards(JwtAuthGuard)
export class GespController {
  constructor(private readonly gespService: GespService) {}

  @Get('config')
  async getConfig(@Request() req) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Access denied');
    }
    return this.gespService.getConfig();
  }

  @Post('config')
  async updateConfig(@Request() req, @Body() config: any) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can update config');
    }
    return this.gespService.updateConfig(config);
  }

  @Post('check')
  async runCheck(@Request() req) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Access denied');
    }
    return this.gespService.runCheck();
  }

  @Get('results')
  async getResults(@Request() req) {
    // Allow all authenticated users to view results
    return this.gespService.getResults();
  }

  @Get('log')
  async getLog(@Request() req) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Access denied');
    }
    return this.gespService.getLogTail();
  }
}
