import { Repository } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    findOne(username: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    findAll(): Promise<User[]>;
    update(id: number, data: Partial<User>): Promise<User | null>;
    remove(id: number): Promise<void>;
    create(username: string, passwordHash: string, role: UserRole): Promise<User>;
    createMany(users: {
        username: string;
        passwordHash: string;
        role: UserRole;
    }[]): Promise<User[]>;
}
