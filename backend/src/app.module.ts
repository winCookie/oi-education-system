import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { KnowledgePoint } from './entities/knowledge-point.entity';
import { Problem } from './entities/problem.entity';
import { StudentProgress } from './entities/student-progress.entity';
import { ContestSchedule } from './entities/contest-schedule.entity';
import { BindingRequest } from './entities/binding-request.entity';
import { Notification } from './entities/notification.entity';
import { ParentStudentRelation } from './entities/parent-student-relation.entity';
import { StudentReport } from './entities/student-report.entity';
import { BlogPost } from './entities/blog-post.entity';
import { BlogCategory } from './entities/blog-category.entity';
import { BlogTag } from './entities/blog-tag.entity';
import { BlogComment } from './entities/blog-comment.entity';
import { BlogLike } from './entities/blog-like.entity';
import { BlogFavorite } from './entities/blog-favorite.entity';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { ProgressModule } from './modules/progress/progress.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BlogModule } from './modules/blog/blog.module';
import { LuoguModule } from './modules/luogu/luogu.module';
import { GespModule } from './modules/gesp/gesp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [User, KnowledgePoint, Problem, StudentProgress, ContestSchedule, BindingRequest, Notification, ParentStudentRelation, StudentReport, BlogPost, BlogCategory, BlogTag, BlogComment, BlogLike, BlogFavorite],
        synchronize: true, // Only for development!
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: (configService.get<number>('THROTTLE_TTL') || 60) * 1000,
          limit: configService.get<number>('THROTTLE_LIMIT') || 120,
        },
      ],
    }),
    NestScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    KnowledgeModule,
    ProgressModule,
    ScheduleModule,
    NotificationsModule,
    ReportsModule,
    BlogModule,
    LuoguModule,
    GespModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
