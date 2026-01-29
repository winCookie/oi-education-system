#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import time
import logging
import os
import sys
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('gesp_crawler.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class GespCrawler:
    def __init__(self, config_path='config.json'):
        self.config = self._load_config(config_path)
        self.driver = None
        self.data_file = 'gesp_sites.json'

    def _load_config(self, path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return {}

    def _init_driver(self):
        options = Options()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

        # Use system driver if available (Docker environment)
        system_chromedriver = "/usr/bin/chromedriver"
        system_chromium = "/usr/bin/chromium"
        
        if os.path.exists(system_chromedriver) and os.path.exists(system_chromium):
            logger.info("Using system Chromium/ChromeDriver")
            options.binary_location = system_chromium
            service = Service(executable_path=system_chromedriver)
            self.driver = webdriver.Chrome(service=service, options=options)
        else:
            logger.info("Using webdriver_manager")
            from webdriver_manager.chrome import ChromeDriverManager
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=options)
        
        self.driver.implicitly_wait(10)

    def _add_cookies(self):
        cookie_str = self.config.get('cookie', '')
        if not cookie_str:
            logger.warning("No cookie provided!")
            return False

        # Parse cookie string "key=value; key2=value2"
        # Or if it's already a dict/list? The prompt says "fill in cookie", usually a raw string from header.
        # Let's assume user might paste the raw 'Cookie: ...' header content.
        
        self.driver.get("https://gespreg.ccf.org.cn/")
        time.sleep(2)

        try:
            # Simple parsing for "key=value; key=value" string
            if isinstance(cookie_str, str):
                for pair in cookie_str.split(';'):
                    if '=' in pair:
                        name, value = pair.strip().split('=', 1)
                        self.driver.add_cookie({
                            'name': name,
                            'value': value,
                            'domain': 'gespreg.ccf.org.cn',
                            'path': '/'
                        })
            elif isinstance(cookie_str, dict):
                 for name, value in cookie_str.items():
                        self.driver.add_cookie({
                            'name': name,
                            'value': str(value),
                            'domain': 'gespreg.ccf.org.cn',
                            'path': '/'
                        })
            
            logger.info("Cookies added")
            return True
        except Exception as e:
            logger.error(f"Failed to add cookies: {e}")
            return False

    def run(self):
        try:
            self._init_driver()
            if not self._add_cookies():
                logger.error("Skipping due to missing/invalid cookies")
                return

            # Visit Index
            url = "https://gespreg.ccf.org.cn/gesp/index.action"
            logger.info(f"Visiting {url}")
            self.driver.get(url)
            time.sleep(3)

            # Click "认证报名"
            try:
                apply_btn = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), '认证报名')] | //button[contains(text(), '认证报名')]"))
                )
                logger.info("Clicking '认证报名'")
                apply_btn.click()
                
                # Check for alert (e.g. "Not logged in")
                try:
                    alert = WebDriverWait(self.driver, 3).until(EC.alert_is_present())
                    logger.warning(f"Alert detected: {alert.text}")
                    alert.accept()
                except:
                    pass
                    
            except Exception as e:
                logger.warning(f"Could not find '认证报名' button (might be already on page): {e}")

            time.sleep(3)
            
            # Verify we are on the form page
            if "考生姓名" not in self.driver.page_source:
                logger.error("Not on registration form page! Dumping source.")
                with open('page_dump_error_state.html', 'w', encoding='utf-8') as f:
                    f.write(self.driver.page_source)
                return # Stop if not on form

            info = self.config['student_info']

            # 1. 考生姓名 Name
            try:
                inp = self.driver.find_element(By.NAME, "reanName")
                inp.clear()
                inp.send_keys(info['name'])
                logger.info(f"Filled Name: {info['name']}")
            except Exception as e:
                logger.error(f"Failed to fill Name: {e}")

            # 2. 证件类型 ID Type
            try:
                # Map text to value: 1=护照, 2=身份证, 3=港澳台
                type_map = {"身份证": "2", "护照": "1", "港澳台": "3"}
                val = type_map.get(info['id_type'], "2")
                Select(self.driver.find_element(By.NAME, "cardType")).select_by_value(val)
                logger.info(f"Selected ID Type: {info['id_type']}")
            except Exception as e:
                logger.error(f"Failed to select ID Type: {e}")

            # 3. 证件号码 ID Card
            try:
                # Remove disabled attribute if present
                self.driver.execute_script("document.getElementById('cardNo').removeAttribute('disabled');")
                inp = self.driver.find_element(By.ID, "cardNo")
                inp.clear()
                inp.send_keys(info['id_card'])
                logger.info(f"Filled ID Card: {info['id_card']}")
            except Exception as e:
                logger.error(f"Failed to fill ID Card: {e}")

            # 4. 年级 Grade
            try:
                # Value format: 09 = 9年级. Need to map "9 年级" -> "09"
                # Simple extraction of digits
                import re
                digits = re.findall(r'\d+', info['grade'])
                if digits:
                    val = digits[0].zfill(2) # "9" -> "09"
                    Select(self.driver.find_element(By.NAME, "schoolGrade")).select_by_value(val)
                    logger.info(f"Selected Grade: {info['grade']} (Value: {val})")
                else:
                    # Fallback to visible text
                    Select(self.driver.find_element(By.NAME, "schoolGrade")).select_by_visible_text(info['grade'])
            except Exception as e:
                logger.error(f"Failed to select Grade: {e}")

            # 5. 编程语言 Language
            try:
                # 100=C++, 200=Graphical, 300=Python
                lang_map = {"C++": "100", "Python": "300", "图形化": "200"}
                val = lang_map.get(info['language'], "100")
                if "图形" in info['language']: val = "200"
                
                Select(self.driver.find_element(By.ID, "language")).select_by_value(val)
                logger.info(f"Selected Language: {info['language']}")
                time.sleep(2) # Wait for Grade (Level) dropdown to repopulate
            except Exception as e:
                logger.error(f"Failed to select Language: {e}")

            # 6. 考级 Level (ID: grade)
            try:
                # This dropdown is populated dynamically. 
                # Options usually contain "一级", "二级"...
                # Try selecting by text containing the level
                sel = Select(self.driver.find_element(By.ID, "grade"))
                # Find option by text
                found = False
                for opt in sel.options:
                    if info['level'] in opt.text:
                        sel.select_by_visible_text(opt.text)
                        found = True
                        logger.info(f"Selected Level: {opt.text}")
                        break
                if not found:
                    logger.warning(f"Level '{info['level']}' not found in options")
            except Exception as e:
                logger.error(f"Failed to select Level: {e}")

            # 7. 考点 Location (Province -> City -> Site)
            try:
                # Province
                sel_prov = Select(self.driver.find_element(By.ID, "province"))
                # Map name to text or just find by text
                found_prov = False
                for opt in sel_prov.options:
                    if info['province'] in opt.text:
                        sel_prov.select_by_visible_text(opt.text)
                        found_prov = True
                        logger.info(f"Selected Province: {opt.text}")
                        break
                
                if found_prov:
                    time.sleep(3) # Wait for City load
                    
                    # City
                    sel_city = Select(self.driver.find_element(By.ID, "orgCity"))
                    found_city = False
                    for opt in sel_city.options:
                        if info['city'] in opt.text:
                            sel_city.select_by_visible_text(opt.text)
                            found_city = True
                            logger.info(f"Selected City: {opt.text}")
                            break
                    
                    if found_city:
                        time.sleep(3) # Wait for Site load
                        
                        # Extract Sites from #orgId
                        sel_site = Select(self.driver.find_element(By.ID, "orgId"))
                        sites = []
                        for opt in sel_site.options:
                            text = opt.text.strip()
                            val = opt.get_attribute('value')
                            if not val: continue # Skip "Please Select" placeholder
                            
                            # Parse availability from text
                            # E.g. "Shenzhen School (Remaining: 5)" or similar
                            # Since we don't know the exact format, we store the raw text
                            
                            available = True
                            if "满" in text or "0位" in text:
                                available = False
                            
                            sites.append({
                                'name': text,
                                'raw_text': text,
                                'available': available
                            })
                        
                        # Save Results
                        result = {
                            'timestamp': datetime.now().isoformat(),
                            'sites': sites,
                            'status': 'success' if sites else 'empty'
                        }
                        
                        with open(self.data_file, 'w', encoding='utf-8') as f:
                            json.dump(result, f, ensure_ascii=False, indent=2)
                        
                        logger.info(f"Saved {len(sites)} sites to {self.data_file}")
                        return

            except Exception as e:
                logger.error(f"Location selection failed: {e}")

            # Fallback: Save empty/error result
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump({'status': 'error', 'error': 'Location flow failed', 'timestamp': datetime.now().isoformat()}, f)

        except Exception as e:
            logger.error(f"Crawler run failed: {e}")
            # Save dump on error
            try:
                with open('page_dump_error.html', 'w', encoding='utf-8') as f:
                    f.write(self.driver.page_source)
            except:
                pass
        finally:
            if self.driver:
                self.driver.quit()

if __name__ == '__main__':
    crawler = GespCrawler()
    crawler.run()
