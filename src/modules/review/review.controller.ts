import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator'; // 👈 your decorator
import type { UserDocument } from '../user/schema/user.schema';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ✅ Get all reviews for a session
  @Get()
  async getReviewsBySession(@Query('sessionId') sessionId: string) {
    return this.reviewsService.getReviewsBySessionId(sessionId);
  }

  // ✅ Get the logged-in user's review for a session
  @Get('user')
  @UseGuards(AuthGuard)
  async getUserReview(
    @GetUser() user: any,
    @Query('sessionId') sessionId: string,
  ) {
    return this.reviewsService.getUserReviewForSession(
      user._id.toString(),
      sessionId,
    );
  }

  @UseGuards(AuthGuard)
  @Post()
  async createReview(@GetUser() user: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(user._id, dto);
  }

  @UseGuards(AuthGuard)
  @Put(':reviewId')
  async updateReview(
    @GetUser() user: any,
    @Param('reviewId') reviewId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(user._id.toString(), reviewId, dto);
  }

  // ✅ Delete a review
  @UseGuards(AuthGuard)
  @Delete(':reviewId')
  async deleteReview(
    @GetUser() user: any,
    @Param('reviewId') reviewId: string,
  ) {
    return this.reviewsService.deleteReview(user._id.toString(), reviewId);
  }
}
