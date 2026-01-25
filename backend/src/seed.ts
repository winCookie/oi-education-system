import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './modules/auth/auth.service';
import { UserRole } from './entities/user.entity';
import { KnowledgeService } from './modules/knowledge/knowledge.service';
import { KnowledgeGroup } from './entities/knowledge-point.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const knowledgeService = app.get(KnowledgeService);

  console.log('--- Starting Seeding ---');

  // 1. Seed Users
  console.log('Seeding initial users...');
  try {
    await authService.register('teacher01', 'password123', UserRole.TEACHER);
    console.log('Teacher created: teacher01 / password123');
  } catch (error) {
    console.log('Teacher seeding skipped (exists).');
  }

  try {
    await authService.register('student01', 'password123', UserRole.STUDENT);
    console.log('Student created: student01 / password123');
  } catch (error) {
    console.log('Student seeding skipped (exists).');
  }

  try {
    await authService.register('admin', 'admin123', UserRole.ADMIN);
    console.log('Super Admin created: admin / admin123');
  } catch (error) {
    console.log('Admin seeding skipped (exists).');
  }

  // 2. Seed Knowledge Points
  console.log('Seeding knowledge points...');
  const kps = [
    // 语法 (Syntax)
    { title: '1.1 程序设计的目标和流程', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 1.1 程序设计的目标和流程\n学习编程的基本目标是解决问题。基本流程包括：分析问题、设计算法、编写程序、调试运行。' },
    { title: '1.2 简单数学运算、变量与常量', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 1.2 简单数学运算、变量与常量\n介绍基本的算术运算符（+ - * / %）以及如何在 C++ 中定义变量和常量。' },
    { title: '2.1 变量的数据类型、输入与输出', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 2.1 变量的数据类型、输入与输出\n掌握 int, double, char, bool 等基本类型，学习 cin 和 cout。' },
    { title: '2.2 顺序结构程序、错误自查', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 2.2 顺序结构程序、错误自查\n程序按顺序执行。学习常见的编译错误和逻辑错误排查。' },
    { title: '3.1 分支语句、关系&逻辑表达式', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 3.1 分支语句、关系&逻辑表达式\n学习 if-else 结构，关系运算符（> < ==）和逻辑运算符（&& || !）。' },
    { title: '3.2 分支嵌套、分支程序设计案例', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 3.2 分支嵌套、分支程序设计案例\n多层 if 嵌套的使用场景，以及 switch 语句。' },
    { title: '4.1 for 语句和 while 语句', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 4.1 for 语句和 while 语句\n学习 C++ 中的循环控制，掌握循环的三要素。' },
    { title: '4.2 多重循环', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 4.2 多重循环\n循环中嵌套循环，常用于处理二维数据或组合问题。' },
    { title: '4.3 循环结构程序设计案例', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 4.3 循环结构程序设计案例\n经典案例：打印图形、求素数、水仙花数等。' },
    { title: '5.1 一维数组', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 5.1 一维数组\n学习如何存储一批相同类型的数据，掌握数组的定义、初始化和访问。' },
    { title: '5.2 多维数组', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 5.2 多维数组\n二维数组的定义与应用，常用于棋盘或矩阵运算。' },
    { title: '5.3 前缀和、数组应用案例', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 5.3 前缀和、数组应用案例\n前缀和是一种重要的数组预处理技巧，用于快速求区间和。' },
    { title: '6.1 字符数组', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 6.1 字符数组\n使用 char 数组存储字符串，学习常见的 C 风格字符串函数。' },
    { title: '6.2 string 类型字符串', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 6.2 string 类型字符串\n学习 C++ 标准库中的 string 类，掌握其便捷的操作方法。' },
    { title: '7.1 定义子程序', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 7.1 定义子程序\n函数（Function）的定义与调用，实现代码的模块化。' },
    { title: '7.2 变量作用域与参数传递', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 7.2 变量作用域与参数传递\n全局变量与局部变量的区别，值传递与引用传递。' },
    { title: '7.3 递归函数', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 7.3 递归函数\n函数调用自身。掌握递归边界和递归方程。' },
    { title: '7.4 结构体的使用', group: KnowledgeGroup.PRIMARY, category: '语法', contentMd: '# 7.4 结构体的使用\nstruct 的定义，用于存储不同类型数据的集合。' },

    // 基础算法 (Basic Algorithms)
    { title: '8.1 模拟方法问题实例', group: KnowledgeGroup.PRIMARY, category: '基础算法', contentMd: '# 8.1 模拟方法问题实例\n按照题目描述的过程，用代码一步步重现。' },
    { title: '8.2 高精度运算', group: KnowledgeGroup.PRIMARY, category: '基础算法', contentMd: '# 8.2 高精度运算\n处理超出 long long 范围的大整数加减乘除。' },
    { title: '9.1 计数排序、选择排序', group: KnowledgeGroup.PRIMARY, category: '基础算法', contentMd: '# 9.1 计数排序、选择排序\n理解基础排序算法的原理与 $O(n^2)$ 或 $O(n+max)$ 的复杂度。' },
    { title: '9.2 冒泡排序、插入排序', group: KnowledgeGroup.PRIMARY, category: '基础算法', contentMd: '# 9.2 冒泡排序、插入排序\n经典排序算法，理解交换和插入的思想。' },
    { title: '10.1 循环枚举', group: KnowledgeGroup.PRIMARY, category: '基础算法', contentMd: '# 10.1 循环枚举\n通过循环尝试所有可能的解。' },
    { title: '10.2 子集枚举', group: KnowledgeGroup.PRIMARY, category: '基础算法', contentMd: '# 10.2 子集枚举\n枚举一个集合的所有子集，通常与位运算结合。' },
    { title: '11.1 递推思想', group: KnowledgeGroup.PRIMARY, category: '基础算法', contentMd: '# 11.1 递推思想\n从已知初始值出发，按规律推导出后续值。' },
    { title: '11.2 递归与分治思想', group: KnowledgeGroup.PRIMARY, category: '基础算法', contentMd: '# 11.2 递归与分治思想\n将大问题分解为小问题解决，掌握分治的三个步骤。' },
    { title: '11.3 快速排序与递归综合练习', group: KnowledgeGroup.PRIMARY, category: '基础算法', contentMd: '# 11.3 快速排序与递归综合练习\n深入理解快排原理及其递归实现。' },
    { title: '12.1 贪心与证明', group: KnowledgeGroup.PRIMARY, category: '基础算法', contentMd: '# 12.1 贪心与证明\n每次选择局部最优解。学习如何证明贪心策略的正确性。' },
    { title: '12.2 哈夫曼编码与优先队列', group: KnowledgeGroup.PRIMARY, category: '基础算法', contentMd: '# 12.2 哈夫曼编码与优先队列\n贪心算法的经典应用，掌握优先队列（堆）的使用。' },
    { title: '13.1 二分查找', group: KnowledgeGroup.PRIMARY, category: '基础算法', contentMd: '# 13.1 二分查找\n在有序序列中通过折半缩小范围，效率为 $O(\\log n)$。' },
    { title: '13.2 二分答案', group: KnowledgeGroup.PRIMARY, category: '基础算法', contentMd: '# 13.2 二分答案\n将最优化问题转化为判定性问题，利用二分搜索寻找最优值。' },
    { title: '15.1 深度优先搜索与回溯法', group: KnowledgeGroup.PRIMARY, category: '基础算法', contentMd: '# 15.1 深度优先搜索与回溯法\nDFS 遍历所有可能路径。学习如何进行状态回溯和剪枝。' },
    { title: '15.2 广度优先搜索', group: KnowledgeGroup.PRIMARY, category: '基础算法', contentMd: '# 15.2 广度优先搜索\nBFS 逐层扩展。常用于寻找权值为 1 的图的最短路径。' },
    { title: '15.3 搜索的综合应用', group: KnowledgeGroup.PRIMARY, category: '基础算法', contentMd: '# 15.3 搜索的综合应用\nDFS 与 BFS 的综合应用及对比。' },

    // 数据结构 (Data Structures)
    { title: '14.1 动态数组', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 14.1 动态数组\n学习 C++ STL 中的 vector，掌握其动态扩容机制。' },
    { title: '14.2 栈、队列', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 14.2 栈、队列\n栈（LIFO）与队列（FIFO）的概念及 STL stack/queue 的使用。' },
    { title: '14.3 链表', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 14.3 链表\n理解指针或数组实现的链表，掌握插入、删除操作。' },
    { title: '16.1 二叉树的概念和建立', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 16.1 二叉树的概念和建立\n了解二叉树的定义、性质及存储方式。' },
    { title: '16.2 二叉树的遍历', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 16.2 二叉树的遍历\n掌握先序、中序、后序和层序遍历。' },
    { title: '16.3 二叉树的综合应用', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 16.3 二叉树的综合应用\n二叉树相关算法的练习。' },
    { title: '17.1 并查集', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 17.1 并查集\n维护集合的合并与查询。掌握路径压缩优化。' },
    { title: '17.2 Hash 表', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 17.2 Hash 表\n利用哈希函数实现快速查找。' },
    { title: '17.3 集合应用实例', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 17.3 集合应用实例\n并查集与 Hash 表的实战案例。' },
    { title: '18.1 图的概念和建立', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 18.1 图的概念和建立\n理解图、顶点、边。掌握邻接矩阵和邻接表的存储方式。' },
    { title: '18.2 图的遍历', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 18.2 图的遍历\n掌握图的 DFS 和 BFS 遍历方法。' },
    { title: '18.3 DAG 与拓扑排序', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 18.3 DAG 与拓扑排序\n有向无环图（DAG）的性质及其拓扑序列的生成。' },
    { title: '18.4 常见的 STL 容器使用', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 18.4 常见的 STL 容器使用\n复习 set, map, priority_queue 等容器的用法。' },
    { title: '19.1 初始动态规划及问题特性', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 19.1 初始动态规划及问题特性\n理解 DP 的核心：状态、转移、边界。掌握最优子结构和无后效性。' },
    { title: '19.2 记忆化搜索', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 19.2 记忆化搜索\n通过数组记录已计算过的状态，避免递归重复计算。' },
    { title: '19.3 0-1 背包问题', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 19.3 0-1 背包问题\n经典 DP 模型：每种物品仅一件，选或不选。' },
    { title: '19.4 完全背包', group: KnowledgeGroup.PRIMARY, category: '数据结构', contentMd: '# 19.4 完全背包\nDP 模型扩展：每种物品有无限件。' },

    // 数学数论 (Math & Number Theory)
    { title: '20.1 各种进制', group: KnowledgeGroup.PRIMARY, category: '数学数论', contentMd: '# 20.1 各种进制\n掌握二进制、八进制、十六进制与十进制的转换。' },
    { title: '20.2 二进制的深入探究', group: KnowledgeGroup.PRIMARY, category: '数学数论', contentMd: '# 20.2 二进制的深入探究\n理解补码、反码及二进制运算。' },
    { title: '20.3 逻辑命题与位运算', group: KnowledgeGroup.PRIMARY, category: '数学数论', contentMd: '# 20.3 逻辑命题与位运算\n位运算符（& | ^ ~ << >>）的应用技巧。' },
    { title: '21.1 加法原理和乘法原理', group: KnowledgeGroup.PRIMARY, category: '数学数论', contentMd: '# 21.1 加法原理和乘法原理\n组合计数的基础：分类加法，分步乘法。' },
    { title: '21.2 排列与组合', group: KnowledgeGroup.PRIMARY, category: '数学数论', contentMd: '# 21.2 排列与组合\n理解 $P_n^m$ 和 $C_n^m$ 的定义、公式及性质。' },
    { title: '22.1 整除的基本知识', group: KnowledgeGroup.PRIMARY, category: '数学数论', contentMd: '# 22.1 整除的基本知识\n因数、倍数、整除的性质。' },
    { title: '22.2 质数与合数', group: KnowledgeGroup.PRIMARY, category: '数学数论', contentMd: '# 22.2 质数与合数\n质数的定义。掌握埃氏筛或线性筛法。' },
    { title: '22.3 最大公约数与最小公倍数', group: KnowledgeGroup.PRIMARY, category: '数学数论', contentMd: '# 22.3 最大公约数与最小公倍数\n掌握辗转相除法（欧几里得算法）求 GCD。' },
    { title: '22.4 算术基本定理', group: KnowledgeGroup.PRIMARY, category: '数学数论', contentMd: '# 22.4 算术基本定理\n任何大于 1 的自然数都能唯一分解为质因数的乘积。' },
  ];

  for (const kpData of kps) {
    try {
      const existing = await knowledgeService.search(kpData.title);
      if (existing.length === 0) {
        await knowledgeService.create(kpData);
        console.log(`Knowledge point created: ${kpData.title}`);
      }
    } catch (error) {
      console.log(`Failed to seed KP ${kpData.title}:`, error.message);
    }
  }

  console.log('--- Seeding Completed ---');
  await app.close();
}
bootstrap();
