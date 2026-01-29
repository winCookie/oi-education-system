#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
洛谷团队学情分析系统
自动获取团队成员训练数据，并生成月度对比报告
"""

import os
import json
import time
import logging

# 配置日志 - 尽早配置以捕获导入错误
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('luogu_analysis.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

from datetime import datetime
from typing import Dict, List

# 尝试导入 Pandas
try:
    import pandas as pd
except ImportError as e:
    logger.critical(f"缺少依赖库 pandas: {e}")
    print(f"CRITICAL ERROR: {e}")
    exit(1)

# 尝试导入 Selenium 爬虫，如果失败则使用原版
try:
    from luogu_crawler_selenium import LuoguCrawlerSelenium
    SELENIUM_AVAILABLE = True
except ImportError:
    try:
        from luogu_crawler import LuoguCrawler
    except ImportError:
        pass
    SELENIUM_AVAILABLE = False

class LuoguAnalyzer:
    def __init__(self, config_file='config.json', use_selenium=True):
        """
        初始化分析器
        
        Args:
            config_file: 配置文件路径
            use_selenium: 是否使用 Selenium 爬虫（推荐）
        """
        self.config = self._load_config(config_file)
        self.crawler = None
        self.use_selenium = use_selenium and SELENIUM_AVAILABLE
        self.data_dir = 'data'
        self.output_dir = 'reports'
        
        # 创建必要的目录
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
        
        # 提示使用的爬虫类型
        if self.use_selenium:
            logger.info("✓ 使用 Selenium 爬虫（浏览器自动化）")
        else:
            if not SELENIUM_AVAILABLE:
                logger.warning("⚠ Selenium 不可用，使用传统爬虫（功能受限）")
            else:
                logger.info("使用传统爬虫")
    
    def _load_config(self, config_file: str) -> Dict:
        """
        加载配置文件
        """
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                logger.info(f"成功加载配置文件: {config_file}")
                return config
            except Exception as e:
                logger.error(f"加载配置文件失败: {e}")
        
        # 返回默认配置
        default_config = {
            'team_id': '55654',
            'cookies': {
                '__client_id': '',
                '_uid': ''
            },
            'retry_delay': 2,
            'max_retries': 3
        }
        
        # 保存默认配置
        try:
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, ensure_ascii=False, indent=2)
            logger.info(f"已创建默认配置文件: {config_file}")
            logger.warning("请在 config.json 中设置您的 Cookie 信息")
        except Exception as e:
            logger.error(f"保存配置文件失败: {e}")
        
        return default_config
    
    def initialize_crawler(self):
        """
        初始化爬虫（使用配置中的 Cookie）
        """
        cookies = self.config.get('cookies', {})
        
        # 检查 Cookie 是否配置
        if not cookies.get('__client_id') or not cookies.get('_uid'):
            logger.warning("未配置 Cookie，将使用无认证模式（功能受限）")
            if self.use_selenium:
                self.crawler = LuoguCrawlerSelenium(headless=True, config=self.config)
            else:
                self.crawler = LuoguCrawler()
        else:
            if self.use_selenium:
                # 使用 Selenium 爬虫（headless 模式）
                self.crawler = LuoguCrawlerSelenium(cookies=cookies, headless=True, config=self.config)
                logger.info("已使用 Cookie 初始化 Selenium 爬虫")
            else:
                # 使用传统爬虫
                self.crawler = LuoguCrawler(cookies=cookies)
                logger.info("已使用 Cookie 初始化传统爬虫")
    
    def fetch_team_data(self, limit: int = None) -> pd.DataFrame:
        """
        获取团队所有成员的训练数据
        
        Args:
            limit: 限制获取的成员数量（用于测试）
            
        Returns:
            包含所有成员数据的 DataFrame
        """
        if not self.crawler:
            self.initialize_crawler()
        
        team_id = self.config.get('team_id', '55654')
        logger.info(f"开始获取团队 {team_id} 的数据...")
        
        # 获取团队成员列表
        members = self.crawler.get_team_members(team_id)
        
        if not members:
            logger.error("无法获取团队成员列表，请检查 Cookie 配置")
            return pd.DataFrame()
        
        # 应用限制
        if limit:
            logger.info(f"测试模式：仅获取前 {limit} 名成员的数据")
            members = members[:limit]
        
        logger.info(f"团队共有 {len(members)} 名成员")
        
        # 获取每个成员的训练数据
        data_records = []
        retry_delay = self.config.get('retry_delay', 2)
        
        for i, member in enumerate(members, 1):
            uid = member['uid']
            username = member['username']
            
            logger.info(f"[{i}/{len(members)}] 正在获取 {username}({uid}) 的数据...")
            
            try:
                practice_data = self.crawler.get_detailed_practice(str(uid))
                
                if practice_data:
                    record = {
                        'uid': uid,
                        'username': username,
                        'realname': member.get('realname', ''),  # 真实姓名（需手动填写）
                        'is_hidden': practice_data.get('is_hidden', False),
                        'rating': practice_data.get('rating', 0),
                    }
                    
                    # 添加各难度题目数（使用中文列名）
                    difficulty_names = {
                        1: '入门',
                        2: '普及−',
                        3: '普及/提高−',
                        4: '普及+/提高',
                        5: '提高+/省选−',
                        6: '省选/NOI−',
                        7: 'NOI/NOI+/CTSC'
                    }
                    
                    for diff in range(1, 8):
                        chinese_name = difficulty_names[diff]
                        record[chinese_name] = practice_data.get(f'difficulty{diff}', 0)
                    
                    # 计算总题数
                    record['total'] = sum(practice_data.get(f'difficulty{diff}', 0) for diff in range(1, 8))
                    
                    data_records.append(record)
                    logger.info(f"  ✓ 成功获取（共 {record['total']} 题）")
                else:
                    logger.warning(f"  ✗ 获取失败，跳过")
                
                # 避免请求过快
                time.sleep(retry_delay)
                
            except Exception as e:
                logger.error(f"  ✗ 获取 {username}({uid}) 数据时出错: {e}")
                continue
        
        # 转换为 DataFrame
        df = pd.DataFrame(data_records)
        logger.info(f"成功获取 {len(df)} 名成员的数据")
        
        # 如果使用 Selenium，关闭浏览器
        if self.use_selenium and hasattr(self.crawler, 'close'):
            self.crawler.close()
            logger.info("浏览器已关闭")
        
        return df
    
    def save_monthly_data(self, df: pd.DataFrame, month: str = None, is_test: bool = False):
        """
        保存月度数据到 Excel
        
        Args:
            df: 数据 DataFrame
            month: 月份标识（如 '202601'），不指定则使用当前月份
            is_test: 是否为测试数据
        """
        if month is None:
            month = datetime.now().strftime('%Y%m')
        
        prefix = "test_stats" if is_test else "monthly_stats"
        filename = f"{prefix}_{month}.xlsx"
        filepath = os.path.join(self.data_dir, filename)
        
        try:
            # 保存为 Excel
            with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='训练统计', index=False)
            
            logger.info(f"数据已保存到: {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"保存数据失败: {e}")
            return None
    
    def load_monthly_data(self, month: str) -> pd.DataFrame:
        """
        加载指定月份的数据
        
        Args:
            month: 月份标识（如 '202601'）
            
        Returns:
            数据 DataFrame，不存在则返回空 DataFrame
        """
        filename = f"monthly_stats_{month}.xlsx"
        filepath = os.path.join(self.data_dir, filename)
        
        if not os.path.exists(filepath):
            logger.warning(f"月度数据文件不存在: {filepath}")
            return pd.DataFrame()
        
        try:
            df = pd.read_excel(filepath, sheet_name='训练统计')
            logger.info(f"成功加载 {month} 月数据（{len(df)} 名成员）")
            return df
        except Exception as e:
            logger.error(f"加载月度数据失败: {e}")
            return pd.DataFrame()
    
    def generate_growth_report(self, current_month: str, previous_month: str):
        """
        生成月度增长报告
        
        Args:
            current_month: 当前月份（如 '202601'）
            previous_month: 上个月份（如 '202512'）
        """
        logger.info(f"生成增长报告: {previous_month} -> {current_month}")
        
        # 加载数据
        current_df = self.load_monthly_data(current_month)
        previous_df = self.load_monthly_data(previous_month)
        
        if current_df.empty:
            logger.error(f"当前月份 {current_month} 数据不存在")
            return
        
        if previous_df.empty:
            logger.warning(f"上月 {previous_month} 数据不存在，仅生成当前数据报告")
            self._generate_current_report(current_df, current_month)
            return
        
        # 合并数据进行对比
        merged_df = pd.merge(
            current_df, 
            previous_df, 
            on='uid', 
            how='left', 
            suffixes=('_current', '_previous')
        )
        
        # 难度名称映射
        difficulty_names = {
            1: '入门',
            2: '普及−',
            3: '普及/提高−',
            4: '普及+/提高',
            5: '提高+/省选−',
            6: '省选/NOI−',
            7: 'NOI/NOI+/CTSC'
        }
        
        # 计算增量
        growth_records = []
        for _, row in merged_df.iterrows():
            record = {
                'uid': row['uid'],
                'username': row['username_current'],
                'realname': row.get('realname_current', ''),
            }
            
            # 计算各难度增量（使用中文列名）
            for diff in range(1, 8):
                chinese_name = difficulty_names[diff]
                current_val = row.get(f'{chinese_name}_current', 0)
                previous_val = row.get(f'{chinese_name}_previous', 0)
                record[f'{chinese_name}_本月'] = current_val
                record[f'{chinese_name}_上月'] = previous_val
                record[f'{chinese_name}_增量'] = current_val - previous_val
            
            # 总题数
            current_total = row.get('total_current', 0)
            previous_total = row.get('total_previous', 0)
            record['总题数_本月'] = current_total
            record['总题数_上月'] = previous_total
            record['总题数_增量'] = current_total - previous_total
            
            growth_records.append(record)
        
        growth_df = pd.DataFrame(growth_records)
        
        # 按增量排序
        growth_df = growth_df.sort_values('总题数_增量', ascending=False)
        
        # 保存增长报告
        report_filename = f"growth_report_{previous_month}_to_{current_month}.xlsx"
        report_filepath = os.path.join(self.output_dir, report_filename)
        
        try:
            with pd.ExcelWriter(report_filepath, engine='openpyxl') as writer:
                growth_df.to_excel(writer, sheet_name='月度增长', index=False)
            
            logger.info(f"增长报告已保存到: {report_filepath}")
            
            # 打印摘要
            self._print_growth_summary(growth_df)
            
        except Exception as e:
            logger.error(f"保存增长报告失败: {e}")
    
    def _generate_current_report(self, df: pd.DataFrame, month: str):
        """
        生成当前月份的简单报告
        """
        report_filename = f"current_report_{month}.xlsx"
        report_filepath = os.path.join(self.output_dir, report_filename)
        
        # 按总题数排序
        df_sorted = df.sort_values('total', ascending=False)
        
        try:
            with pd.ExcelWriter(report_filepath, engine='openpyxl') as writer:
                df_sorted.to_excel(writer, sheet_name='当前统计', index=False)
            
            logger.info(f"当前报告已保存到: {report_filepath}")
            
            # 打印摘要
            print("\n" + "=" * 60)
            print(f"【{month} 月训练统计】")
            print("=" * 60)
            print(f"团队总人数: {len(df)}")
            print(f"平均题数: {df['total'].mean():.1f}")
            print(f"最多题数: {df['total'].max()}")
            print(f"最少题数: {df['total'].min()}")
            
            print("\n前 10 名学员:")
            for i, row in df_sorted.head(10).iterrows():
                print(f"  {row['username']}: {row['total']} 题")
            
        except Exception as e:
            logger.error(f"保存当前报告失败: {e}")
    
    def _print_growth_summary(self, growth_df: pd.DataFrame):
        """
        打印增长报告摘要
        """
        print("\n" + "=" * 60)
        print("【月度增长报告摘要】")
        print("=" * 60)
        
        # 进步最快的学员
        print("\n📈 进步最快的 10 名学员:")
        top_growth = growth_df.head(10)
        for idx, row in top_growth.iterrows():
            growth = row['总题数_增量']
            if growth > 0:
                print(f"  {row['username']}: +{growth} 题 ({row['总题数_上月']} → {row['总题数_本月']})")
        
        # 总体统计
        total_growth = growth_df['总题数_增量'].sum()
        avg_growth = growth_df['总题数_增量'].mean()
        active_students = len(growth_df[growth_df['总题数_增量'] > 0])
        
        print(f"\n📊 总体统计:")
        print(f"  团队总增长: {total_growth} 题")
        print(f"  平均增长: {avg_growth:.1f} 题/人")
        print(f"  活跃学员: {active_students} 人（有新增题目）")
        
        # 需要关注的学员（本月无增长）
        no_growth = growth_df[growth_df['总题数_增量'] == 0]
        if len(no_growth) > 0:
            print(f"\n⚠️  本月无增长的学员 ({len(no_growth)} 人):")
            for idx, row in no_growth.head(10).iterrows():
                print(f"  {row['username']}: {row['总题数_本月']} 题")


def main():
    """
    主函数 - 命令行接口
    """
    import argparse
    
    parser = argparse.ArgumentParser(description='洛谷团队学情分析系统')
    parser.add_argument('--fetch', action='store_true', help='获取当前月度数据')
    parser.add_argument('--limit', type=int, help='限制获取的成员数量（用于测试）')
    parser.add_argument('--month', type=str, help='指定月份（格式：YYYYMM）')
    parser.add_argument('--compare', nargs=2, metavar=('MONTH1', 'MONTH2'), 
                       help='对比两个月份的数据（格式：YYYYMM YYYYMM）')
    parser.add_argument('--config', type=str, default='config.json', 
                       help='配置文件路径（默认：config.json）')
    
    args = parser.parse_args()
    
    # 初始化分析器
    analyzer = LuoguAnalyzer(config_file=args.config)
    
    # 获取数据
    if args.fetch:
        month = args.month if args.month else datetime.now().strftime('%Y%m')
        
        print(f"\n开始获取 {month} 月数据...")
        df = analyzer.fetch_team_data(limit=args.limit)
        
        if not df.empty:
            analyzer.save_monthly_data(df, month, is_test=bool(args.limit))
            print(f"\n✅ 数据获取完成！共 {len(df)} 名成员")
        else:
            print("\n❌ 数据获取失败")
    
    # 对比数据
    elif args.compare:
        previous_month, current_month = args.compare
        analyzer.generate_growth_report(current_month, previous_month)
    
    # 默认：显示帮助
    else:
        parser.print_help()
        print("\n" + "=" * 60)
        print("快速开始:")
        print("=" * 60)
        print("1. 首次运行会生成 config.json 配置文件")
        print("2. 在 config.json 中配置您的洛谷 Cookie")
        print("3. 获取本月数据:")
        print("   python analyze_luogu.py --fetch")
        print("4. 对比两个月份:")
        print("   python analyze_luogu.py --compare 202512 202601")
        print("=" * 60)


if __name__ == '__main__':
    main()
