import { Body, Controller, Delete, Get, HttpCode, Param, Put, Query } from '@nestjs/common';
import {
  type AssessmentDto,
  type AssessmentInputData,
  assessmentInputSchema,
  isoDateParamSchema,
} from '@team-radar/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AssessmentsService } from './assessments.service.js';

@Controller()
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Get('assessments')
  list(@Query('memberId') memberId?: string): AssessmentDto[] {
    return this.assessments.list(memberId || undefined);
  }

  @Put('members/:memberId/assessments/:date')
  upsert(
    @Param('memberId') memberId: string,
    @Param('date', new ZodValidationPipe(isoDateParamSchema)) date: string,
    @Body(new ZodValidationPipe(assessmentInputSchema)) body: AssessmentInputData,
  ): AssessmentDto {
    return this.assessments.upsert(memberId, date, body);
  }

  @Delete('assessments/:id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.assessments.remove(id);
  }
}
