import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';

import { ParentStudentRelation } from '../../entities/parent-student-relation.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ParentStudentRelation)
    private relationRepository: Repository<ParentStudentRelation>,
  ) { }

  async findParentRelations(parentId: number) {
    return this.relationRepository.find({
      where: { parent: { id: parentId } },
      relations: ['student']
    });
  }

  async isBound(parentId: number, studentId: number): Promise<boolean> {
    const count = await this.relationRepository.count({
      where: { parent: { id: parentId }, student: { id: studentId } }
    });
    return count > 0;
  }

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'username', 'role', 'createdAt'],
      order: { id: 'ASC' },
    });
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    await this.usersRepository.update(id, data);
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async create(username: string, passwordHash: string, role: UserRole): Promise<User> {
    const user = this.usersRepository.create({ username, passwordHash, role });
    return this.usersRepository.save(user);
  }

  async createMany(users: { username: string; passwordHash: string; role: UserRole }[]): Promise<User[]> {
    const newUsers = this.usersRepository.create(users);
    return this.usersRepository.save(newUsers);
  }
}
