"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const argon2 = __importStar(require("argon2"));
let AuthService = class AuthService {
    usersService;
    jwtService;
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async validateUser(username, pass) {
        const user = await this.usersService.findOne(username);
        if (!user) {
            return null;
        }
        if (user.lockUntil && user.lockUntil > new Date()) {
            throw new common_1.ForbiddenException(`账号已锁定，请在 ${user.lockUntil.toLocaleString()} 后再试，或联系管理员。`);
        }
        if (await argon2.verify(user.passwordHash, pass)) {
            await this.usersService.update(user.id, { loginAttempts: 0, lockUntil: null });
            const { passwordHash, ...result } = user;
            return result;
        }
        const newAttempts = (user.loginAttempts || 0) + 1;
        let lockUntil = null;
        if (newAttempts >= 3) {
            lockUntil = new Date();
            lockUntil.setHours(lockUntil.getHours() + 1);
        }
        await this.usersService.update(user.id, {
            loginAttempts: newAttempts,
            lockUntil
        });
        if (newAttempts >= 3) {
            throw new common_1.ForbiddenException('登录失败次数过多，账号已锁定1小时。请联系管理员。');
        }
        return null;
    }
    async login(user) {
        const newSessionVersion = (user.sessionVersion || 0) + 1;
        await this.usersService.update(user.id, { sessionVersion: newSessionVersion });
        const payload = {
            username: user.username,
            sub: user.id,
            role: user.role,
            sv: newSessionVersion
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
    async register(username, pass, role) {
        const passwordHash = await argon2.hash(pass);
        return this.usersService.create(username, passwordHash, role);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map