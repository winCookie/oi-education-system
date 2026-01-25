import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Problem } from './problem.entity';

export enum KnowledgeGroup {
  PRIMARY = '入门组',
  ADVANCED = '提高组',
}

@Entity('knowledge_points')
export class KnowledgePoint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: KnowledgeGroup,
  })
  group: KnowledgeGroup;

  @Column()
  category: string; // e.g., '数据结构', '图论'

  @Column({ type: 'text', nullable: true })
  contentMd: string;

  @OneToMany(() => Problem, (problem) => problem.knowledgePoint)
  problems: Problem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
