import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { BlogPost } from './blog-post.entity';

@Entity('blog_likes')
export class BlogLike {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => BlogPost)
  post: BlogPost;

  @CreateDateColumn()
  createdAt: Date;
}
