import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import {
  type MemberDto,
  type MemberInputData,
  memberInputSchema,
  type MemberSkillInput,
  memberSkillInputSchema,
  type MemberUpdateInput,
  memberUpdateSchema,
} from '@team-radar/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { MembersService } from './members.service.js';

@Controller('members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list(): MemberDto[] {
    return this.members.list();
  }

  @Post()
  create(@Body(new ZodValidationPipe(memberInputSchema)) body: MemberInputData): MemberDto {
    return this.members.create(body);
  }

  /** Removes every member created as sample data, with their placements. */
  @Delete('examples')
  @HttpCode(200)
  removeExamples(): { removed: number } {
    return { removed: this.members.removeExamples() };
  }

  @Get(':id')
  get(@Param('id') id: string): MemberDto {
    return this.members.get(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(memberUpdateSchema)) body: MemberUpdateInput,
  ): MemberDto {
    return this.members.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.members.remove(id);
  }

  @Put(':id/skills/:skillId')
  setSkill(
    @Param('id') id: string,
    @Param('skillId') skillId: string,
    @Body(new ZodValidationPipe(memberSkillInputSchema)) body: MemberSkillInput,
  ): MemberDto {
    return this.members.setSkill(id, skillId, body);
  }
}
