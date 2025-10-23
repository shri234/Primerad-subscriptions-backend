import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { ReviewsService } from './review.service';
import { Review, ReviewDocument } from './schema/review.schema';
import { Session } from '../sessions/schema/session.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewModel: Model<ReviewDocument>;
  let sessionModel: Model<Session>;

  const mockUserId = new Types.ObjectId().toString();
  const mockSessionId = new Types.ObjectId().toString();
  const mockReviewId = new Types.ObjectId().toString();

  const mockReview = {
    _id: mockReviewId,
    sessionId: new Types.ObjectId(mockSessionId),
    userId: mockUserId,
    rating: 5,
    comment: 'Great session!',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  };

  const mockSession = {
    _id: mockSessionId,
    title: 'Test Session',
    averageRating: 0,
    numOfReviews: 0,
  };

  const mockReviewModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
  };

  const mockSessionModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getModelToken(Review.name),
          useValue: mockReviewModel,
        },
        {
          provide: getModelToken(Session.name),
          useValue: mockSessionModel,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    reviewModel = module.get<Model<ReviewDocument>>(getModelToken(Review.name));
    sessionModel = module.get<Model<Session>>(getModelToken(Session.name));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getReviewsBySessionId', () => {
    it('should return reviews for a session', async () => {
      const mockReviews = [mockReview];
      const execMock = jest.fn().mockResolvedValue(mockReviews);
      const limitMock = jest.fn().mockReturnValue({ exec: execMock });
      const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
      const populateMock = jest.fn().mockReturnValue({ sort: sortMock });

      mockReviewModel.find.mockReturnValue({ populate: populateMock });

      const result = await service.getReviewsBySessionId(mockSessionId);

      expect(mockReviewModel.find).toHaveBeenCalledWith({
        sessionId: new Types.ObjectId(mockSessionId),
      });
      expect(populateMock).toHaveBeenCalledWith('userId');
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(limitMock).toHaveBeenCalledWith(4);
      expect(result).toEqual(mockReviews);
    });
  });

  describe('getUserReviewForSession', () => {
    it('should return user review for a session', async () => {
      const execMock = jest.fn().mockResolvedValue(mockReview);
      mockReviewModel.findOne.mockReturnValue({ exec: execMock });

      const result = await service.getUserReviewForSession(
        mockUserId,
        mockSessionId,
      );

      expect(mockReviewModel.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
        sessionId: mockSessionId,
      });
      expect(result).toEqual(mockReview);
    });

    it('should return null if no review found', async () => {
      const execMock = jest.fn().mockResolvedValue(null);
      mockReviewModel.findOne.mockReturnValue({ exec: execMock });

      const result = await service.getUserReviewForSession(
        mockUserId,
        mockSessionId,
      );

      expect(result).toBeNull();
    });
  });

  describe('createReview', () => {
    const createDto: CreateReviewDto = {
      sessionId: mockSessionId,
      rating: 5,
      comment: 'Great session!',
    };

    it('should create a new review successfully', async () => {
      const execMock = jest.fn().mockResolvedValue(null);
      mockReviewModel.findOne.mockReturnValue({ exec: execMock });
      mockReviewModel.create.mockResolvedValue(mockReview);
      mockReviewModel.aggregate.mockResolvedValue([
        { averageRating: 5, numOfReviews: 1 },
      ]);
      mockSessionModel.findById.mockResolvedValue(mockSession);
      mockSessionModel.findByIdAndUpdate.mockResolvedValue({
        ...mockSession,
        averageRating: 5,
        numOfReviews: 1,
      });

      const result = await service.createReview(mockUserId, createDto);

      expect(mockReviewModel.findOne).toHaveBeenCalledWith({
        sessionId: new Types.ObjectId(mockSessionId),
        userId: mockUserId,
      });
      expect(mockReviewModel.create).toHaveBeenCalledWith({
        ...createDto,
        sessionId: new Types.ObjectId(mockSessionId),
        userId: mockUserId,
      });
      expect(mockSessionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockSessionId,
        {
          averageRating: 5,
          numOfReviews: 1,
        },
      );
      expect(result).toEqual(mockReview);
    });

    it('should throw BadRequestException if review already exists', async () => {
      const execMock = jest.fn().mockResolvedValue(mockReview);
      mockReviewModel.findOne.mockReturnValue({ exec: execMock });

      await expect(service.createReview(mockUserId, createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createReview(mockUserId, createDto)).rejects.toThrow(
        'You have already reviewed this session.',
      );
    });
  });

  describe('updateReview', () => {
    const updateDto: UpdateReviewDto = {
      rating: 4,
      comment: 'Updated comment',
    };

    it('should update review successfully', async () => {
      const saveMock = jest.fn().mockResolvedValue(mockReview);
      const reviewToUpdate = {
        ...mockReview,
        userId: new Types.ObjectId(mockUserId),
        sessionId: new Types.ObjectId(mockSessionId),
        save: saveMock,
      };

      mockReviewModel.findById.mockResolvedValue(reviewToUpdate);
      mockReviewModel.aggregate.mockResolvedValue([
        { averageRating: 4.5, numOfReviews: 2 },
      ]);
      mockSessionModel.findById.mockResolvedValue(mockSession);
      mockSessionModel.findByIdAndUpdate.mockResolvedValue(mockSession);

      const result = await service.updateReview(
        mockUserId,
        mockReviewId,
        updateDto,
      );

      expect(mockReviewModel.findById).toHaveBeenCalledWith(mockReviewId);
      expect(reviewToUpdate.rating).toBe(4);
      expect(reviewToUpdate.comment).toBe('Updated comment');
      expect(saveMock).toHaveBeenCalled();
      expect(mockSessionModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should throw NotFoundException if review not found', async () => {
      mockReviewModel.findById.mockResolvedValue(null);

      await expect(
        service.updateReview(mockUserId, mockReviewId, updateDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateReview(mockUserId, mockReviewId, updateDto),
      ).rejects.toThrow('Review not found.');
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      const differentUserId = new Types.ObjectId().toString();
      const reviewToUpdate = {
        ...mockReview,
        userId: new Types.ObjectId(differentUserId),
      };

      mockReviewModel.findById.mockResolvedValue(reviewToUpdate);

      await expect(
        service.updateReview(mockUserId, mockReviewId, updateDto),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateReview(mockUserId, mockReviewId, updateDto),
      ).rejects.toThrow('Unauthorized to update this review.');
    });
  });

  describe('deleteReview', () => {
    it('should delete review successfully', async () => {
      const deleteOneMock = jest.fn().mockResolvedValue({ deletedCount: 1 });
      const reviewToDelete = {
        ...mockReview,
        userId: new Types.ObjectId(mockUserId),
        sessionId: new Types.ObjectId(mockSessionId),
        deleteOne: deleteOneMock,
      };

      mockReviewModel.findById.mockResolvedValue(reviewToDelete);
      mockReviewModel.aggregate.mockResolvedValue([
        { averageRating: 4, numOfReviews: 1 },
      ]);
      mockSessionModel.findById.mockResolvedValue(mockSession);
      mockSessionModel.findByIdAndUpdate.mockResolvedValue(mockSession);

      const result = await service.deleteReview(mockUserId, mockReviewId);

      expect(mockReviewModel.findById).toHaveBeenCalledWith(mockReviewId);
      expect(deleteOneMock).toHaveBeenCalled();
      expect(mockSessionModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Review deleted successfully.' });
    });

    it('should throw NotFoundException if review not found', async () => {
      mockReviewModel.findById.mockResolvedValue(null);

      await expect(
        service.deleteReview(mockUserId, mockReviewId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.deleteReview(mockUserId, mockReviewId),
      ).rejects.toThrow('Review not found.');
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      const differentUserId = new Types.ObjectId().toString();
      const reviewToDelete = {
        ...mockReview,
        userId: new Types.ObjectId(differentUserId),
      };

      mockReviewModel.findById.mockResolvedValue(reviewToDelete);

      await expect(
        service.deleteReview(mockUserId, mockReviewId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.deleteReview(mockUserId, mockReviewId),
      ).rejects.toThrow('Unauthorized to delete this review.');
    });
  });

  describe('updateAverageRating', () => {
    it('should update session average rating when reviews exist', async () => {
      mockReviewModel.aggregate.mockResolvedValue([
        { averageRating: 4.5, numOfReviews: 10 },
      ]);
      mockSessionModel.findById.mockResolvedValue(mockSession);
      mockSessionModel.findByIdAndUpdate.mockResolvedValue({
        ...mockSession,
        averageRating: 4.5,
        numOfReviews: 10,
      });

      // Call through createReview to test private method
      const createDto: CreateReviewDto = {
        sessionId: mockSessionId,
        rating: 5,
        comment: 'Test',
      };

      const execMock = jest.fn().mockResolvedValue(null);
      mockReviewModel.findOne.mockReturnValue({ exec: execMock });
      mockReviewModel.create.mockResolvedValue(mockReview);

      await service.createReview(mockUserId, createDto);

      expect(mockReviewModel.aggregate).toHaveBeenCalledWith([
        { $match: { sessionId: new Types.ObjectId(mockSessionId) } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            numOfReviews: { $sum: 1 },
          },
        },
      ]);
      expect(mockSessionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockSessionId,
        {
          averageRating: 4.5,
          numOfReviews: 10,
        },
      );
    });

    it('should set rating to 0 when no reviews exist', async () => {
      mockReviewModel.aggregate.mockResolvedValue([]);
      mockSessionModel.findById.mockResolvedValue(mockSession);
      mockSessionModel.findByIdAndUpdate.mockResolvedValue({
        ...mockSession,
        averageRating: 0,
        numOfReviews: 0,
      });

      const deleteOneMock = jest.fn().mockResolvedValue({ deletedCount: 1 });
      const reviewToDelete = {
        ...mockReview,
        userId: new Types.ObjectId(mockUserId),
        sessionId: new Types.ObjectId(mockSessionId),
        deleteOne: deleteOneMock,
      };

      mockReviewModel.findById.mockResolvedValue(reviewToDelete);

      await service.deleteReview(mockUserId, mockReviewId);

      expect(mockSessionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockSessionId,
        {
          averageRating: 0,
          numOfReviews: 0,
        },
      );
    });
  });
});
