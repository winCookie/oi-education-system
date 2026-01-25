import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../../entities/user.entity';

@Controller('schedules')
export class ScheduleController {
  constructor(private scheduleService: ScheduleService) { }

  @Get()
  async getAll() {
    return this.scheduleService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() body: any) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Only admin or teacher can create schedules');
    }
    return this.scheduleService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() body: any) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Only admin or teacher can update schedules');
    }
    return this.scheduleService.update(+id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Only admin or teacher can delete schedules');
    }
    await this.scheduleService.remove(+id);
    return { success: true };
  }
}
