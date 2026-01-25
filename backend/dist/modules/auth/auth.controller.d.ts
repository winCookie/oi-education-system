import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: any): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            role: any;
        };
    }>;
    registerStudent(req: any, body: any): Promise<import("../../entities/user.entity").User>;
    getProfile(req: any): any;
}
