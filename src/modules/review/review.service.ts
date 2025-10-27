import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schema/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Session } from '../sessions/schema/session.schema';
import { response } from 'express';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Session.name) private readonly sessionModel: Model<Session>,
  ) {}

  async getReviewsBySessionId(sessionId: string) {
    let data = await this.reviewModel
      .find({ sessionId: new Types.ObjectId(sessionId) })
      .populate('userId')
      .sort({ createdAt: -1 })
      .limit(4)
      .exec();

    return {
      response: 'Got reviews based on session successfully',
      data: data,
    };
  }

  async getUserReviewForSession(userId: string, sessionId: string) {
    let data = await this.reviewModel
      .findOne({ userId, sessionId: new Types.ObjectId(sessionId) })
      .exec();
    return {
      response: 'Got particular user review for this session successfully',
      data: data,
    };
  }

  async createReview(userId: string, dto: CreateReviewDto) {
    const existing = await this.reviewModel.findOne({
      sessionId: new Types.ObjectId(dto.sessionId),
      userId,
    });
    if (existing) {
      throw new BadRequestException('You have already reviewed this session.');
    }

    const review = await this.reviewModel.create({
      ...dto,
      sessionId: new Types.ObjectId(dto.sessionId),
      userId,
    });

    await this.updateAverageRating(dto.sessionId);
    return review;
  }

  async updateReview(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found.');
    if (review.userId.toString() !== userId)
      throw new ForbiddenException('Unauthorized to update this review.');

    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.comment !== undefined) review.comment = dto.comment;
    review.updatedAt = new Date();

    await review.save();
    await this.updateAverageRating(review.sessionId.toString());
    return review;
  }

  async deleteReview(userId: string, reviewId: string) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found.');
    if (review.userId.toString() !== userId)
      throw new ForbiddenException('Unauthorized to delete this review.');

    await review.deleteOne();
    await this.updateAverageRating(review.sessionId.toString());
    return { message: 'Review deleted successfully.' };
  }

  private async updateAverageRating(sessionId: string) {
    const stats = await this.reviewModel.aggregate([
      { $match: { sessionId: new Types.ObjectId(sessionId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          numOfReviews: { $sum: 1 },
        },
      },
    ]);

    const averageRating = stats.length > 0 ? stats[0].averageRating : 0;
    const numOfReviews = stats.length > 0 ? stats[0].numOfReviews : 0;

    console.log(averageRating, numOfReviews);
    console.log(await this.sessionModel.findById(sessionId));
    await this.sessionModel.findByIdAndUpdate(sessionId, {
      averageRating,
      numOfReviews,
    });
  }
}
