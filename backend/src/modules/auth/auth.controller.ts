import { Controller, Post, Body, UseGuards, Request, Get, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole } from '../../entities/user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) { }

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('register-student')
  async registerStudent(@Request() req, @Body() body: any) {
    if (req.user.role !== UserRole.TEACHER && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only teachers or admins can register students');
    }
    return this.authService.register(body.username, body.password, UserRole.STUDENT);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) return null;
    const { passwordHash, ...result } = user;
    
    // If parent, try to attach bound students
    if (user.role === 'parent') {
      const relations = await this.usersService.findParentRelations(user.id);
      (result as any).boundStudents = relations.map(r => ({
        id: r.student.id,
        username: r.student.username
      }));
    }
    
    return result;
  }
}
