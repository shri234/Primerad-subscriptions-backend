import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ModuleService } from './module.service';
import { Module as ModuleEntity, ModuleDocument } from './schema/module.schema';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';

describe('ModuleService', () => {
  let service: ModuleService;
  let model: Model<ModuleDocument>;

  const mockModule = {
    _id: '507f1f77bcf86cd799439011',
    moduleName: 'Test Module',
    description: 'Test Description',
    imageUrl: '/uploads/test.jpg',
  };

  const mockModuleModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    aggregate: jest.fn(),
    save: jest.fn(),
    exec: jest.fn(),
  };

  const mockModuleInstance = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleService,
        {
          provide: getModelToken(ModuleEntity.name),
          useValue: {
            ...mockModuleModel,
            prototype: mockModuleInstance,
          },
        },
      ],
    }).compile();

    service = module.get<ModuleService>(ModuleService);
    model = module.get<Model<ModuleDocument>>(getModelToken(ModuleEntity.name));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all modules with only moduleName field', async () => {
      const mockModules = [
        { _id: '1', moduleName: 'Module 1' },
        { _id: '2', moduleName: 'Module 2' },
      ];

      const execMock = jest.fn().mockResolvedValue(mockModules);
      mockModuleModel.find.mockReturnValue({ exec: execMock });

      const result = await service.findAll();

      expect(result).toEqual(mockModules);
      expect(mockModuleModel.find).toHaveBeenCalledWith({}, { moduleName: 1 });
      expect(execMock).toHaveBeenCalled();
    });

    it('should return empty array when no modules exist', async () => {
      const execMock = jest.fn().mockResolvedValue([]);
      mockModuleModel.find.mockReturnValue({ exec: execMock });

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a module when found', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const execMock = jest.fn().mockResolvedValue(mockModule);
      mockModuleModel.findById.mockReturnValue({ exec: execMock });

      const result = await service.findById(moduleId);

      expect(result).toEqual(mockModule);
      expect(mockModuleModel.findById).toHaveBeenCalledWith(moduleId);
      expect(execMock).toHaveBeenCalled();
    });

    it('should throw NotFoundException when module not found', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const execMock = jest.fn().mockResolvedValue(null);
      mockModuleModel.findById.mockReturnValue({ exec: execMock });

      await expect(service.findById(moduleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById(moduleId)).rejects.toThrow(
        'Module Not Found',
      );
    });
  });

  describe('getModulesWithPathologyCount', () => {
    it('should return modules with pathology count and random names', async () => {
      const mockAggregateResult = [
        {
          _id: '1',
          moduleName: 'Module 1',
          totalPathologiesCount: 5,
          randomPathologyNames: ['Pathology A', 'Pathology B', 'Pathology C'],
        },
        {
          _id: '2',
          moduleName: 'Module 2',
          totalPathologiesCount: 3,
          randomPathologyNames: ['Pathology D', 'Pathology E'],
        },
      ];

      mockModuleModel.aggregate.mockResolvedValue(mockAggregateResult);

      const result = await service.getModulesWithPathologyCount();

      expect(result).toEqual(mockAggregateResult);
      expect(mockModuleModel.aggregate).toHaveBeenCalledWith([
        {
          $lookup: {
            from: 'pathologies',
            localField: '_id',
            foreignField: 'moduleId',
            as: 'pathologies',
          },
        },
        {
          $addFields: {
            totalPathologiesCount: { $size: '$pathologies' },
            pathologyNames: '$pathologies.pathologyName',
          },
        },
        {
          $project: {
            moduleName: 1,
            totalPathologiesCount: 1,
            randomPathologyNames: {
              $let: {
                vars: {
                  randomIndex: {
                    $floor: {
                      $multiply: [{ $size: '$pathologyNames' }, { $rand: {} }],
                    },
                  },
                },
                in: {
                  $slice: ['$pathologyNames', '$$randomIndex', 3],
                },
              },
            },
          },
        },
      ]);
    });

    it('should return empty array when no modules exist', async () => {
      mockModuleModel.aggregate.mockResolvedValue([]);

      const result = await service.getModulesWithPathologyCount();

      expect(result).toEqual([]);
    });

    it('should handle modules with no pathologies', async () => {
      const mockAggregateResult = [
        {
          _id: '1',
          moduleName: 'Module 1',
          totalPathologiesCount: 0,
          randomPathologyNames: [],
        },
      ];

      mockModuleModel.aggregate.mockResolvedValue(mockAggregateResult);

      const result = await service.getModulesWithPathologyCount();

      expect(result).toEqual(mockAggregateResult);
    });
  });

  describe('getModulesWithSessionCount', () => {
    it('should return modules with session and pathology counts', async () => {
      const mockAggregateResult = [
        {
          _id: '1',
          moduleName: 'Module 1',
          totalPathologiesCount: 5,
          totalSessionsCount: 10,
          randomPathologyNames: ['Pathology A', 'Pathology B', 'Pathology C'],
        },
        {
          _id: '2',
          moduleName: 'Module 2',
          totalPathologiesCount: 3,
          totalSessionsCount: 7,
          randomPathologyNames: ['Pathology D'],
        },
      ];

      mockModuleModel.aggregate.mockResolvedValue(mockAggregateResult);

      const result = await service.getModulesWithSessionCount();

      expect(result).toEqual(mockAggregateResult);
      expect(mockModuleModel.aggregate).toHaveBeenCalledWith([
        {
          $lookup: {
            from: 'pathologies',
            localField: '_id',
            foreignField: 'moduleId',
            as: 'pathologies',
          },
        },
        {
          $lookup: {
            from: 'recordedlectures',
            localField: '_id',
            foreignField: 'moduleId',
            as: 'recordedLectures',
          },
        },
        {
          $lookup: {
            from: 'liveprograms',
            localField: '_id',
            foreignField: 'moduleId',
            as: 'livePrograms',
          },
        },
        {
          $lookup: {
            from: 'dicomcases',
            localField: '_id',
            foreignField: 'moduleId',
            as: 'dicomCases',
          },
        },
        {
          $addFields: {
            totalSessionsCount: {
              $add: [
                { $size: '$recordedLectures' },
                { $size: '$livePrograms' },
                { $size: '$dicomCases' },
              ],
            },
            totalPathologiesCount: { $size: '$pathologies' },
            pathologyNames: '$pathologies.pathologyName',
          },
        },
        {
          $project: {
            moduleName: 1,
            totalPathologiesCount: 1,
            totalSessionsCount: 1,
            randomPathologyNames: {
              $let: {
                vars: {
                  randomIndex: {
                    $floor: {
                      $multiply: [{ $size: '$pathologyNames' }, { $rand: {} }],
                    },
                  },
                },
                in: {
                  $slice: ['$pathologyNames', '$$randomIndex', 3],
                },
              },
            },
          },
        },
      ]);
    });

    it('should return empty array when no modules exist', async () => {
      mockModuleModel.aggregate.mockResolvedValue([]);

      const result = await service.getModulesWithSessionCount();

      expect(result).toEqual([]);
    });

    it('should handle modules with no sessions or pathologies', async () => {
      const mockAggregateResult = [
        {
          _id: '1',
          moduleName: 'Module 1',
          totalPathologiesCount: 0,
          totalSessionsCount: 0,
          randomPathologyNames: [],
        },
      ];

      mockModuleModel.aggregate.mockResolvedValue(mockAggregateResult);

      const result = await service.getModulesWithSessionCount();

      expect(result).toEqual(mockAggregateResult);
    });
  });

  describe('create', () => {
    it('should create a module successfully with file', async () => {
      const createDto: CreateModuleDto = {
        moduleName: 'New Module',
        description: 'New Description',
      };

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024,
        filename: 'test-123.jpg',
      } as Express.Multer.File;

      const expectedModule = {
        _id: '1',
        moduleName: createDto.moduleName,
        description: createDto.description,
        imageUrl: '/uploads/test-123.jpg',
        save: jest.fn().mockResolvedValue({
          _id: '1',
          moduleName: createDto.moduleName,
          description: createDto.description,
          imageUrl: '/uploads/test-123.jpg',
        }),
      };

      // Mock the constructor to return our mock instance
      (model as any) = jest.fn().mockReturnValue(expectedModule);
      service = new ModuleService(model);

      const result = await service.create(createDto, mockFile);

      expect(result).toEqual({
        _id: '1',
        moduleName: createDto.moduleName,
        description: createDto.description,
        imageUrl: '/uploads/test-123.jpg',
      });
    });

    it('should create a module successfully without file', async () => {
      const createDto: CreateModuleDto = {
        moduleName: 'New Module',
        description: 'New Description',
      };

      const expectedModule = {
        _id: '1',
        moduleName: createDto.moduleName,
        description: createDto.description,
        imageUrl: null,
        save: jest.fn().mockResolvedValue({
          _id: '1',
          moduleName: createDto.moduleName,
          description: createDto.description,
          imageUrl: null,
        }),
      };

      (model as any) = jest.fn().mockReturnValue(expectedModule);
      service = new ModuleService(model);

      const result = await service.create(createDto);

      expect(result).toEqual({
        _id: '1',
        moduleName: createDto.moduleName,
        description: createDto.description,
        imageUrl: null,
      });
    });

    it('should throw BadRequestException when save fails', async () => {
      const createDto: CreateModuleDto = {
        moduleName: 'New Module',
        description: 'New Description',
      };

      const expectedModule = {
        save: jest.fn().mockResolvedValue(null),
      };

      (model as any) = jest.fn().mockReturnValue(expectedModule);
      service = new ModuleService(model);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow('Bad Request');
    });

    it('should handle save error', async () => {
      const createDto: CreateModuleDto = {
        moduleName: 'New Module',
        description: 'New Description',
      };

      const expectedModule = {
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (model as any) = jest.fn().mockReturnValue(expectedModule);
      service = new ModuleService(model);

      await expect(service.create(createDto)).rejects.toThrow('Database error');
    });
  });

  describe('update', () => {
    it('should update module with moduleName only', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const updateDto: UpdateModuleDto = {
        moduleName: 'Updated Module Name',
      };

      const updatedModule = {
        _id: moduleId,
        moduleName: updateDto.moduleName,
        description: 'Old Description',
      };

      const execMock = jest.fn().mockResolvedValue(updatedModule);
      mockModuleModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      const result = await service.update(moduleId, updateDto);

      expect(result).toEqual(updatedModule);
      expect(mockModuleModel.findByIdAndUpdate).toHaveBeenCalledWith(
        moduleId,
        { moduleName: updateDto.moduleName },
        { new: true },
      );
      expect(execMock).toHaveBeenCalled();
    });

    it('should update module with description only', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const updateDto: UpdateModuleDto = {
        description: 'Updated Description',
      };

      const updatedModule = {
        _id: moduleId,
        moduleName: 'Old Module Name',
        description: updateDto.description,
      };

      const execMock = jest.fn().mockResolvedValue(updatedModule);
      mockModuleModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      const result = await service.update(moduleId, updateDto);

      expect(result).toEqual(updatedModule);
      expect(mockModuleModel.findByIdAndUpdate).toHaveBeenCalledWith(
        moduleId,
        { description: updateDto.description },
        { new: true },
      );
    });

    it('should update module with both moduleName and description', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const updateDto: UpdateModuleDto = {
        moduleName: 'Updated Module Name',
        description: 'Updated Description',
      };

      const updatedModule = {
        _id: moduleId,
        moduleName: updateDto.moduleName,
        description: updateDto.description,
      };

      const execMock = jest.fn().mockResolvedValue(updatedModule);
      mockModuleModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      const result = await service.update(moduleId, updateDto);

      expect(result).toEqual(updatedModule);
      expect(mockModuleModel.findByIdAndUpdate).toHaveBeenCalledWith(
        moduleId,
        {
          moduleName: updateDto.moduleName,
          description: updateDto.description,
        },
        { new: true },
      );
    });

    it('should handle description set to empty string', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const updateDto: UpdateModuleDto = {
        description: '',
      };

      const updatedModule = {
        _id: moduleId,
        moduleName: 'Module Name',
        description: '',
      };

      const execMock = jest.fn().mockResolvedValue(updatedModule);
      mockModuleModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      const result = await service.update(moduleId, updateDto);

      expect(result).toEqual(updatedModule);
      expect(mockModuleModel.findByIdAndUpdate).toHaveBeenCalledWith(
        moduleId,
        { description: '' },
        { new: true },
      );
    });

    it('should throw NotFoundException when module not found', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const updateDto: UpdateModuleDto = {
        moduleName: 'Updated Module Name',
      };

      const execMock = jest.fn().mockResolvedValue(null);
      mockModuleModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      await expect(service.update(moduleId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(moduleId, updateDto)).rejects.toThrow(
        'Module Not Found',
      );
    });

    it('should not update when no fields provided', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const updateDto: UpdateModuleDto = {};

      const originalModule = {
        _id: moduleId,
        moduleName: 'Original Module Name',
        description: 'Original Description',
      };

      const execMock = jest.fn().mockResolvedValue(originalModule);
      mockModuleModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      const result = await service.update(moduleId, updateDto);

      expect(result).toEqual(originalModule);
      expect(mockModuleModel.findByIdAndUpdate).toHaveBeenCalledWith(
        moduleId,
        {},
        { new: true },
      );
    });

    it('should handle database error during update', async () => {
      const moduleId = '507f1f77bcf86cd799439011';
      const updateDto: UpdateModuleDto = {
        moduleName: 'Updated Module Name',
      };

      const execMock = jest
        .fn()
        .mockRejectedValue(new Error('Database connection failed'));
      mockModuleModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      await expect(service.update(moduleId, updateDto)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
