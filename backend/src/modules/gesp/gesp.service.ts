import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import { promisify } from 'util';
import { Cron, CronExpression } from '@nestjs/schedule';

const execPromise = promisify(exec);

@Injectable()
export class GespService {
  private readonly logger = new Logger(GespService.name);
  private readonly pluginPath = path.join(process.cwd(), '..', 'gesp_plugin');
  private readonly configPath = path.join(this.pluginPath, 'config.json');
  private readonly dataPath = path.join(this.pluginPath, 'gesp_sites.json');
  private readonly logPath = path.join(this.pluginPath, 'gesp_crawler.log');

  async getConfig() {
    try {
      if (await fs.pathExists(this.configPath)) {
        return await fs.readJson(this.configPath);
      }
      return {};
    } catch (error) {
      this.logger.error(`Failed to read config: ${error.message}`);
      return {};
    }
  }

  async updateConfig(config: any) {
    try {
      await fs.writeJson(this.configPath, config, { spaces: 2 });
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to update config: ${error.message}`);
      throw new InternalServerErrorException('Failed to update GESP config');
    }
  }

  async getResults() {
    try {
      if (await fs.pathExists(this.dataPath)) {
        return await fs.readJson(this.dataPath);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async getLogTail() {
    try {
      if (!(await fs.pathExists(this.logPath))) {
        return ['Waiting for logs...'];
      }
      const content = await fs.readFile(this.logPath, 'utf-8');
      const lines = content.split('\n');
      return lines.slice(-50);
    } catch (error) {
      return [];
    }
  }

  async runCheck() {
    try {
      this.logger.log('Starting GESP check...');
      
      // Ensure python deps (selenium) are ready (assuming shared env with Luogu or installed in Dockerfile)
      // We use system python3 which has selenium installed from previous steps
      
      const { stdout, stderr } = await execPromise('python3 -u gesp_crawler.py', {
        cwd: this.pluginPath,
        maxBuffer: 1024 * 1024 * 5,
      });
      
      this.logger.log(`GESP Check Output: ${stdout}`);
      if (stderr) this.logger.warn(`GESP Check Stderr: ${stderr}`);
      
      return { success: true };
    } catch (error) {
      this.logger.error(`GESP check failed: ${error.message}`);
      throw new InternalServerErrorException(`Check failed: ${error.message}`);
    }
  }

  // Cron job: Check every minute if we need to run
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const config = await this.getConfig();
    
    // Check if monitoring is enabled (interval > 0)
    if (!config.cron_interval_minutes || config.cron_interval_minutes <= 0) {
      return;
    }

    const lastRun = config.last_run_time ? new Date(config.last_run_time) : new Date(0);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastRun.getTime()) / 1000 / 60;

    if (diffMinutes >= config.cron_interval_minutes) {
        this.logger.log(`Running scheduled GESP check (Interval: ${config.cron_interval_minutes}m)...`);
        
        // Update last run time first to prevent double runs
        config.last_run_time = now.toISOString();
        await this.updateConfig(config);
        
        await this.runCheck();
    }
  }
}
