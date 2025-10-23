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

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Session.name) private readonly sessionModel: Model<Session>,
  ) {}

  async getReviewsByItemId(itemId: string) {
    return this.reviewModel
      .find({ itemId: new Types.ObjectId(itemId) })
      .populate('userId')
      .sort({ createdAt: -1 })
      .limit(4)
      .exec();
  }

  async getUserReviewForItem(userId: string, itemId: string) {
    return this.reviewModel.findOne({ userId, itemId }).exec();
  }

  async createReview(userId: string, dto: CreateReviewDto) {
    const existing = await this.reviewModel.findOne({
      itemId: dto.itemId,
      userId,
    });
    if (existing) {
      throw new BadRequestException('You have already reviewed this item.');
    }

    const review = await this.reviewModel.create({ ...dto, userId });
    await this.updateAverageRating(dto.itemId);
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
    await this.updateAverageRating(review.itemId.toString());
    return review;
  }

  async deleteReview(userId: string, reviewId: string) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found.');
    if (review.userId.toString() !== userId)
      throw new ForbiddenException('Unauthorized to delete this review.');

    await review.deleteOne();
    await this.updateAverageRating(review.itemId.toString());
    return { message: 'Review deleted successfully.' };
  }

  private async updateAverageRating(itemId: string) {
    const stats = await this.reviewModel.aggregate([
      { $match: { itemId: new Types.ObjectId(itemId) } },
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

    await this.sessionModel.findByIdAndUpdate(itemId, {
      averageRating,
      numOfReviews,
    });
  }
}
