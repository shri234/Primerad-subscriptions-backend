import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SessionStatusService } from './session-status.service';
import { AuthGuard } from '../auth/guards/auth.guard'; // Adjust path as needed
import {
  UpdateVimeoProgressDto,
  MarkDicomActionDto,
} from './dto/session-status.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
@Controller('session-status')
@UseGuards(AuthGuard) // Require authentication
export class SessionStatusController {
  constructor(private readonly sessionStatusService: SessionStatusService) {}

  /**
   * POST /session-status/vimeo/progress
   * Update progress for Vimeo lecture
   * Called periodically from video player (e.g., every 10 seconds)
   */
  @Post('vimeo/progress')
  async updateVimeoProgress(
    @Request() req,
    @Body() dto: UpdateVimeoProgressDto,
  ) {
    const userId = req.user.id || req.user._id || req.user.userId;

    return await this.sessionStatusService.updateVimeoProgress({
      userId,
      sessionId: dto.sessionId,
      currentTime: dto.currentTime,
      duration: dto.duration,
    });
  }

  /**
   * POST /session-status/dicom/start
   * Mark DICOM case as started when user enters the page
   */
  @Post('dicom/start')
  async markDicomStarted(@Request() req, @Body() dto: MarkDicomActionDto) {
    const userId = req.user.id || req.user._id || req.user.userId;

    return await this.sessionStatusService.markDicomStarted(
      userId,
      dto.sessionId,
    );
  }

  @Post('dicom/complete')
  async markDicomCompleted(
    @GetUser() user: any,
    @Body() dto: MarkDicomActionDto,
  ) {
    const userId = user._id;

    return await this.sessionStatusService.markDicomCompleted(
      userId,
      dto.sessionId,
    );
  }

  @Get(':sessionId')
  async getSessionProgress(
    @GetUser() user: any,
    @Param('sessionId') sessionId: string,
  ) {
    const userId = user._id;

    return await this.sessionStatusService.getSessionProgress(
      userId,
      sessionId,
    );
  }

  @Get('my/in-progress')
  async getInProgressSessions(@Request() req) {
    const userId = req.user.id || req.user._id || req.user.userId;

    return await this.sessionStatusService.getInProgressSessions(userId);
  }

  @Get('my/completed')
  async getCompletedSessions(@Request() req) {
    const userId = req.user.id || req.user._id || req.user.userId;

    return await this.sessionStatusService.getCompletedSessions(userId);
  }

  @Get('my/stats')
  async getUserStats(@GetUser() user: any) {
    const userId = user._id;

    return await this.sessionStatusService.getUserSessionStats(userId);
  }
}
