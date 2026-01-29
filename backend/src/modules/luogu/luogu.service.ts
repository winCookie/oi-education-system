import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import { promisify } from 'util';

const execPromise = promisify(exec);

@Injectable()
export class LuoguService {
  private readonly logger = new Logger(LuoguService.name);
  private readonly pluginPath = path.join(process.cwd(), '..', '洛谷插件');
  private readonly configPath = path.join(this.pluginPath, 'config.json');

  async getConfig() {
    try {
      if (await fs.pathExists(this.configPath)) {
        return await fs.readJson(this.configPath);
      }
      return {
        team_id: '',
        cookies: {
          __client_id: '',
          _uid: '',
        },
      };
    } catch (error) {
      this.logger.error(`Failed to read config: ${error.message}`);
      throw new InternalServerErrorException('无法读取洛谷插件配置');
    }
  }

  async updateConfig(config: any) {
    try {
      await fs.writeJson(this.configPath, config, { spaces: 2 });
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to update config: ${error.message}`);
      throw new InternalServerErrorException('无法更新洛谷插件配置');
    }
  }

  async runFetch(limit?: number) {
    try {
      this.logger.log(`Starting Luogu data fetch...${limit ? ` (Limit: ${limit})` : ''}`);
      this.logger.log(`Plugin path: ${this.pluginPath}`);
      
      // Check if directory exists
      if (!(await fs.pathExists(this.pluginPath))) {
        throw new Error(`Plugin directory not found at ${this.pluginPath}`);
      }

      // Debug: List files
      const files = await fs.readdir(this.pluginPath);
      this.logger.log(`Files in plugin dir: ${files.join(', ')}`);

      // Debug: Check python version
      try {
        const { stdout: pyVer } = await execPromise('python3 --version');
        this.logger.log(`Python version: ${pyVer.trim()}`);
      } catch (e) {
        this.logger.error(`Python check failed: ${e.message}`);
      }

      // Run with unbuffered output (-u)
      const command = `python3 -u analyze_luogu.py --fetch${limit ? ` --limit ${limit}` : ''}`;
      const { stdout, stderr } = await execPromise(command, {
        cwd: this.pluginPath,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });
      
      this.logger.log(`Fetch output: ${stdout}`);
      if (stderr) this.logger.warn(`Fetch stderr: ${stderr}`);
      return { success: true, output: stdout };
    } catch (error) {
      this.logger.error(`Failed to fetch data: ${error.message}`);
      if (error.stderr) {
        this.logger.error(`Stderr: ${error.stderr}`);
      }
      throw new InternalServerErrorException(`抓取数据失败: ${error.message}`);
    }
  }

  async getReports() {
    const reportsDir = path.join(this.pluginPath, 'reports');
    const dataDir = path.join(this.pluginPath, 'data');
    
    let allFiles: any[] = [];

    const scanDir = async (dir: string, type: 'report' | 'data') => {
      try {
        if (await fs.pathExists(dir)) {
          const files = await fs.readdir(dir);
          const xlsxFiles = files.filter(f => f.endsWith('.xlsx'));
          
          for (const f of xlsxFiles) {
            // Only include relevant files
            if (type === 'data' && !f.startsWith('monthly_stats_') && !f.startsWith('test_stats_')) continue;
            
            const stats = await fs.stat(path.join(dir, f));
            allFiles.push({
              name: f,
              path: `/${type}/${f}`, // Store relative path logic if needed, but we use name for download
              type: type,
              isTest: f.startsWith('test_stats_'),
              mtime: stats.mtime
            });
          }
        }
      } catch (e) {
        this.logger.error(`Failed to scan ${dir}: ${e.message}`);
      }
    };

    await scanDir(reportsDir, 'report');
    await scanDir(dataDir, 'data');

    return allFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  }

  getReportPath(filename: string) {
    // Check reports dir first
    let filePath = path.join(this.pluginPath, 'reports', filename);
    if (fs.existsSync(filePath)) return filePath;
    
    // Check data dir
    filePath = path.join(this.pluginPath, 'data', filename);
    if (fs.existsSync(filePath)) return filePath;
    
    return null;
  }

  async getLogTail() {
    const logPath = path.join(this.pluginPath, 'luogu_analysis.log');
    try {
      if (!(await fs.pathExists(logPath))) {
        return ['等待日志生成...'];
      }
      // Read the file. For very large files this isn't efficient, but log files here are small.
      const content = await fs.readFile(logPath, 'utf-8');
      const lines = content.split('\n');
      return lines.slice(-50); // Return last 50 lines
    } catch (error) {
      this.logger.error(`Failed to read log: ${error.message}`);
      return [];
    }
  }

  async getLatestStats() {
    const dataDir = path.join(this.pluginPath, 'data');
    try {
      if (!(await fs.pathExists(dataDir))) return null;
      const files = await fs.readdir(dataDir);
      const statsFiles = files.filter(f => f.startsWith('monthly_stats_') && f.endsWith('.xlsx'))
        .sort()
        .reverse();
      
      if (statsFiles.length === 0) return null;
      return statsFiles[0];
    } catch (error) {
      return null;
    }
  }
}
