import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { BlogPost } from './blog-post.entity';

@Entity('blog_comments')
export class BlogComment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BlogPost)
  post: BlogPost;

  @ManyToOne(() => User)
  author: User;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => BlogComment, { nullable: true })
  parentComment: BlogComment;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
