import { Body, Controller, Get, Put } from '@nestjs/common';
import { type SettingsDto, type SettingsInput, settingsInputSchema } from '@team-radar/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { SettingsService } from './settings.service.js';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get(): SettingsDto {
    return this.settings.get();
  }

  @Put()
  update(@Body(new ZodValidationPipe(settingsInputSchema)) body: SettingsInput): SettingsDto {
    return this.settings.setAxes(body.axes);
  }
}
