import { Module } from '@nestjs/common';
import { AssessmentsModule } from '../assessments/assessments.module.js';
import { MembersModule } from '../members/members.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { BackupController } from './backup.controller.js';
import { BackupService } from './backup.service.js';

@Module({
  imports: [MembersModule, SkillsModule, AssessmentsModule, SettingsModule],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
