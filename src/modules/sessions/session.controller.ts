import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { SessionAccessGuard } from '../auth/guards/session-access.guard';
import type { UserDocument } from '../user/schema/user.schema';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { Response } from 'express';
import { Res } from '@nestjs/common';


@Controller('sessions')
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(private readonly sessionService: SessionService) {}

  // ------------------ ADMIN / FACULTY ROUTES ------------------

  @Post('create')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image1920x1080', maxCount: 1 },
      { name: 'image522x760', maxCount: 1 },
    ]),
  )
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
    @UploadedFiles()
    files: {
      image1920x1080?: Express.Multer.File[];
      image522x760?: Express.Multer.File[];
    },
  ) {
    try {
      const session = await this.sessionService.createSession(
        createSessionDto,
        files,
      );
      return {
        success: true,
        message: 'Session created successfully',
        data: session,
      };
    } catch (error: any) {
      this.logger.error('Error creating session:', error);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('update')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image1920x1080', maxCount: 1 },
      { name: 'image522x760', maxCount: 1 },
    ]),
  )
  async updateSession(
    @Body() updateSessionDto: UpdateSessionDto,
    @Query('sessionId') sessionId: string,
    @Query('sessionType') sessionType: string,
    @UploadedFiles()
    files: {
      image1920x1080?: Express.Multer.File[];
      image522x760?: Express.Multer.File[];
    },
  ) {
    try {
      const session = await this.sessionService.updateSession(
        sessionId,
        sessionType,
        updateSessionDto,
        files,
      );
      return {
        success: true,
        message: 'Session updated successfully',
        data: session,
      };
    } catch (error: any) {
      this.logger.error('Error updating session:', error);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('updateFaculties/:sessionId/:sessionType')
  @UseGuards(AuthGuard)
  async updateSessionFaculties(
    @Param('sessionId') sessionId: string,
    @Param('sessionType') sessionType: string,
    @Body('facultyIds') facultyIds: string[],
  ) {
    try {
      const session = await this.sessionService.updateSessionFaculties(
        sessionId,
        sessionType,
        facultyIds,
      );
      return {
        success: true,
        message: 'Session faculties updated successfully',
        data: session,
      };
    } catch (error: any) {
      this.logger.error('Error updating session faculties:', error);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('getRecommendedSessions')
  @UseGuards(OptionalAuthGuard, SessionAccessGuard)
  async getRecommendedSessions(
    @GetUser() user: any,
    @Query('limit') limit = 10,
  ) {
    try {
      const userId = user?._id?.toString() || null;

      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: 'User not authenticated — cannot generate recommendations',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      // No userAccess concept — just pass null
      const sessions = await this.sessionService.getRecommendedSessions(
        null,
        userId,
        limit,
      );

      return {
        success: true,
        message: 'Recommended sessions fetched successfully',
        data: sessions,
      };
    } catch (error: any) {
      this.logger.error('Error getting recommended sessions:', error);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('delete')
  @UseGuards(AuthGuard)
  async deleteSession(
    @Query('sessionId') sessionId: string,
    @Query('sessionType') sessionType: string,
    @GetUser() user: UserDocument,
  ) {
    try {
      await this.sessionService.deleteSession(
        sessionId,
        sessionType,
        // user._id.toString(),
      );
      return { success: true, message: 'Session deleted successfully' };
    } catch (error: any) {
      this.logger.error('Error deleting session:', error);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('get')
  @UseGuards(OptionalAuthGuard, SessionAccessGuard)
  async getSessions(
    @Query('sessionType') sessionType: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    try {
      const result = await this.sessionService.getSessions(
        sessionType || 'All',
        page,
        limit,
      );
      return { success: true, data: result };
    } catch (error: any) {
      this.logger.error('Error getting sessions:', error);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }


@Get('getSessionByDifficulty')
@UseGuards(OptionalAuthGuard, SessionAccessGuard)
async getSessionsByDifficulty(
  @Query('pathologyId') pathologyId: string,
  @Query('page') page = 1,
  @Query('limit') limit = 10,
  @GetUser() user?: any,
) {
  try {
    const userAccess = user
      ? {
          _id: user._id.toString(),
          isLoggedIn: true,
          isSubscribed: user.isSubscribed ?? false, 
        }
      : null;

    const result = await this.sessionService.getSessionsByDifficulty(
      pathologyId,
      Number(page),
      Number(limit),
      userAccess,
    );

    return { success: true, data: result };
  } catch (error: any) {
    this.logger.error('Error getting sessions by difficulty:', error);
    throw new HttpException(
      { success: false, message: error.message },
      HttpStatus.BAD_REQUEST,
    );
  }
}

  @Get('getRecentItems')
  @UseGuards(OptionalAuthGuard, SessionAccessGuard)
  async getRecentItems(@GetUser() user: any) {
    try {
      const userId = user?._id?.toString() || null;
      const items = await this.sessionService.getRecentItems(userId);
      return { success: true, data: items };
    } catch (error: any) {
      this.logger.error('Error getting recent items:', error);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('getTopRatedLectures')
  @UseGuards(OptionalAuthGuard, SessionAccessGuard)
  async getTopRatedLectures(@GetUser() user: any) {
    try {
      const userId = user?._id?.toString() || null;
      const lectures = await this.sessionService.getTopRatedLectures(userId);
      return { success: true, data: lectures };
    } catch (error: any) {
      this.logger.error('Error getting top rated lectures:', error);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('getTopRatedCases')
  @UseGuards(OptionalAuthGuard, SessionAccessGuard)
  async getTopRatedCases(@Query('limit') limit = 10, @GetUser() user: any) {
    try {
      const userId = user?._id?.toString() || null;
      const cases = await this.sessionService.getTopRatedCases(limit, userId);
      return { success: true, data: cases };
    } catch (error: any) {
      this.logger.error('Error getting top rated cases:', error);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('getTopWatchedSessions')
  @UseGuards(OptionalAuthGuard, SessionAccessGuard)
  async getTopWatchedSessions(@GetUser() user: any) {
    try {
      const userId = user?._id?.toString() || null;
      const sessions = await this.sessionService.getTopWatchedSessions(userId);
      return { success: true, data: sessions };
    } catch (error: any) {
      this.logger.error('Error getting top watched sessions:', error);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('getUpcomingLivePrograms')
  @UseGuards(OptionalAuthGuard, SessionAccessGuard)
  async getUpcomingLivePrograms(
    @Query('limit') limit = 10,
    @GetUser() user: any,
  ) {
    try {
      const userId = user?._id?.toString() || null;
      const programs = await this.sessionService.getUpcomingLivePrograms(
        limit,
        userId, // TS18046 resolved
      );
      return { success: true, data: programs };
    } catch (error: any) {
      this.logger.error('Error getting upcoming live programs:', error);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  @Post('track')
  @UseGuards(AuthGuard)
  async trackSessionView(
    @Body('sessionId') sessionId: string,
    @Body('moduleId') moduleId: string,
    @GetUser() user: any,
  ) {
    try {
      const view = await this.sessionService.trackSessionView(
        user._id.toString(), 
        sessionId,
        moduleId,
      );
      return { success: true, data: view };
    } catch (error: any) {
      this.logger.error('Error tracking session view:', error);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('getWatchedSessions')
  @UseGuards(AuthGuard)
  async getWatchedSessions(
    @GetUser() user: any,
    @Query('sessionTypeFilter') sessionTypeFilter?: string,

    @Query('limit') limit = 50,
  ) {
    try {
      const userId = user?._id?.toString() || null;
      const sessions = await this.sessionService.getWatchedSessions(
        userId, 
        sessionTypeFilter,
        limit,
      );
      return { success: true, data: sessions };
    } catch (error: any) {
      this.logger.error('Error getting watched sessions:', error);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('getCompletedSessions')
  @UseGuards(AuthGuard)
  async getCompletedSessionsByUser(@GetUser() user: any) {
    try {
      const userId = user?._id?.toString() || null;
      const sessions = await this.sessionService.getCompletedSessionsByUser(
        userId.toString(),
      );
      return { success: true, data: sessions };
    } catch (error: any) {
      this.logger.error('Error getting completed sessions:', error);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('generateAIComparison')
@UseGuards(AuthGuard)
async generateAIComparison(
  @Body('userObservations') userObservations: string,
  @Body('facultyObservations') facultyObservations: string,
  @Res() res: Response,
) {
 try {
    const stream = await this.sessionService.generateAIComparisonStream(
      userObservations,
      facultyObservations,
    );

    // 🧠 Set headers for a streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // 🌀 Stream chunks to frontend as they arrive
    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${content}\n\n`); // SSE format
      }
    }

    // ✅ Signal completion
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error: any) {
    this.logger.error('Error streaming AI comparison:', error);
    if (!res.headersSent) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: error.message });
    } else {
      res.end();
    }
  }
}

}
