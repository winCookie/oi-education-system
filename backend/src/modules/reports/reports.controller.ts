import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(@Request() req, @Body() body: any) {
    return this.reportsService.createReport(req.user.id, body);
  }

  @Put(':id')
  async updateReport(
    @Param('id') id: string,
    @Request() req,
    @Body() body: any,
  ) {
    return this.reportsService.updateReport(+id, req.user.id, body);
  }

  @Post(':id/send')
  async sendReport(@Param('id') id: string, @Request() req) {
    return this.reportsService.sendReport(+id, req.user.id);
  }

  @Get('my-reports')
  async getMyReports(@Request() req) {
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      return this.reportsService.getReportsByTeacher(req.user.id);
    } else if (req.user.role === 'student') {
      return this.reportsService.getReportsByStudent(req.user.id);
    } else if (req.user.role === 'parent') {
      return this.reportsService.getReportsByParent(req.user.id);
    }
    return [];
  }

  @Get('students')
  async getStudentList(@Request() req) {
    return this.reportsService.getStudentList(req.user.id);
  }

  @Get(':id')
  async getReportDetail(@Param('id') id: string, @Request() req) {
    return this.reportsService.getReportDetail(+id, req.user.id, req.user.role);
  }

  @Delete(':id')
  async deleteReport(@Param('id') id: string, @Request() req) {
    return this.reportsService.deleteReport(+id, req.user.id);
  }
}
