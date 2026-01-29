"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../entities/user.entity");
const parent_student_relation_entity_1 = require("../../entities/parent-student-relation.entity");
let UsersService = class UsersService {
    usersRepository;
    relationRepository;
    constructor(usersRepository, relationRepository) {
        this.usersRepository = usersRepository;
        this.relationRepository = relationRepository;
    }
    async findParentRelations(parentId) {
        return this.relationRepository.find({
            where: { parent: { id: parentId } },
            relations: ['student']
        });
    }
    async isBound(parentId, studentId) {
        const count = await this.relationRepository.count({
            where: { parent: { id: parentId }, student: { id: studentId } }
        });
        return count > 0;
    }
    async findOne(username) {
        return this.usersRepository.findOne({ where: { username } });
    }
    async findById(id) {
        return this.usersRepository.findOne({ where: { id } });
    }
    async findAll() {
        return this.usersRepository.find({
            select: ['id', 'username', 'role', 'createdAt'],
            order: { id: 'ASC' },
        });
    }
    async update(id, data) {
        await this.usersRepository.update(id, data);
        return this.findById(id);
    }
    async remove(id) {
        await this.usersRepository.delete(id);
    }
    async create(username, passwordHash, role) {
        const user = this.usersRepository.create({ username, passwordHash, role });
        return this.usersRepository.save(user);
    }
    async createMany(users) {
        const newUsers = this.usersRepository.create(users);
        return this.usersRepository.save(newUsers);
    }
    async updateProfile(userId, data) {
        const user = await this.findById(userId);
        if (!user) {
            return null;
        }
        if (data.nickname !== undefined)
            user.nickname = data.nickname;
        if (data.avatar !== undefined)
            user.avatar = data.avatar;
        if (data.bio !== undefined)
            user.bio = data.bio;
        return this.usersRepository.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(parent_student_relation_entity_1.ParentStudentRelation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map