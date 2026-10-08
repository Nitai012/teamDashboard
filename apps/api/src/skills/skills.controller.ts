import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { type SkillDto, type SkillInput, skillInputSchema } from '@team-radar/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { SkillsService } from './skills.service.js';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  list(): SkillDto[] {
    return this.skills.list();
  }

  @Post()
  create(@Body(new ZodValidationPipe(skillInputSchema)) body: SkillInput): SkillDto {
    return this.skills.create(body.name);
  }

  @Patch(':id')
  rename(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(skillInputSchema)) body: SkillInput,
  ): SkillDto {
    return this.skills.rename(id, body.name);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.skills.remove(id);
  }
}
