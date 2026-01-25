import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

export enum BindingStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

@Entity('binding_requests')
export class BindingRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  parent: User;

  @ManyToOne(() => User)
  student: User;

  @Column({
    type: 'enum',
    enum: BindingStatus,
    default: BindingStatus.PENDING
  })
  status: BindingStatus;

  @CreateDateColumn()
  createdAt: Date;
}
