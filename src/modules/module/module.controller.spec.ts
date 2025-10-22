import { Test, TestingModule } from '@nestjs/testing';
import { ModuleController } from './module.controller';
import { ModuleService } from './module.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('ModuleController', () => {
  let controller: ModuleController;
  let service: ModuleService;

  const mockModuleService = {
    findAll: jest.fn(),
    getModulesWithPathologyCount: jest.fn(),
    getModulesWithSessionCount: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModuleController],
      providers: [
        {
          provide: ModuleService,
          useValue: mockModuleService,
        },
      ],
    }).compile();

    controller = module.get<ModuleController>(ModuleController);
    service = module.get<ModuleService>(ModuleService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getModules', () => {
    it('should return all modules successfully', async () => {
      const mockModules = [
        { _id: '1', moduleName: 'Module 1' },
        { _id: '2', moduleName: 'Module 2' },
      ];

      mockModuleService.findAll.mockResolvedValue(mockModules);

      const result = await controller.getModules();

      expect(result).toEqual({
        message: 'Got Modules Successfully',
        data: mockModules,
      });
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when no modules found', async () => {
      mockModuleService.findAll.mockResolvedValue([]);

      await expect(controller.getModules()).rejects.toThrow(NotFoundException);
      await expect(controller.getModules()).rejects.toThrow('Not Found');
    });

    it('should throw NotFoundException when modules is null', async () => {
      mockModuleService.findAll.mockResolvedValue(null);

      await expect(controller.getModules()).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException on service error', async () => {
      mockModuleService.findAll.mockRejectedValue(new Error('Database error'));

      await expect(controller.getModules()).rejects.toThrow(NotFoundException);
    });
  });

  describe('getModulesWithPathologyCount', () => {
    it('should return modules with pathology count successfully', async () => {
      const mockModules = [
        {
          _id: '1',
          moduleName: 'Module 1',
          totalPathologiesCount: 5,
          randomPathologyNames: ['Path1', 'Path2', 'Path3'],
        },
        {
          _id: '2',
          moduleName: 'Module 2',
          totalPathologiesCount: 3,
          randomPathologyNames: ['Path4', 'Path5'],
        },
      ];

      mockModuleService.getModulesWithPathologyCount.mockResolvedValue(
        mockModules,
      );

      const result = await controller.getModulesWithPathologyCount();

      expect(result).toEqual({
        message:
          'Got Modules with Pathology Count and Sample Pathologies Successfully',
        data: mockModules,
      });
      expect(service.getModulesWithPathologyCount).toHaveBeenCalledTimes(1);
    });

    it('should return empty data when no modules found', async () => {
      mockModuleService.getModulesWithPathologyCount.mockResolvedValue([]);

      const result = await controller.getModulesWithPathologyCount();

      expect(result).toEqual({
        message: 'No modules found',
        data: [],
      });
    });

    it('should return empty data when modules is null', async () => {
      mockModuleService.getModulesWithPathologyCount.mockResolvedValue(null);

      const result = await controller.getModulesWithPathologyCount();

      expect(result).toEqual({
        message: 'No modules found',
        data: [],
      });
    });

    it('should throw InternalServerErrorException on service error', async () => {
      mockModuleService.getModulesWithPathologyCount.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.getModulesWithPathologyCount()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.getModulesWithPathologyCount()).rejects.toThrow(
        'Internal Server Error',
      );
    });
  });

  describe('getModulesWithSessionCount', () => {
    it('should return modules with session count successfully', async () => {
      const mockModules = [
        {
          _id: '1',
          moduleName: 'Module 1',
          totalPathologiesCount: 5,
          totalSessionsCount: 10,
          randomPathologyNames: ['Path1', 'Path2', 'Path3'],
        },
        {
          _id: '2',
          moduleName: 'Module 2',
          totalPathologiesCount: 3,
          totalSessionsCount: 7,
          randomPathologyNames: ['Path4'],
        },
      ];

      mockModuleService.getModulesWithSessionCount.mockResolvedValue(
        mockModules,
      );

      const result = await controller.getModulesWithSessionCount();

      expect(result).toEqual({
        message:
          'Got Modules with Session, Pathology Count, and Sample Pathologies Successfully',
        data: mockModules,
      });
      expect(service.getModulesWithSessionCount).toHaveBeenCalledTimes(1);
    });

    it('should return empty data when no modules found', async () => {
      mockModuleService.getModulesWithSessionCount.mockResolvedValue([]);

      const result = await controller.getModulesWithSessionCount();

      expect(result).toEqual({
        message: 'No modules found',
        data: [],
      });
    });

    it('should return empty data when modules is null', async () => {
      mockModuleService.getModulesWithSessionCount.mockResolvedValue(null);

      const result = await controller.getModulesWithSessionCount();

      expect(result).toEqual({
        message: 'No modules found',
        data: [],
      });
    });

    it('should throw InternalServerErrorException on service error', async () => {
      mockModuleService.getModulesWithSessionCount.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.getModulesWithSessionCount()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.getModulesWithSessionCount()).rejects.toThrow(
        'Internal Server Error',
      );
    });
  });

  describe('createModules', () => {
    it('should create module successfully with file', async () => {
      const createDto: CreateModuleDto = {
        moduleName: 'New Module',
        description: 'New Description',
      };
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024,
        filename: 'test-123.jpg',
      } as Express.Multer.File;
      const mockCreatedModule = {
        _id: '1',
        ...createDto,
        imageUrl: '/uploads/test-123.jpg',
      };

      mockModuleService.create.mockResolvedValue(mockCreatedModule);

      const result = await controller.createModules(createDto, mockFile);

      expect(result).toEqual({
        message: 'Modules Created Successfully',
        data: mockCreatedModule,
      });
      expect(service.create).toHaveBeenCalledWith(createDto, mockFile);
    });

    it('should create module successfully without file', async () => {
      const createDto: CreateModuleDto = {
        moduleName: 'New Module',
        description: 'New Description',
      };
      const mockCreatedModule = {
        _id: '1',
        ...createDto,
        imageUrl: null,
      };

      mockModuleService.create.mockResolvedValue(mockCreatedModule);

      const result = await controller.createModules(createDto, undefined);

      expect(result).toEqual({
        message: 'Modules Created Successfully',
        data: mockCreatedModule,
      });
      expect(service.create).toHaveBeenCalledWith(createDto, undefined);
    });

    it('should throw InternalServerErrorException when module creation returns null', async () => {
      const createDto: CreateModuleDto = {
        moduleName: 'New Module',
        description: 'New Description',
      };
      const mockFile = {} as Express.Multer.File;

      mockModuleService.create.mockResolvedValue(null);

      await expect(
        controller.createModules(createDto, mockFile),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        controller.createModules(createDto, mockFile),
      ).rejects.toThrow('Internal Server Error');
    });

    it('should throw InternalServerErrorException on service error', async () => {
      const createDto: CreateModuleDto = {
        moduleName: 'New Module',
        description: 'New Description',
      };
      const mockFile = {} as Express.Multer.File;

      mockModuleService.create.mockRejectedValue(new Error('Creation failed'));

      await expect(
        controller.createModules(createDto, mockFile),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when BadRequestException occurs', async () => {
      const createDto: CreateModuleDto = {
        moduleName: 'New Module',
        description: 'New Description',
      };
      const mockFile = {} as Express.Multer.File;

      mockModuleService.create.mockRejectedValue(
        new BadRequestException('Invalid data'),
      );

      await expect(
        controller.createModules(createDto, mockFile),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateModules', () => {
    it('should update module successfully', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateModuleDto = {
        moduleName: 'Updated Module',
        description: 'Updated Description',
      };
      const mockUpdatedModule = {
        _id: id,
        ...updateDto,
      };

      mockModuleService.update.mockResolvedValue(mockUpdatedModule);

      const result = await controller.updateModules(id, updateDto);

      expect(result).toEqual({
        message: 'Modules Updated Successfully',
        data: mockUpdatedModule,
      });
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should update module with only moduleName', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateModuleDto = {
        moduleName: 'Updated Module',
      };
      const mockUpdatedModule = {
        _id: id,
        moduleName: updateDto.moduleName,
        description: 'Old Description',
      };

      mockModuleService.update.mockResolvedValue(mockUpdatedModule);

      const result = await controller.updateModules(id, updateDto);

      expect(result).toEqual({
        message: 'Modules Updated Successfully',
        data: mockUpdatedModule,
      });
    });

    it('should update module with only description', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateModuleDto = {
        description: 'Updated Description',
      };
      const mockUpdatedModule = {
        _id: id,
        moduleName: 'Old Module Name',
        description: updateDto.description,
      };

      mockModuleService.update.mockResolvedValue(mockUpdatedModule);

      const result = await controller.updateModules(id, updateDto);

      expect(result).toEqual({
        message: 'Modules Updated Successfully',
        data: mockUpdatedModule,
      });
    });

    it('should throw BadRequestException when id is not provided', async () => {
      const updateDto: UpdateModuleDto = {
        moduleName: 'Updated Module',
      };

      await expect(controller.updateModules('', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.updateModules('', updateDto)).rejects.toThrow(
        'Module ID is required for update.',
      );
    });

    it('should throw BadRequestException when id is undefined', async () => {
      const updateDto: UpdateModuleDto = {
        moduleName: 'Updated Module',
      };

      await expect(
        controller.updateModules(undefined, updateDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.updateModules(undefined, updateDto),
      ).rejects.toThrow('Module ID is required for update.');
    });

    it('should throw NotFoundException when update returns null', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateModuleDto = {
        moduleName: 'Updated Module',
      };

      mockModuleService.update.mockResolvedValue(null);

      await expect(controller.updateModules(id, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.updateModules(id, updateDto)).rejects.toThrow(
        'Module not found to update',
      );
    });

    it('should rethrow NotFoundException from service', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateModuleDto = {
        moduleName: 'Updated Module',
      };

      mockModuleService.update.mockRejectedValue(
        new NotFoundException('Module not found'),
      );

      await expect(controller.updateModules(id, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.updateModules(id, updateDto)).rejects.toThrow(
        'Module not found',
      );
    });

    it('should rethrow BadRequestException from service', async () => {
      const id = 'invalid-id';
      const updateDto: UpdateModuleDto = {
        moduleName: 'Updated Module',
      };

      mockModuleService.update.mockRejectedValue(
        new BadRequestException('Invalid module ID'),
      );

      await expect(controller.updateModules(id, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.updateModules(id, updateDto)).rejects.toThrow(
        'Invalid module ID',
      );
    });

    it('should throw InternalServerErrorException on other service errors', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateModuleDto = {
        moduleName: 'Updated Module',
      };

      mockModuleService.update.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(controller.updateModules(id, updateDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.updateModules(id, updateDto)).rejects.toThrow(
        'Error in updating module',
      );
    });

    it('should handle empty updateDto', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateModuleDto = {};
      const mockUpdatedModule = {
        _id: id,
        moduleName: 'Original Module',
        description: 'Original Description',
      };

      mockModuleService.update.mockResolvedValue(mockUpdatedModule);

      const result = await controller.updateModules(id, updateDto);

      expect(result).toEqual({
        message: 'Modules Updated Successfully',
        data: mockUpdatedModule,
      });
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });
  });
});
