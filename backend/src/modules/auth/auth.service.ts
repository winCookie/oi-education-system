import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { UserRole } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (!user) {
      return null;
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new ForbiddenException(`账号已锁定，请在 ${user.lockUntil.toLocaleString()} 后再试，或联系管理员。`);
    }

    if (await argon2.verify(user.passwordHash, pass)) {
      // Success: Reset attempts and return user
      await this.usersService.update(user.id, { loginAttempts: 0, lockUntil: null });
      const { passwordHash, ...result } = user;
      return result;
    }

    // Failure: Increment attempts
    const newAttempts = (user.loginAttempts || 0) + 1;
    let lockUntil: Date | null = null;
    if (newAttempts >= 3) {
      lockUntil = new Date();
      lockUntil.setHours(lockUntil.getHours() + 1);
    }

    await this.usersService.update(user.id, { 
      loginAttempts: newAttempts, 
      lockUntil 
    });

    if (newAttempts >= 3) {
      throw new ForbiddenException('登录失败次数过多，账号已锁定1小时。请联系管理员。');
    }

    return null;
  }

  async login(user: any) {
    // Increment session version to invalidate previous sessions
    const newSessionVersion = (user.sessionVersion || 0) + 1;
    await this.usersService.update(user.id, { sessionVersion: newSessionVersion });

    const payload = { 
      username: user.username, 
      sub: user.id, 
      role: user.role,
      sv: newSessionVersion // session version
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async register(username: string, pass: string, role: UserRole) {
    const passwordHash = await argon2.hash(pass);
    return this.usersService.create(username, passwordHash, role);
  }
}
