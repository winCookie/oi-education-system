import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogPost } from '../../entities/blog-post.entity';
import { BlogCategory } from '../../entities/blog-category.entity';
import { BlogTag } from '../../entities/blog-tag.entity';
import { BlogComment } from '../../entities/blog-comment.entity';
import { BlogLike } from '../../entities/blog-like.entity';
import { BlogFavorite } from '../../entities/blog-favorite.entity';
import { User } from '../../entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlogPost,
      BlogCategory,
      BlogTag,
      BlogComment,
      BlogLike,
      BlogFavorite,
      User,
    ]),
    NotificationsModule,
  ],
  controllers: [BlogController],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule { }
