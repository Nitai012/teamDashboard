import { Body, Controller, Get, Header, HttpCode, Post, Res } from '@nestjs/common';
import { type Backup, backupSchema, type ImportResultDto, todayIso } from '@team-radar/shared';
import type { Response } from 'express';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { BackupService } from './backup.service.js';

@Controller('backup')
export class BackupController {
  constructor(private readonly backup: BackupService) {}

  @Get()
  export(@Res({ passthrough: true }) res: Response) {
    res.attachment(`team-radar-backup-${todayIso()}.json`);
    return this.backup.export();
  }

  @Get('csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  exportCsv(@Res({ passthrough: true }) res: Response): string {
    res.attachment(`team-radar-${todayIso()}.csv`);
    return this.backup.exportCsv();
  }

  @Post('import')
  @HttpCode(200)
  import(@Body(new ZodValidationPipe(backupSchema)) body: Backup): ImportResultDto {
    return this.backup.import(body);
  }
}
