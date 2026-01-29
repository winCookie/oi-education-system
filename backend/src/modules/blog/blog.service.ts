import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { BlogPost, PostStatus } from '../../entities/blog-post.entity';
import { BlogCategory } from '../../entities/blog-category.entity';
import { BlogTag } from '../../entities/blog-tag.entity';
import { BlogComment } from '../../entities/blog-comment.entity';
import { BlogLike } from '../../entities/blog-like.entity';
import { BlogFavorite } from '../../entities/blog-favorite.entity';
import { User, UserRole } from '../../entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../entities/notification.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private postRepository: Repository<BlogPost>,
    @InjectRepository(BlogCategory)
    private categoryRepository: Repository<BlogCategory>,
    @InjectRepository(BlogTag)
    private tagRepository: Repository<BlogTag>,
    @InjectRepository(BlogComment)
    private commentRepository: Repository<BlogComment>,
    @InjectRepository(BlogLike)
    private likeRepository: Repository<BlogLike>,
    @InjectRepository(BlogFavorite)
    private favoriteRepository: Repository<BlogFavorite>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) { }

  // 文章管理
  async createPost(userId: number, createDto: CreatePostDto) {
    const author = await this.userRepository.findOne({ where: { id: userId } });
    if (!author) {
      throw new NotFoundException('用户不存在');
    }

    const post = this.postRepository.create({
      title: createDto.title,
      content: createDto.content,
      summary: this.extractSummary(createDto.content),
      author: { id: userId } as User,
      status: PostStatus.DRAFT,
      isOfficial: author.role === UserRole.ADMIN,
      isTeacher: author.role === UserRole.TEACHER,
    });

    if (createDto.categoryId) {
      const category = await this.categoryRepository.findOne({ where: { id: createDto.categoryId } });
      if (category) {
        post.category = category;
      }
    }

    const savedPost = await this.postRepository.save(post);

    if (createDto.tags && createDto.tags.length > 0) {
      await this.addTagsToPost(savedPost.id, createDto.tags);
    }

    return savedPost;
  }

  async updatePost(postId: number, userId: number, updateDto: UpdatePostDto) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['author', 'tags'],
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    if (post.author.id !== userId) {
      throw new ForbiddenException('无权编辑此文章');
    }

    if (post.status === PostStatus.PUBLISHED) {
      throw new BadRequestException('已发布的文章不能修改');
    }

    if (updateDto.title) post.title = updateDto.title;
    if (updateDto.content) {
      post.content = updateDto.content;
      post.summary = this.extractSummary(updateDto.content);
    }

    if (updateDto.categoryId !== undefined) {
      if (updateDto.categoryId) {
        const category = await this.categoryRepository.findOne({ where: { id: updateDto.categoryId } });
        if (category) {
          post.category = category;
        }
      } else {
        post.category = undefined as any;
      }
    }

    const savedPost = await this.postRepository.save(post);

    if (updateDto.tags !== undefined) {
      await this.addTagsToPost(savedPost.id, updateDto.tags);
    }

    return savedPost;
  }

  async deletePost(postId: number, userId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (post.author.id !== userId && user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('无权删除此文章');
    }

    await this.postRepository.remove(post);
    return { success: true };
  }

  async submitForReview(postId: number, userId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    if (post.author.id !== userId) {
      throw new ForbiddenException('无权操作此文章');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 教师和管理员直接发布
    if (user.role === UserRole.TEACHER || user.role === UserRole.ADMIN) {
      post.status = PostStatus.PUBLISHED;
      post.publishedAt = new Date();
    } else {
      // 学生提交审核
      post.status = PostStatus.PENDING;
      post.submittedAt = new Date();
    }

    return this.postRepository.save(post);
  }

  async getMyPosts(userId: number, status?: PostStatus) {
    const where: any = { author: { id: userId } };
    if (status) {
      where.status = status;
    }

    return this.postRepository.find({
      where,
      relations: ['category', 'tags', 'author'],
      order: { createdAt: 'DESC' },
    });
  }

  // 审核管理
  async getPendingPosts() {
    return this.postRepository.find({
      where: { status: PostStatus.PENDING },
      relations: ['author', 'category', 'tags'],
      order: { submittedAt: 'DESC' },
    });
  }

  async approvePost(postId: number, reviewerId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    if (post.status !== PostStatus.PENDING) {
      throw new BadRequestException('只能审核待审核状态的文章');
    }

    post.status = PostStatus.PUBLISHED;
    post.reviewedAt = new Date();
    post.reviewedBy = { id: reviewerId } as User;
    post.publishedAt = new Date();

    const savedPost = await this.postRepository.save(post);

    // 发送通知
    await this.notificationsService.createNotification(
      post.author.id,
      '文章审核通过',
      `您的文章《${post.title}》已通过审核并发布。`,
      NotificationType.BLOG_APPROVED,
      postId,
    );

    return savedPost;
  }

  async rejectPost(postId: number, reviewerId: number, reason: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    if (post.status !== PostStatus.PENDING) {
      throw new BadRequestException('只能审核待审核状态的文章');
    }

    post.status = PostStatus.REJECTED;
    post.reviewedAt = new Date();
    post.reviewedBy = { id: reviewerId } as User;
    post.rejectReason = reason;

    const savedPost = await this.postRepository.save(post);

    // 发送通知
    await this.notificationsService.createNotification(
      post.author.id,
      '文章审核未通过',
      `您的文章《${post.title}》未通过审核。原因：${reason}`,
      NotificationType.BLOG_REJECTED,
      postId,
    );

    return savedPost;
  }

  // 文章查询
  async getPublishedPosts(query: {
    page?: number;
    limit?: number;
    categoryId?: number;
    tagId?: number;
    search?: string;
    authorId?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { status: PostStatus.PUBLISHED };

    if (query.categoryId) {
      where.category = { id: query.categoryId };
    }

    if (query.authorId) {
      where.author = { id: query.authorId };
    }

    if (query.search) {
      where.title = ILike(`%${query.search}%`);
    }

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tags')
      .where('post.status = :status', { status: PostStatus.PUBLISHED })
      .orderBy('post.isPinned', 'DESC')
      .addOrderBy('post.publishedAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.categoryId) {
      queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    if (query.authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId: query.authorId });
    }

    if (query.search) {
      queryBuilder.andWhere('post.title ILIKE :search', { search: `%${query.search}%` });
    }

    if (query.tagId) {
      queryBuilder.andWhere('tags.id = :tagId', { tagId: query.tagId });
    }

    const [posts, total] = await queryBuilder.getManyAndCount();

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPostDetail(postId: number, userId?: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['author', 'category', 'tags', 'reviewedBy'],
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 未发布的文章只有作者和管理员可以查看
    if (post.status !== PostStatus.PUBLISHED) {
      if (!userId) {
        throw new ForbiddenException('请先登录');
      }
      
      if (post.author.id !== userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user || user.role !== UserRole.ADMIN) {
          throw new ForbiddenException('无权查看此文章');
        }
      }
    }

    // 增加阅读量（使用localStorage防止重复）
    if (post.status === PostStatus.PUBLISHED) {
      post.viewCount += 1;
      await this.postRepository.save(post);
    }

    // 检查用户是否点赞和收藏
    let isLiked = false;
    let isFavorited = false;

    if (userId) {
      const like = await this.likeRepository.findOne({
        where: { user: { id: userId }, post: { id: postId } },
      });
      isLiked = !!like;

      const favorite = await this.favoriteRepository.findOne({
        where: { user: { id: userId }, post: { id: postId } },
      });
      isFavorited = !!favorite;
    }

    return {
      ...post,
      isLiked,
      isFavorited,
    };
  }

  async getRelatedPosts(postId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['category', 'tags'],
    });

    if (!post) {
      return [];
    }

    // 相同分类或有相同标签的文章
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tags')
      .where('post.status = :status', { status: PostStatus.PUBLISHED })
      .andWhere('post.id != :postId', { postId });

    if (post.category) {
      queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId: post.category.id });
    }

    const posts = await queryBuilder.take(5).getMany();

    return posts;
  }

  async getHotPosts() {
    return this.postRepository.find({
      where: { status: PostStatus.PUBLISHED },
      relations: ['author', 'category'],
      order: { viewCount: 'DESC', likeCount: 'DESC' },
      take: 10,
    });
  }

  // 互动功能
  async likePost(postId: number, userId: number) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    const existingLike = await this.likeRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    if (existingLike) {
      // 取消点赞
      await this.likeRepository.remove(existingLike);
      post.likeCount = Math.max(0, post.likeCount - 1);
      await this.postRepository.save(post);
      return { liked: false, likeCount: post.likeCount };
    } else {
      // 点赞
      const like = this.likeRepository.create({
        user: { id: userId } as User,
        post: { id: postId } as BlogPost,
      });
      await this.likeRepository.save(like);
      post.likeCount += 1;
      await this.postRepository.save(post);
      return { liked: true, likeCount: post.likeCount };
    }
  }

  async favoritePost(postId: number, userId: number, note?: string) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    const existingFavorite = await this.favoriteRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    if (existingFavorite) {
      // 取消收藏
      await this.favoriteRepository.remove(existingFavorite);
      post.favoriteCount = Math.max(0, post.favoriteCount - 1);
      await this.postRepository.save(post);
      return { favorited: false, favoriteCount: post.favoriteCount };
    } else {
      // 收藏
      const favorite = this.favoriteRepository.create({
        user: { id: userId } as User,
        post: { id: postId } as BlogPost,
        note: note || '',
      });
      await this.favoriteRepository.save(favorite);
      post.favoriteCount += 1;
      await this.postRepository.save(post);
      return { favorited: true, favoriteCount: post.favoriteCount };
    }
  }

  async addComment(postId: number, userId: number, createDto: CreateCommentDto) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['author'],
    });
    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    const comment = this.commentRepository.create({
      post: { id: postId } as BlogPost,
      author: { id: userId } as User,
      content: createDto.content,
    });

    if (createDto.parentCommentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: createDto.parentCommentId },
      });
      if (parentComment) {
        comment.parentComment = parentComment;
      }
    }

    const savedComment = await this.commentRepository.save(comment);

    post.commentCount += 1;
    await this.postRepository.save(post);

    // 通知文章作者
    if (post.author.id !== userId) {
      await this.notificationsService.createNotification(
        post.author.id,
        '新评论',
        `有人评论了您的文章《${post.title}》`,
        NotificationType.BLOG_COMMENT,
        postId,
      );
    }

    return savedComment;
  }

  async getComments(postId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.commentRepository.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.post = :postId', { postId })
      .andWhere('comment.parentComment IS NULL')
      .andWhere('comment.isDeleted = false')
      .orderBy('comment.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [comments, total] = await queryBuilder.getManyAndCount();

    // 获取每个评论的回复
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await this.commentRepository.find({
          where: { parentComment: { id: comment.id }, isDeleted: false },
          relations: ['author'],
          order: { createdAt: 'ASC' },
        });
        return { ...comment, replies };
      }),
    );

    return {
      comments: commentsWithReplies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async likeComment(commentId: number, userId: number) {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 简单实现：直接增减点赞数（实际应该用单独的表记录）
    comment.likeCount += 1;
    await this.commentRepository.save(comment);

    return { likeCount: comment.likeCount };
  }

  async deleteComment(commentId: number, userId: number) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['author', 'post'],
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (comment.author.id !== userId && user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('无权删除此评论');
    }

    comment.isDeleted = true;
    await this.commentRepository.save(comment);

    // 更新文章评论数
    const post = await this.postRepository.findOne({ where: { id: comment.post.id } });
    if (post) {
      post.commentCount = Math.max(0, post.commentCount - 1);
      await this.postRepository.save(post);
    }

    return { success: true };
  }

  // 分类标签
  async getCategories() {
    return this.categoryRepository.find({ order: { sort: 'ASC', createdAt: 'ASC' } });
  }

  async getTags() {
    return this.tagRepository.find({ order: { usageCount: 'DESC', name: 'ASC' } });
  }

  async createCategory(adminId: number, createDto: CreateCategoryDto) {
    const user = await this.userRepository.findOne({ where: { id: adminId } });
    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只有管理员可以创建分类');
    }

    const category = this.categoryRepository.create(createDto);
    return this.categoryRepository.save(category);
  }

  async updateCategory(categoryId: number, adminId: number, updateDto: CreateCategoryDto) {
    const user = await this.userRepository.findOne({ where: { id: adminId } });
    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只有管理员可以修改分类');
    }

    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    Object.assign(category, updateDto);
    return this.categoryRepository.save(category);
  }

  async deleteCategory(categoryId: number, adminId: number) {
    const user = await this.userRepository.findOne({ where: { id: adminId } });
    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只有管理员可以删除分类');
    }

    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    await this.categoryRepository.remove(category);
    return { success: true };
  }

  // 辅助方法
  private extractSummary(content: string): string {
    const plainText = content.replace(/[#*`\[\]()]/g, '').trim();
    return plainText.substring(0, 200);
  }

  private async addTagsToPost(postId: number, tagNames: string[]) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['tags'],
    });

    if (!post) return;

    const tags: BlogTag[] = [];
    for (const tagName of tagNames) {
      let tag = await this.tagRepository.findOne({ where: { name: tagName } });
      if (!tag) {
        tag = this.tagRepository.create({ name: tagName, usageCount: 0 });
        tag = await this.tagRepository.save(tag);
      }
      tag.usageCount += 1;
      await this.tagRepository.save(tag);
      tags.push(tag);
    }

    post.tags = tags;
    await this.postRepository.save(post);
  }
}
