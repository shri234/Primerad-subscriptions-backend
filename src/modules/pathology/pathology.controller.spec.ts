import { Test, TestingModule } from '@nestjs/testing';
import { PathologyController } from './pathology.controller';
import { PathologyService } from './pathology.service';
import { CreatePathologyDto } from './dto/create-pathology.dto';
import { UpdatePathologyDto } from './dto/update-pathology.dto';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';

describe('PathologyController', () => {
  let controller: PathologyController;
  let service: PathologyService;

  const mockPathologyService = {
    findAll: jest.fn(),
    getPathologyImagePath: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findByModuleIds: jest.fn(),
  };

  const mockResponse = () => {
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      sendFile: jest.fn().mockReturnThis(),
    };
    return res as Response;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PathologyController],
      providers: [
        {
          provide: PathologyService,
          useValue: mockPathologyService,
        },
      ],
    }).compile();

    controller = module.get<PathologyController>(PathologyController);
    service = module.get<PathologyService>(PathologyService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPathologies', () => {
    it('should return all pathologies successfully', async () => {
      const mockPathologies = [
        { id: '1', name: 'Pathology 1' },
        { id: '2', name: 'Pathology 2' },
      ];

      mockPathologyService.findAll.mockResolvedValue(mockPathologies);

      const result = await controller.getPathologies();

      expect(result).toEqual({
        message: 'Got Pathologies Successfully',
        data: mockPathologies,
      });
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when no pathologies found', async () => {
      mockPathologyService.findAll.mockResolvedValue([]);

      await expect(controller.getPathologies()).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.getPathologies()).rejects.toThrow('Not Found');
    });

    it('should throw NotFoundException when pathologies is null', async () => {
      mockPathologyService.findAll.mockResolvedValue(null);

      await expect(controller.getPathologies()).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException on service error', async () => {
      mockPathologyService.findAll.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.getPathologies()).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPathologyImages', () => {
    it('should return image successfully', async () => {
      const mockImagePath = '/path/to/image.jpg';
      const pathologyId = '123';
      const res = mockResponse();

      mockPathologyService.getPathologyImagePath.mockResolvedValue(
        mockImagePath,
      );

      await controller.getPathologyImages(pathologyId, res);

      expect(service.getPathologyImagePath).toHaveBeenCalledWith(pathologyId);
      expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
      expect(res.sendFile).toHaveBeenCalledWith(mockImagePath);
    });

    it('should handle NotFoundException', async () => {
      const pathologyId = '123';
      const res = mockResponse();

      mockPathologyService.getPathologyImagePath.mockRejectedValue(
        new NotFoundException('Image not found'),
      );

      await controller.getPathologyImages(pathologyId, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Image not found',
      });
    });

    it('should handle internal server error', async () => {
      const pathologyId = '123';
      const res = mockResponse();

      mockPathologyService.getPathologyImagePath.mockRejectedValue(
        new Error('Server error'),
      );

      await controller.getPathologyImages(pathologyId, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server Error',
        error: 'Server error',
      });
    });
  });

  describe('createPathologies', () => {
    it('should create pathology successfully', async () => {
      const moduleId = 'module-123';
      const createDto: CreatePathologyDto = {
        name: 'New Pathology',
      } as CreatePathologyDto;
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024,
      } as Express.Multer.File;
      const mockCreatedPathology = { id: '1', ...createDto };

      mockPathologyService.create.mockResolvedValue(mockCreatedPathology);

      const result = await controller.createPathologies(
        moduleId,
        createDto,
        mockFile,
      );

      expect(result).toEqual({
        message: 'Pathologies Created Successfully',
        data: mockCreatedPathology,
      });
      expect(service.create).toHaveBeenCalledWith(
        moduleId.trim(),
        createDto,
        mockFile,
      );
    });

    it('should handle moduleId with whitespace', async () => {
      const moduleId = '  module-123  ';
      const createDto: CreatePathologyDto = {
        name: 'New Pathology',
      } as CreatePathologyDto;
      const mockFile = {} as Express.Multer.File;
      const mockCreatedPathology = { id: '1', ...createDto };

      mockPathologyService.create.mockResolvedValue(mockCreatedPathology);

      await controller.createPathologies(moduleId, createDto, mockFile);

      expect(service.create).toHaveBeenCalledWith(
        'module-123',
        createDto,
        mockFile,
      );
    });

    it('should throw BadRequestException on service error', async () => {
      const moduleId = 'module-123';
      const createDto: CreatePathologyDto = {
        name: 'New Pathology',
      } as CreatePathologyDto;
      const mockFile = {} as Express.Multer.File;

      mockPathologyService.create.mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(
        controller.createPathologies(moduleId, createDto, mockFile),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePathologies', () => {
    it('should update pathology successfully', async () => {
      const id = '123';
      const updateDto: UpdatePathologyDto = {
        name: 'Updated Pathology',
      } as UpdatePathologyDto;
      const mockUpdatedPathology = { id, ...updateDto };

      mockPathologyService.update.mockResolvedValue(mockUpdatedPathology);

      const result = await controller.updatePathologies(id, updateDto);

      expect(result).toEqual({
        message: 'Pathologies Updated Successfully',
        data: mockUpdatedPathology,
      });
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should throw InternalServerErrorException when update returns null', async () => {
      const id = '123';
      const updateDto: UpdatePathologyDto = {
        name: 'Updated Pathology',
      } as UpdatePathologyDto;

      mockPathologyService.update.mockResolvedValue(null);

      await expect(controller.updatePathologies(id, updateDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.updatePathologies(id, updateDto)).rejects.toThrow(
        'Not Found to update pathology',
      );
    });

    it('should throw InternalServerErrorException on service error', async () => {
      const id = '123';
      const updateDto: UpdatePathologyDto = {
        name: 'Updated Pathology',
      } as UpdatePathologyDto;

      mockPathologyService.update.mockRejectedValue(new Error('Update failed'));

      await expect(controller.updatePathologies(id, updateDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.updatePathologies(id, updateDto)).rejects.toThrow(
        'Not Found to update pathology',
      );
    });
  });

  describe('getPathologiesByModule', () => {
    it('should return pathologies for a single module ID', async () => {
      const moduleId = 'module-123';
      const mockPathologies = [
        { id: '1', moduleId, name: 'Pathology 1' },
        { id: '2', moduleId, name: 'Pathology 2' },
      ];

      mockPathologyService.findByModuleIds.mockResolvedValue(mockPathologies);

      const result = await controller.getPathologiesByModule(moduleId);

      expect(result).toEqual({
        message: 'Got Pathologies for modules Successfully',
        data: mockPathologies,
      });
      expect(service.findByModuleIds).toHaveBeenCalledWith([moduleId.trim()]);
    });

    it('should handle comma-separated module IDs', async () => {
      const moduleId = 'module-123,module-456,module-789';
      const mockPathologies = [{ id: '1', name: 'Pathology 1' }];

      mockPathologyService.findByModuleIds.mockResolvedValue(mockPathologies);

      await controller.getPathologiesByModule(moduleId);

      expect(service.findByModuleIds).toHaveBeenCalledWith([
        'module-123',
        'module-456',
        'module-789',
      ]);
    });

    it('should handle array of module IDs', async () => {
      const moduleIds = ['module-123', 'module-456'];
      const mockPathologies = [{ id: '1', name: 'Pathology 1' }];

      mockPathologyService.findByModuleIds.mockResolvedValue(mockPathologies);

      await controller.getPathologiesByModule(moduleIds);

      expect(service.findByModuleIds).toHaveBeenCalledWith([
        'module-123',
        'module-456',
      ]);
    });

    it('should trim whitespace from module IDs', async () => {
      const moduleId = '  module-123  ,  module-456  ';
      const mockPathologies = [{ id: '1', name: 'Pathology 1' }];

      mockPathologyService.findByModuleIds.mockResolvedValue(mockPathologies);

      await controller.getPathologiesByModule(moduleId);

      expect(service.findByModuleIds).toHaveBeenCalledWith([
        'module-123',
        'module-456',
      ]);
    });

    it('should throw BadRequestException when moduleId is not provided', async () => {
      await expect(
        controller.getPathologiesByModule(undefined),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.getPathologiesByModule(undefined),
      ).rejects.toThrow('Module ID(s) are required');
    });

    it('should throw BadRequestException when moduleId is empty array', async () => {
      await expect(controller.getPathologiesByModule([])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when no pathologies found', async () => {
      const moduleId = 'module-123';

      mockPathologyService.findByModuleIds.mockResolvedValue([]);

      await expect(controller.getPathologiesByModule(moduleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.getPathologiesByModule(moduleId)).rejects.toThrow(
        'No pathologies found for these modules',
      );
    });

    it('should throw NotFoundException when pathologies is null', async () => {
      const moduleId = 'module-123';

      mockPathologyService.findByModuleIds.mockResolvedValue(null);

      await expect(controller.getPathologiesByModule(moduleId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on service error', async () => {
      const moduleId = 'module-123';

      mockPathologyService.findByModuleIds.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.getPathologiesByModule(moduleId)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.getPathologiesByModule(moduleId)).rejects.toThrow(
        'Server Error',
      );
    });

    it('should rethrow BadRequestException from service', async () => {
      const moduleId = 'invalid';

      mockPathologyService.findByModuleIds.mockRejectedValue(
        new BadRequestException('Invalid module ID'),
      );

      await expect(controller.getPathologiesByModule(moduleId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.getPathologiesByModule(moduleId)).rejects.toThrow(
        'Invalid module ID',
      );
    });

    it('should rethrow NotFoundException from service', async () => {
      const moduleId = 'module-123';

      mockPathologyService.findByModuleIds.mockRejectedValue(
        new NotFoundException('Module not found'),
      );

      await expect(controller.getPathologiesByModule(moduleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.getPathologiesByModule(moduleId)).rejects.toThrow(
        'Module not found',
      );
    });
  });
});
