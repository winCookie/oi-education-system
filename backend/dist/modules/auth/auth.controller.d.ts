import { AuthService } from './auth.service';
import { UserRole } from '../../entities/user.entity';
import { UsersService } from '../users/users.service';
export declare class AuthController {
    private authService;
    private usersService;
    constructor(authService: AuthService, usersService: UsersService);
    login(body: any): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            role: any;
        };
    }>;
    registerStudent(req: any, body: any): Promise<import("../../entities/user.entity").User>;
    getProfile(req: any): Promise<{
        id: number;
        username: string;
        role: UserRole;
        sessionVersion: number;
        loginAttempts: number;
        lockUntil: Date | null;
        avatar: string;
        nickname: string;
        luoguUid: string;
        bio: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
}
