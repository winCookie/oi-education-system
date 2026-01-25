import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum ReportStatus {
  DRAFT = 'draft',
  SENT = 'sent',
}

export enum GroupType {
  CSPJ = 'CSP-J 入门组',
  CSPS = 'CSP-S 提高组',
  NOIP = 'NOIP 省选',
}

@Entity('student_reports')
export class StudentReport {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column()
  studentName: string;

  @Column({ nullable: true })
  stage: string;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: GroupType,
    nullable: true,
  })
  groupType: GroupType;

  @Column({ type: 'json', nullable: true })
  knowledgeModules: Array<{ name: string; score: number }>;

  @Column({ type: 'json', nullable: true })
  trainingData: Array<{ difficulty: string; count: number }>;

  @Column({ type: 'json', nullable: true })
  abilityScores: Array<{ module: string; score: number }>;

  @Column({ type: 'text', nullable: true })
  coachComments: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.DRAFT,
  })
  status: ReportStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
