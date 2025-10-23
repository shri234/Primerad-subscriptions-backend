import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewsService } from './review.service';
import { ReviewsController } from './review.controller';
import { Review, ReviewSchema } from './schema/review.schema';
import { Session, SessionSchema } from '../sessions/schema/session.schema';
import { User, UserSchema } from '../user/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Session.name, schema: SessionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [ReviewsService],
  controllers: [ReviewsController],
  exports: [ReviewsService],
})
export class ReviewsModule {}
