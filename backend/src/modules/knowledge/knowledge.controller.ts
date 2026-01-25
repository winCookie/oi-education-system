import { Controller, Get, Post, Body, Query, Param, UseGuards, Request, ForbiddenException, Patch, Delete } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeGroup } from '../../entities/knowledge-point.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../../entities/user.entity';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('knowledge')
export class KnowledgeController {
  constructor(private knowledgeService: KnowledgeService) { }

  @Get('group/:group')
  async getByGroup(@Param('group') group: KnowledgeGroup) {
    return this.knowledgeService.findAllByGroup(group);
  }

  @Get('search')
  async search(@Query('q') query: string) {
    return this.knowledgeService.search(query);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.knowledgeService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() body: any) {
    if (req.user.role !== UserRole.TEACHER && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only teachers or admins can create knowledge points');
    }
    return this.knowledgeService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/problems')
  async addProblem(@Request() req, @Param('id') id: string, @Body() body: any) {
    if (req.user.role !== UserRole.TEACHER && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only teachers or admins can add problems');
    }
    return this.knowledgeService.addProblem(+id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('problems/:id')
  async updateProblem(@Request() req, @Param('id') id: string, @Body() body: any) {
    if (req.user.role !== UserRole.TEACHER && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only teachers or admins can update problems');
    }
    return this.knowledgeService.updateProblem(+id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('problems/:id')
  async deleteProblem(@Request() req, @Param('id') id: string) {
    if (req.user.role !== UserRole.TEACHER && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only teachers or admins can delete problems');
    }
    await this.knowledgeService.deleteProblem(+id);
    return { success: true };
  }

  @Get()
  async getAll() {
    return this.knowledgeService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() body: any) {
    if (req.user.role !== UserRole.TEACHER && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only teachers or admins can update knowledge points');
    }
    return this.knowledgeService.update(+id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    if (req.user.role !== UserRole.TEACHER && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only teachers or admins can delete knowledge points');
    }
    await this.knowledgeService.remove(+id);
    return { success: true };
  }
}
