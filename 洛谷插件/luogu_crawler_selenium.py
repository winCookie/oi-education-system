#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
洛谷用户数据爬虫 - Selenium 版本
使用浏览器自动化获取动态加载的数据
"""

import json
import time
import logging
import re
from typing import Dict, List, Optional
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class LuoguCrawlerSelenium:
    def __init__(self, cookies=None, headless=True, config=None):
        """
        初始化 Selenium 爬虫
        
        Args:
            cookies (dict): Cookie 字典，包含 __client_id 和 _uid
            headless (bool): 是否使用无头模式（不显示浏览器窗口）
            config (dict): 配置字典
        """
        self.cookies = cookies or {}
        self.headless = headless
        self.driver = None
        
        # 默认配置
        self.config = config or {
            'page_load_delay': 5,
            'scroll_count': 10,
            'scroll_delay': 1
        }
        
        # 洛谷难度等级映射（注意：洛谷使用的是全角减号"−"而非半角"-"）
        self.difficulty_mapping = {
            '入门': 'difficulty1',
            '普及−': 'difficulty2',  # 全角减号
            '普及/提高−': 'difficulty3',  # 全角减号
            '普及+/提高': 'difficulty4',
            '提高+/省选−': 'difficulty5',  # 全角减号
            '省选/NOI−': 'difficulty6',  # 全角减号
            'NOI/NOI+/CTSC': 'difficulty7'
        }
        
        logger.info("LuoguCrawlerSelenium 初始化完成")
    
    def _init_driver(self):
        """
        初始化 Chrome WebDriver
        """
        if self.driver:
            return
        
        try:
            # 配置 Chrome 选项
            chrome_options = Options()
            if self.headless:
                chrome_options.add_argument('--headless')
            
            # Docker 环境必备参数
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            
            # 尝试使用系统安装的 chromium-browser 和 chromedriver (Docker环境)
            import os
            system_chromedriver = "/usr/bin/chromedriver"
            system_chromium = "/usr/bin/chromium"
            
            if os.path.exists(system_chromedriver) and os.path.exists(system_chromium):
                logger.info("检测到系统安装的 Chromium 和 ChromeDriver，优先使用...")
                chrome_options.binary_location = system_chromium
                service = Service(executable_path=system_chromedriver)
                self.driver = webdriver.Chrome(service=service, options=chrome_options)
            else:
                logger.info("未检测到系统驱动，尝试使用 webdriver-manager 下载...")
                # 使用 webdriver-manager 自动管理驱动
                service = Service(ChromeDriverManager().install())
                self.driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # 设置隐式等待
            self.driver.implicitly_wait(10)
            
            logger.info("Chrome WebDriver 初始化成功")
            
            # 添加 Cookie
            if self.cookies:
                self._add_cookies()
            
        except Exception as e:
            logger.error(f"初始化 WebDriver 失败: {e}")
            raise
    
    def _add_cookies(self):
        """
        添加登录 Cookie
        """
        try:
            # 先访问洛谷首页（需要在同域名下才能设置 Cookie）
            self.driver.get('https://www.luogu.com.cn/')
            time.sleep(2)
            
            # 添加 Cookie
            for name, value in self.cookies.items():
                self.driver.add_cookie({
                    'name': name,
                    'value': str(value),
                    'domain': '.luogu.com.cn'
                })
            
            logger.info("Cookie 已添加")
            
        except Exception as e:
            logger.error(f"添加 Cookie 失败: {e}")
    
    def get_team_members(self, team_id: str) -> List[Dict]:
        """
        获取团队所有成员信息（包含真实姓名）
        
        Args:
            team_id: 团队 ID
            
        Returns:
            成员列表，包含 uid, username, realname
        """
        try:
            self._init_driver()
            
            # 直接访问成员页面
            url = f"https://www.luogu.com.cn/team/{team_id}/member"
            logger.info(f"正在访问团队成员页面: {url}")
            
            self.driver.get(url)
            
            # 等待页面加载
            time.sleep(self.config.get('page_load_delay', 5))
            
            # 滚动页面加载所有成员
            logger.info("滚动页面加载所有成员...")
            for i in range(self.config.get('scroll_count', 10)):
                self.driver.execute_script('window.scrollTo(0, document.body.scrollHeight);')
                time.sleep(self.config.get('scroll_delay', 1))
            
            # 获取页面文本内容
            page_text = self.driver.find_element(By.TAG_NAME, 'body').text
            lines = page_text.split('\n')
            
            # 查找所有用户链接
            user_links = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='/user/']")
            logger.info(f"找到 {len(user_links)} 个用户链接元素")
            
            members = []
            seen_uids = set()
            
            # 提取 UID 和用户名
            uid_username_map = {}
            excluded_count = 0
            for link in user_links:
                try:
                    href = link.get_attribute('href')
                    match = re.search(r'/user/(\d+)', href)
                    if match:
                        uid = match.group(1)
                        username = link.text.strip()
                        
                        # 过滤掉无效的用户名（如 "管理成员"、空字符串等）
                        if username and username not in ['管理成员', '允许', '拒绝', '加入黑名单', '团队设置']:
                            if uid not in seen_uids:
                                uid_username_map[uid] = username
                                seen_uids.add(uid)
                                logger.debug(f"添加用户: UID={uid}, username={username}")
                        else:
                            excluded_count += 1
                            logger.debug(f"排除链接: UID={uid}, username='{username}'")
                except Exception as e:
                    logger.debug(f"处理链接时出错: {e}")
                    continue
            
            logger.info(f"提取到 {len(uid_username_map)} 个有效用户（排除了 {excluded_count} 个无效链接）")
            
            # 从文本内容中提取真实姓名
            # 页面结构：用户名在一行，真实姓名在下一行
            for uid, username in uid_username_map.items():
                realname = ''
                
                # 在页面文本中查找用户名
                for i, line in enumerate(lines):
                    if line.strip() == username:
                        # 检查下一行是否是真实姓名
                        if i + 1 < len(lines):
                            next_line = lines[i + 1].strip()
                            
                            # 过滤掉一些已知的非姓名内容
                            excluded_words = [
                                '所有者', '管理员', '管理成员', '待审核', 
                                '允许', '拒绝', '加入黑名单', 'Teacher', 
                                '龙岗大运', '南山大冲', '六年级', '七年级', 
                                '八年级', '九年级', '高一', '高二', '高三'
                            ]
                            
                            # 检查是否包含年级信息
                            grade_pattern = r'(六|七|八|九|高一|高二|高三)年级'
                            grade_match = re.search(grade_pattern, next_line)
                            
                            if grade_match:
                                # 提取年级前的真实姓名
                                realname = next_line.split(grade_match.group(0))[0].strip()
                            elif next_line and next_line not in excluded_words:
                                # 检查是否像一个中文名字（2-4个汉字）
                                if re.match(r'^[\u4e00-\u9fa5]{2,4}$', next_line):
                                    realname = next_line
                            
                        break
                
                members.append({
                    'uid': uid,
                    'username': username,
                    'realname': realname
                })
                
                logger.debug(f"  UID: {uid}, 用户名: {username}, 真实姓名: {realname}")
            
            logger.info(f"成功提取 {len(members)} 名团队成员（含真实姓名）")
            return members
            
        except Exception as e:
            logger.error(f"获取团队成员失败: {e}")
            return []
    
    def get_detailed_practice(self, uid: str) -> Optional[Dict]:
        """
        获取用户详细练习数据
        
        Args:
            uid: 用户 ID
            
        Returns:
            练习数据字典
        """
        try:
            self._init_driver()
            
            url = f"https://www.luogu.com.cn/user/{uid}"
            logger.info(f"正在访问用户页面: {url}")
            
            self.driver.get(url)
            time.sleep(3)
            
            # 查找并点击"练习"标签
            try:
                practice_tabs = self.driver.find_elements(By.XPATH, "//*[contains(text(), '练习')]")
                for tab in practice_tabs:
                    if tab.is_displayed() and tab.text.strip() == '练习':
                        logger.info("点击练习标签...")
                        tab.click()
                        time.sleep(3)
                        break
            except Exception as e:
                logger.warning(f"点击练习标签失败: {e}")
            
            # 等待数据加载
            time.sleep(3)
            
            # 初始化数据
            practice_data = self._get_default_practice_data()
            practice_data['username'] = uid
            practice_data['is_hidden'] = False
            practice_data['rating'] = 0
            
            # 获取用户名
            try:
                username_elem = self.driver.find_element(By.CSS_SELECTOR, "h1, [class*='username']")
                practice_data['username'] = username_elem.text.strip()
            except:
                pass
            
            # 获取页面文本
            try:
                page_text = self.driver.find_element(By.TAG_NAME, 'body').text
                
                # 解析难易度统计
                # 格式: 难度名称在一行，题数在下一行（如 "126题"）
                import re
                
                lines = page_text.split('\n')
                for i, line in enumerate(lines):
                    line = line.strip()
                    
                    # 检查是否是难度名称
                    for difficulty_name, difficulty_key in self.difficulty_mapping.items():
                        if line == difficulty_name:
                            # 下一行应该是题数（如 "126题"）
                            if i + 1 < len(lines):
                                next_line = lines[i + 1].strip()
                                # 提取数字
                                match = re.match(r'(\d+)题?', next_line)
                                if match:
                                    count = int(match.group(1))
                                    practice_data[difficulty_key] = count
                                    logger.debug(f"找到 {difficulty_name}: {count} 题")
                
                # 尝试获取等级分
                for i, line in enumerate(lines):
                    if '等级分' in line and i + 1 < len(lines):
                        try:
                            rating = int(lines[i + 1].strip())
                            practice_data['rating'] = rating
                            logger.debug(f"找到等级分: {rating}")
                        except:
                            pass
                
            except Exception as e:
                logger.warning(f"提取练习数据失败: {e}")
            
            # 计算总数
            total = sum(practice_data.get(f'difficulty{i}', 0) for i in range(1, 8))
            
            if total > 0:
                logger.info(f"成功获取用户 {uid} 的练习数据（共 {total} 题）")
                return practice_data
            else:
                logger.warning(f"用户 {uid} 可能隐藏了数据或页面结构已变化")
                practice_data['is_hidden'] = True
                return practice_data
            
        except Exception as e:
            logger.error(f"获取练习数据失败: {e}")
            return None
    
    def get_recent_records(self, uid: str, status='', limit=50) -> List[Dict]:
        """
        获取用户最近的提交记录
        
        Args:
            uid: 用户 ID
            status: 过滤状态（如 'AC'）
            limit: 记录数量
            
        Returns:
            提交记录列表
        """
        try:
            self._init_driver()
            
            url = f"https://www.luogu.com.cn/record/list?user={uid}"
            if status:
                url += f"&status={status}"
            
            logger.info(f"正在访问提交记录: {url}")
            
            self.driver.get(url)
            time.sleep(5)
            
            records = []
            
            # 查找提交记录行
            try:
                record_elements = self.driver.find_elements(By.CSS_SELECTOR, "tr[class*='record'], .record-item, [class*='submission']")
                
                for elem in record_elements[:limit]:
                    try:
                        # 提取题目 ID
                        problem_link = elem.find_element(By.CSS_SELECTOR, "a[href*='/problem/']")
                        problem_id = problem_link.text.strip()
                        
                        records.append({
                            'problem_id': problem_id,
                            'status': 0,
                            'time': 0,
                            'score': 0
                        })
                    except:
                        continue
                
                logger.info(f"成功获取 {len(records)} 条提交记录")
                
            except Exception as e:
                logger.warning(f"提取提交记录失败: {e}")
            
            return records
            
        except Exception as e:
            logger.error(f"获取提交记录失败: {e}")
            return []
    
    def _get_default_practice_data(self) -> Dict:
        """
        返回默认的练习数据结构
        """
        return {
            'difficulty1': 0,
            'difficulty2': 0,
            'difficulty3': 0,
            'difficulty4': 0,
            'difficulty5': 0,
            'difficulty6': 0,
            'difficulty7': 0
        }
    
    def get_user_summary(self, user_id: str) -> Dict:
        """
        获取用户数据摘要（兼容接口）
        """
        practice_data = self.get_detailed_practice(user_id)
        
        if practice_data:
            return {
                'user_info': {
                    'username': practice_data.get('username', f'用户{user_id}'),
                    'rank': '普及-',
                    'uid': user_id,
                    'rating': practice_data.get('rating', 0)
                },
                'practice_data': {k: v for k, v in practice_data.items() 
                                 if k.startswith('difficulty')},
                'success': True,
                'message': '数据获取成功'
            }
        
        return {
            'success': False,
            'error': '获取失败'
        }
    
    def close(self):
        """
        关闭浏览器
        """
        if self.driver:
            try:
                self.driver.quit()
                logger.info("浏览器已关闭")
            except Exception as e:
                logger.error(f"关闭浏览器失败: {e}")
            finally:
                self.driver = None
    
    def __del__(self):
        """
        析构函数，确保浏览器被关闭
        """
        self.close()


def main():
    """
    测试函数
    """
    print("=" * 60)
    print("Selenium 爬虫测试")
    print("=" * 60)
    
    # 从 config.json 加载配置
    try:
        with open('config.json', 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        cookies = config.get('cookies', {})
        team_id = config.get('team_id', '55654')
        
        # 创建爬虫实例
        crawler = LuoguCrawlerSelenium(cookies=cookies, headless=False)
        
        print(f"\n正在获取团队 {team_id} 的成员...")
        members = crawler.get_team_members(team_id)
        
        if members:
            print(f"✅ 成功！共 {len(members)} 名成员")
            for i, member in enumerate(members[:5], 1):
                print(f"  {i}. {member['username']} (UID: {member['uid']})")
        else:
            print("❌ 获取失败")
        
        # 关闭浏览器
        crawler.close()
        
    except FileNotFoundError:
        print("❌ 未找到 config.json")
    except Exception as e:
        print(f"❌ 错误: {e}")


if __name__ == '__main__':
    main()
