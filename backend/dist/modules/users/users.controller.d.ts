import { UsersService } from './users.service';
import { UserRole } from '../../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getAll(req: any): Promise<import("../../entities/user.entity").User[]>;
    createBatch(req: any, body: {
        users: {
            username: string;
            password: string;
            role: UserRole;
        }[];
    }): Promise<import("../../entities/user.entity").User[]>;
    update(req: any, id: string, body: any): Promise<import("../../entities/user.entity").User | null>;
    remove(req: any, id: string): Promise<{
        success: boolean;
    }>;
    unlock(req: any, id: string): Promise<{
        success: boolean;
    }>;
    bindStudent(req: any, body: {
        studentUsername: string;
    }): Promise<void>;
    getProfile(req: any): Promise<{
        id: number;
        username: string;
        role: UserRole;
        sessionVersion: number;
        avatar: string;
        nickname: string;
        luoguUid: string;
        bio: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(req: any, updateDto: UpdateProfileDto): Promise<{
        id: number;
        username: string;
        role: UserRole;
        sessionVersion: number;
        avatar: string;
        nickname: string;
        luoguUid: string;
        bio: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
