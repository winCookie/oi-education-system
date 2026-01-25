import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../../entities/user.entity';
import * as argon2 from 'argon2';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(@Request() req) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Only admin or teacher can access user list');
    }
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post('batch')
  async createBatch(@Request() req, @Body() body: { users: { username: string; password: string; role: UserRole }[] }) {
    const isSuperAdmin = req.user.role === UserRole.ADMIN;
    const isTeacher = req.user.role === UserRole.TEACHER;

    if (!isSuperAdmin && !isTeacher) {
      throw new ForbiddenException('Only admin or teacher can batch create users');
    }

    if (isTeacher && body.users.length > 200) {
      throw new BadRequestException('Teachers can only create up to 200 users at a time');
    }

    const hashedUsers = await Promise.all(
      body.users.map(async (u) => ({
        username: u.username,
        passwordHash: await argon2.hash(u.password),
        role: u.role || UserRole.STUDENT,
      })),
    );

    return this.usersService.createMany(hashedUsers);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() body: any) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can update user roles');
    }
    // Don't allow changing your own role to something else if you're the only admin
    // Or just generally restrict role updates to Admin role.
    return this.usersService.update(+id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can delete users');
    }
    if (req.user.userId === +id) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    await this.usersService.remove(+id);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/unlock')
  async unlock(@Request() req, @Param('id') id: string) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Only admin or teacher can unlock accounts');
    }
    await this.usersService.update(+id, { loginAttempts: 0, lockUntil: null });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('bind-student')
  async bindStudent(@Request() req, @Body() body: { studentUsername: string }) {
    throw new BadRequestException('请通过新的通知系统发起绑定申请');
  }
}
