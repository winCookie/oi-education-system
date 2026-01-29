import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) { }

  // 文章管理
  @Post('posts')
  @UseGuards(JwtAuthGuard)
  async createPost(@Request() req, @Body() createDto: CreatePostDto) {
    return this.blogService.createPost(req.user.id, createDto);
  }

  @Put('posts/:id')
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateDto: UpdatePostDto,
  ) {
    return this.blogService.updatePost(id, req.user.id, updateDto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  async deletePost(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.blogService.deletePost(id, req.user.id);
  }

  @Post('posts/:id/submit')
  @UseGuards(JwtAuthGuard)
  async submitForReview(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.blogService.submitForReview(id, req.user.id);
  }

  @Get('posts/my')
  @UseGuards(JwtAuthGuard)
  async getMyPosts(@Request() req, @Query('status') status?: string) {
    return this.blogService.getMyPosts(req.user.id, status as any);
  }

  // 审核管理
  @Get('posts/pending')
  @UseGuards(JwtAuthGuard)
  async getPendingPosts() {
    return this.blogService.getPendingPosts();
  }

  @Post('posts/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approvePost(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.blogService.approvePost(id, req.user.id);
  }

  @Post('posts/:id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectPost(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body('reason') reason: string,
  ) {
    return this.blogService.rejectPost(id, req.user.id, reason);
  }

  // 文章查询
  @Get('posts')
  async getPublishedPosts(@Query() query: any) {
    return this.blogService.getPublishedPosts({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      categoryId: query.categoryId ? parseInt(query.categoryId) : undefined,
      tagId: query.tagId ? parseInt(query.tagId) : undefined,
      search: query.search,
      authorId: query.authorId ? parseInt(query.authorId) : undefined,
    });
  }

  @Get('posts/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async getPostDetail(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userId = req.user?.id;
    return this.blogService.getPostDetail(id, userId);
  }

  @Get('posts/:id/related')
  async getRelatedPosts(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.getRelatedPosts(id);
  }

  @Get('posts/hot/list')
  async getHotPosts() {
    return this.blogService.getHotPosts();
  }

  // 互动功能
  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  async likePost(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.blogService.likePost(id, req.user.id);
  }

  @Post('posts/:id/favorite')
  @UseGuards(JwtAuthGuard)
  async favoritePost(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body('note') note?: string,
  ) {
    return this.blogService.favoritePost(id, req.user.id, note);
  }

  @Get('posts/:id/comments')
  async getComments(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.blogService.getComments(
      id,
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() createDto: CreateCommentDto,
  ) {
    return this.blogService.addComment(id, req.user.id, createDto);
  }

  @Post('comments/:id/like')
  @UseGuards(JwtAuthGuard)
  async likeComment(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.blogService.likeComment(id, req.user.id);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  async deleteComment(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.blogService.deleteComment(id, req.user.id);
  }

  // 分类标签
  @Get('categories')
  async getCategories() {
    return this.blogService.getCategories();
  }

  @Get('tags')
  async getTags() {
    return this.blogService.getTags();
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard)
  async createCategory(@Request() req, @Body() createDto: CreateCategoryDto) {
    return this.blogService.createCategory(req.user.id, createDto);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard)
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateDto: CreateCategoryDto,
  ) {
    return this.blogService.updateCategory(id, req.user.id, updateDto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard)
  async deleteCategory(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.blogService.deleteCategory(id, req.user.id);
  }
}
