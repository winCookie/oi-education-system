import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  BINDING_REQUEST = 'binding_request',
  SYSTEM = 'system',
  BLOG_APPROVED = 'blog_approved',
  BLOG_REJECTED = 'blog_rejected',
  BLOG_COMMENT = 'blog_comment',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User; // Recipient

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM
  })
  type: NotificationType;

  @Column({ nullable: true })
  relatedId: number; // e.g., bindingRequestId

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
