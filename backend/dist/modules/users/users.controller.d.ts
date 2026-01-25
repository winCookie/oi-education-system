import { UsersService } from './users.service';
import { UserRole } from '../../entities/user.entity';
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
}
