import { Repository } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import { ParentStudentRelation } from '../../entities/parent-student-relation.entity';
export declare class UsersService {
    private usersRepository;
    private relationRepository;
    constructor(usersRepository: Repository<User>, relationRepository: Repository<ParentStudentRelation>);
    findParentRelations(parentId: number): Promise<ParentStudentRelation[]>;
    isBound(parentId: number, studentId: number): Promise<boolean>;
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
    updateProfile(userId: number, data: {
        nickname?: string;
        avatar?: string;
        bio?: string;
    }): Promise<User | null>;
}
