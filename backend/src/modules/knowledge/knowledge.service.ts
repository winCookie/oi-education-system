import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { KnowledgePoint, KnowledgeGroup } from '../../entities/knowledge-point.entity';
import { Problem } from '../../entities/problem.entity';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(KnowledgePoint)
    private kpRepository: Repository<KnowledgePoint>,
    @InjectRepository(Problem)
    private problemRepository: Repository<Problem>,
  ) { }

  async findAllByGroup(group: KnowledgeGroup): Promise<KnowledgePoint[]> {
    return this.kpRepository.find({
      where: { group },
      select: ['id', 'title', 'category', 'group'],
      order: { id: 'ASC' },
    });
  }

  async search(query: string): Promise<KnowledgePoint[]> {
    return this.kpRepository.find({
      where: [
        { title: Like(`%${query}%`) },
        { category: Like(`%${query}%`) },
      ],
      select: ['id', 'title', 'category', 'group'],
    });
  }

  async findOne(id: number): Promise<KnowledgePoint | null> {
    return this.kpRepository.findOne({
      where: { id },
      relations: ['problems'],
    });
  }

  async create(data: Partial<KnowledgePoint>): Promise<KnowledgePoint> {
    const kp = this.kpRepository.create(data);
    return this.kpRepository.save(kp);
  }

  async addProblem(kpId: number, problemData: Partial<Problem>): Promise<Problem> {
    const kp = await this.kpRepository.findOne({ where: { id: kpId } });
    if (!kp) throw new Error('Knowledge point not found');
    const problem = this.problemRepository.create({
      ...problemData,
      knowledgePoint: kp,
      videoUpdatedAt: problemData.videoUrl ? new Date() : null,
    } as any);
    return this.problemRepository.save(problem as any);
  }

  async findAll(): Promise<KnowledgePoint[]> {
    return this.kpRepository.find({
      select: ['id', 'title', 'category', 'group'],
      order: { id: 'ASC' },
    });
  }

  async update(id: number, data: Partial<KnowledgePoint>): Promise<KnowledgePoint | null> {
    await this.kpRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.kpRepository.delete(id);
  }

  async updateProblem(id: number, data: Partial<Problem>): Promise<Problem | null> {
    const existing = await this.problemRepository.findOne({ where: { id } });
    if (existing && data.videoUrl && data.videoUrl !== existing.videoUrl) {
      data.videoUpdatedAt = new Date();
    }
    await this.problemRepository.update(id, data as any);
    return this.problemRepository.findOne({ where: { id } });
  }

  async deleteProblem(id: number): Promise<void> {
    await this.problemRepository.delete(id);
  }
}
