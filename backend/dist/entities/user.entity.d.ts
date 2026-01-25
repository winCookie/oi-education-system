export declare enum UserRole {
    ADMIN = "admin",
    TEACHER = "teacher",
    STUDENT = "student",
    PARENT = "parent",
    GUEST = "guest"
}
export declare class User {
    id: number;
    username: string;
    passwordHash: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
