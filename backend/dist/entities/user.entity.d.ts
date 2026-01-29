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
    sessionVersion: number;
    loginAttempts: number;
    lockUntil: Date | null;
    avatar: string;
    nickname: string;
    luoguUid: string;
    bio: string;
    createdAt: Date;
    updatedAt: Date;
}
