import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContestSchedule } from '../../entities/contest-schedule.entity';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(ContestSchedule)
    private scheduleRepository: Repository<ContestSchedule>,
  ) { }

  async findAll(): Promise<ContestSchedule[]> {
    return this.scheduleRepository.find({
      order: { startTime: 'ASC' },
    });
  }

  async findUpcoming(): Promise<ContestSchedule[]> {
    return this.scheduleRepository.find({
      where: [
        // TypeORM logic for upcoming would usually involve a query builder or specific operators
      ],
      order: { startTime: 'ASC' },
    });
  }

  async create(data: Partial<ContestSchedule>): Promise<ContestSchedule> {
    const schedule = this.scheduleRepository.create(data);
    return this.scheduleRepository.save(schedule);
  }

  async update(id: number, data: Partial<ContestSchedule>): Promise<ContestSchedule | null> {
    await this.scheduleRepository.update(id, data);
    return this.scheduleRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.scheduleRepository.delete(id);
  }
}
