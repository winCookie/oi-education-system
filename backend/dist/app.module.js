"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const user_entity_1 = require("./entities/user.entity");
const knowledge_point_entity_1 = require("./entities/knowledge-point.entity");
const problem_entity_1 = require("./entities/problem.entity");
const student_progress_entity_1 = require("./entities/student-progress.entity");
const contest_schedule_entity_1 = require("./entities/contest-schedule.entity");
const binding_request_entity_1 = require("./entities/binding-request.entity");
const notification_entity_1 = require("./entities/notification.entity");
const parent_student_relation_entity_1 = require("./entities/parent-student-relation.entity");
const student_report_entity_1 = require("./entities/student-report.entity");
const blog_post_entity_1 = require("./entities/blog-post.entity");
const blog_category_entity_1 = require("./entities/blog-category.entity");
const blog_tag_entity_1 = require("./entities/blog-tag.entity");
const blog_comment_entity_1 = require("./entities/blog-comment.entity");
const blog_like_entity_1 = require("./entities/blog-like.entity");
const blog_favorite_entity_1 = require("./entities/blog-favorite.entity");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const knowledge_module_1 = require("./modules/knowledge/knowledge.module");
const progress_module_1 = require("./modules/progress/progress.module");
const schedule_module_1 = require("./modules/schedule/schedule.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const reports_module_1 = require("./modules/reports/reports.module");
const blog_module_1 = require("./modules/blog/blog.module");
const luogu_module_1 = require("./modules/luogu/luogu.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DATABASE_HOST'),
                    port: configService.get('DATABASE_PORT'),
                    username: configService.get('DATABASE_USER'),
                    password: configService.get('DATABASE_PASSWORD'),
                    database: configService.get('DATABASE_NAME'),
                    entities: [user_entity_1.User, knowledge_point_entity_1.KnowledgePoint, problem_entity_1.Problem, student_progress_entity_1.StudentProgress, contest_schedule_entity_1.ContestSchedule, binding_request_entity_1.BindingRequest, notification_entity_1.Notification, parent_student_relation_entity_1.ParentStudentRelation, student_report_entity_1.StudentReport, blog_post_entity_1.BlogPost, blog_category_entity_1.BlogCategory, blog_tag_entity_1.BlogTag, blog_comment_entity_1.BlogComment, blog_like_entity_1.BlogLike, blog_favorite_entity_1.BlogFavorite],
                    synchronize: true,
                }),
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => [
                    {
                        ttl: (configService.get('THROTTLE_TTL') || 60) * 1000,
                        limit: configService.get('THROTTLE_LIMIT') || 10,
                    },
                ],
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            knowledge_module_1.KnowledgeModule,
            progress_module_1.ProgressModule,
            schedule_module_1.ScheduleModule,
            notifications_module_1.NotificationsModule,
            reports_module_1.ReportsModule,
            blog_module_1.BlogModule,
            luogu_module_1.LuoguModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map