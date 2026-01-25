import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    
    // Check if user still exists
    if (!user) {
      throw new UnauthorizedException('账号不存在或已被注销');
    }

    // Single device check: sv in token must match sv in DB
    // If sv is missing (legacy token) or mismatched, force re-login
    if (typeof payload.sv === 'undefined' || user.sessionVersion !== payload.sv) {
      throw new UnauthorizedException('登录状态已失效（账号可能在其他地方登录），请重新登录。');
    }

    return { id: payload.sub, username: payload.username, role: payload.role };
  }
}
