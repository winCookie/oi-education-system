import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { User } from './user.entity';

@Entity('parent_student_relations')
@Unique(['parent', 'student'])
export class ParentStudentRelation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  parent: User;

  @ManyToOne(() => User)
  student: User;

  @CreateDateColumn()
  createdAt: Date;
}
