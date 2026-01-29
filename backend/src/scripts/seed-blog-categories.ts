import { DataSource } from 'typeorm';
import { BlogCategory } from '../entities/blog-category.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'oi_edu',
  entities: [BlogCategory],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();
  const categoryRepository = AppDataSource.getRepository(BlogCategory);

  const categories = [
    {
      name: '学习笔记',
      description: '记录学习过程中的思考和总结',
      icon: '📚',
      sort: 1,
    },
    {
      name: '解题思路',
      description: '分享题目的解法和思路',
      icon: '💡',
      sort: 2,
    },
    {
      name: '经验分享',
      description: '分享学习和备赛经验',
      icon: '🎓',
      sort: 3,
    },
    {
      name: '竞赛动态',
      description: '竞赛资讯、获奖喜报、赛后总结',
      icon: '🏆',
      sort: 4,
    },
    {
      name: '技术教程',
      description: '工具使用、环境配置、调试技巧',
      icon: '🔧',
      sort: 5,
    },
  ];

  for (const catData of categories) {
    const existing = await categoryRepository.findOne({ where: { name: catData.name } });
    if (!existing) {
      const category = categoryRepository.create(catData);
      await categoryRepository.save(category);
      console.log(`✓ 创建分类: ${catData.name}`);
    } else {
      console.log(`- 分类已存在: ${catData.name}`);
    }
  }

  console.log('\n✓ 博客分类种子数据初始化完成！\n');
  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('种子数据初始化失败:', error);
  process.exit(1);
});
