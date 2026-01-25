import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { KnowledgePoint } from './knowledge-point.entity';

@Entity('problems')
export class Problem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  contentMd: string;

  @Column({ type: 'text', nullable: true })
  templateCpp: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ type: 'timestamp', nullable: true })
  videoUpdatedAt: Date | null;

  @ManyToOne(() => KnowledgePoint, (kp) => kp.problems)
  knowledgePoint: KnowledgePoint;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
