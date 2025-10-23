import { Test, TestingModule } from '@nestjs/testing';
import { ObservationController } from './observations.controller';
import { ObservationService } from './observations.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { FacultyObservationDto } from './dto/faculty-observation.dto';
import { UserObservationDto } from './dto/user-observation.dto';

describe('ObservationController', () => {
  let controller: ObservationController;
  let service: ObservationService;

  const mockObservationService = {
    createObservation: jest.fn(),
    addFacultyObservation: jest.fn(),
    addUserObservation: jest.fn(),
    getObservationsBySession: jest.fn(),
    getObservationWithUserResponses: jest.fn(),
    getUserObservations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObservationController],
      providers: [
        {
          provide: ObservationService,
          useValue: mockObservationService,
        },
      ],
    }).compile();

    controller = module.get<ObservationController>(ObservationController);
    service = module.get<ObservationService>(ObservationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createObservation', () => {
    it('should create a new observation', async () => {
      const dto: CreateObservationDto = {
        sessionId: 'session123',
        title: 'Observation 1',
        description: 'Test observation',
      };

      const mockResult = { id: 'obs1', ...dto };
      mockObservationService.createObservation.mockResolvedValue(mockResult);

      const result = await controller.createObservation(dto);

      expect(result).toEqual(mockResult);
      expect(service.createObservation).toHaveBeenCalledWith(dto);
    });
  });

  // ✅ addFacultyObservation
  describe('addFacultyObservation', () => {
    it('should add faculty observation', async () => {
      const id = 'obs1';
      const dto: FacultyObservationDto = {
        facultyId: 'fac123',
        comments: 'Good performance',
      };

      const mockResult = { id, ...dto };
      mockObservationService.addFacultyObservation.mockResolvedValue(
        mockResult,
      );

      const result = await controller.addFacultyObservation(id, dto);

      expect(result).toEqual(mockResult);
      expect(service.addFacultyObservation).toHaveBeenCalledWith(id, dto);
    });
  });

  // ✅ addUserObservation
  describe('addUserObservation', () => {
    it('should add user observation', async () => {
      const observationId = 'obs1';
      const dto: UserObservationDto = {
        userId: 'user123',
        response: 'Participated actively',
      };

      const mockResult = { observationId, ...dto };
      mockObservationService.addUserObservation.mockResolvedValue(mockResult);

      const result = await controller.addUserObservation(observationId, dto);

      expect(result).toEqual(mockResult);
      expect(service.addUserObservation).toHaveBeenCalledWith(
        observationId,
        dto,
      );
    });
  });

  // ✅ getObservationsBySession
  describe('getObservationsBySession', () => {
    it('should return observations for a given session', async () => {
      const sessionId = 'session123';
      const mockResult = [{ id: 'obs1' }, { id: 'obs2' }];
      mockObservationService.getObservationsBySession.mockResolvedValue(
        mockResult,
      );

      const result = await controller.getObservationsBySession(sessionId);

      expect(result).toEqual(mockResult);
      expect(service.getObservationsBySession).toHaveBeenCalledWith(sessionId);
    });
  });

  // ✅ getObservationWithUserResponses
  describe('getObservationWithUserResponses', () => {
    it('should return an observation with user responses', async () => {
      const id = 'obs1';
      const mockResult = { id, responses: [] };
      mockObservationService.getObservationWithUserResponses.mockResolvedValue(
        mockResult,
      );

      const result = await controller.getObservationWithUserResponses(id);

      expect(result).toEqual(mockResult);
      expect(service.getObservationWithUserResponses).toHaveBeenCalledWith(id);
    });
  });

  // ✅ getUserObservations
  describe('getUserObservations', () => {
    it('should return all observations for a user', async () => {
      const userId = 'user123';
      const mockResult = [{ id: 'obs1' }, { id: 'obs2' }];
      mockObservationService.getUserObservations.mockResolvedValue(mockResult);

      const result = await controller.getUserObservations(userId);

      expect(result).toEqual(mockResult);
      expect(service.getUserObservations).toHaveBeenCalledWith(userId);
    });
  });
});
