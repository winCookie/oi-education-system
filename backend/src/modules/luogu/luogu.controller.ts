import { Controller, Get, Post, Body, UseGuards, Request, ForbiddenException, Param, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LuoguService } from './luogu.service';
import { UserRole } from '../../entities/user.entity';
import type { Response } from 'express';

@Controller('luogu')
@UseGuards(JwtAuthGuard)
export class LuoguController {
  constructor(private readonly luoguService: LuoguService) {}

  @Get('config')
  async getConfig(@Request() req) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('仅管理员和教师可访问');
    }
    return this.luoguService.getConfig();
  }

  @Post('config')
  async updateConfig(@Request() req, @Body() config: any) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('仅管理员可修改配置');
    }
    return this.luoguService.updateConfig(config);
  }

  @Post('fetch')
  async fetch(@Request() req) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('仅管理员和教师可执行抓取');
    }
    return this.luoguService.runFetch();
  }

  @Post('fetch-test')
  async fetchTest(@Request() req, @Body('limit') limit: number) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('仅管理员和教师可执行抓取');
    }
    return this.luoguService.runFetch(limit || 3);
  }

  @Get('reports')
  async getReports(@Request() req) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('仅管理员和教师可查看报告');
    }
    return this.luoguService.getReports();
  }

  @Get('log')
  async getLog(@Request() req) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('仅管理员和教师可查看日志');
    }
    return this.luoguService.getLogTail();
  }

  @Get('download/:filename')
  async downloadReport(@Param('filename') filename: string, @Res() res: Response, @Request() req) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('无权下载报告');
    }
    const filePath = this.luoguService.getReportPath(filename);
    if (!filePath) {
      return res.status(404).send('文件不存在');
    }
    return res.download(filePath);
  }
}
