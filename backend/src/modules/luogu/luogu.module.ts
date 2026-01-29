import { Module } from '@nestjs/common';
import { LuoguController } from './luogu.controller';
import { LuoguService } from './luogu.service';

@Module({
  controllers: [LuoguController],
  providers: [LuoguService],
})
export class LuoguModule {}
