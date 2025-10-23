import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AssessmentService } from './assessment.service';

@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post()
  create(@Body() body: any) {
    return this.assessmentService.createAssessment(body);
  }

  @Get('session/:sessionId')
  getBySession(@Param('sessionId') sessionId: string) {
    return this.assessmentService.getAssessmentsBySession(sessionId);
  }

  @Post('submit')
  submitAnswer(
    @Body() body: { userId: string; assessmentId: string; userAnswer: string },
  ) {
    return this.assessmentService.submitUserAnswer(
      body.userId,
      body.assessmentId,
      body.userAnswer,
    );
  }

  @Get('user/:userId')
  getUserAssessments(@Param('userId') userId: string) {
    return this.assessmentService.getUserAssessments(userId);
  }

  @Get('belt/:userId')
  async getUserBelt(@Param('userId') userId: string) {
    const userRecords = await this.assessmentService.getUserAssessments(userId);
    if (!userRecords.length) return { belt: 'White', totalPoints: 0 };

    const { totalPoints, belt } = userRecords[0];
    return { belt, totalPoints };
  }
}
