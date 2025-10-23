import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async getReviewsByItem(@Query('itemId') itemId: string) {
    return this.reviewsService.getReviewsByItemId(itemId);
  }

  @Get('user')
  async getUserReview(
    @Query('userId') userId: string,
    @Query('itemId') itemId: string,
  ) {
    return this.reviewsService.getUserReviewForItem(userId, itemId);
  }

  @UseGuards(AuthGuard)
  @Post()
  async createReview(@Req() req, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(req.user.id, dto);
  }

  @UseGuards(AuthGuard)
  @Put(':reviewId')
  async updateReview(
    @Req() req,
    @Param('reviewId') reviewId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(req.user.id, reviewId, dto);
  }

  @UseGuards(AuthGuard)
  @Delete(':reviewId')
  async deleteReview(@Req() req, @Param('reviewId') reviewId: string) {
    return this.reviewsService.deleteReview(req.user.id, reviewId);
  }
}
