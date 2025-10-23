import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './review.controller';
import { ReviewsService } from './review.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let service: ReviewsService;

  const mockReviewsService = {
    getReviewsBySessionId: jest.fn(),
    getUserReviewForSession: jest.fn(),
    createReview: jest.fn(),
    updateReview: jest.fn(),
    deleteReview: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: mockReviewsService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ReviewsController>(ReviewsController);
    service = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ✅ Test getReviewsBySession
  describe('getReviewsBySession', () => {
    it('should return all reviews for a given session', async () => {
      const sessionId = 'session123';
      const mockReviews = [{ id: 'r1', comment: 'Great!' }];
      mockReviewsService.getReviewsBySessionId.mockResolvedValue(mockReviews);

      const result = await controller.getReviewsBySession(sessionId);
      expect(result).toEqual(mockReviews);
      expect(service.getReviewsBySessionId).toHaveBeenCalledWith(sessionId);
    });
  });

  // ✅ Test getUserReview
  describe('getUserReview', () => {
    it('should return logged-in user review for a session', async () => {
      const user = { _id: 'user123' };
      const sessionId = 'session123';
      const mockReview = { id: 'r1', rating: 5 };
      mockReviewsService.getUserReviewForSession.mockResolvedValue(mockReview);

      const result = await controller.getUserReview(user, sessionId);
      expect(result).toEqual(mockReview);
      expect(service.getUserReviewForSession).toHaveBeenCalledWith(
        'user123',
        sessionId,
      );
    });
  });

  // ✅ Test createReview
  describe('createReview', () => {
    it('should create a review for the logged-in user', async () => {
      const user = { _id: 'user123' };
      const dto: CreateReviewDto = {
        sessionId: 'session123',
        rating: 5,
        comment: 'Excellent!',
      };
      const mockCreated = { id: 'r1', ...dto };
      mockReviewsService.createReview.mockResolvedValue(mockCreated);

      const result = await controller.createReview(user, dto);
      expect(result).toEqual(mockCreated);
      expect(service.createReview).toHaveBeenCalledWith('user123', dto);
    });
  });

  // ✅ Test updateReview
  describe('updateReview', () => {
    it('should update a review by ID', async () => {
      const user = { _id: 'user123' };
      const reviewId = 'r1';
      const dto: UpdateReviewDto = { rating: 4, comment: 'Updated comment' };
      const mockUpdated = { id: reviewId, ...dto };
      mockReviewsService.updateReview.mockResolvedValue(mockUpdated);

      const result = await controller.updateReview(user, reviewId, dto);
      expect(result).toEqual(mockUpdated);
      expect(service.updateReview).toHaveBeenCalledWith(
        'user123',
        reviewId,
        dto,
      );
    });
  });

  // ✅ Test deleteReview
  describe('deleteReview', () => {
    it('should delete a review by ID', async () => {
      const user = { _id: 'user123' };
      const reviewId = 'r1';
      const mockDeleted = { deleted: true };
      mockReviewsService.deleteReview.mockResolvedValue(mockDeleted);

      const result = await controller.deleteReview(user, reviewId);
      expect(result).toEqual(mockDeleted);
      expect(service.deleteReview).toHaveBeenCalledWith('user123', reviewId);
    });
  });
});
