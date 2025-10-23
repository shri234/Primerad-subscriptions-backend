import { Test, TestingModule } from '@nestjs/testing';
import { PathologyController } from './pathology.controller';
import { PathologyService } from './pathology.service';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePathologyDto } from './dto/create-pathology.dto';
import { UpdatePathologyDto } from './dto/update-pathology.dto';
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

  const mockResponse = {
    set: jest.fn(),
    sendFile: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPathologies', () => {
    it('should return all pathologies', async () => {
      const mockData = [{ id: '1' }];
      mockPathologyService.findAll.mockResolvedValue(mockData);

      const result = await controller.getPathologies();
      expect(result).toEqual({
        message: 'Got Pathologies Successfully',
        data: mockData,
      });
    });

    it('should throw NotFoundException if none found', async () => {
      mockPathologyService.findAll.mockResolvedValue([]);
      await expect(controller.getPathologies()).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPathologyImages', () => {
    it('should send image file if found', async () => {
      const mockPath = '/path/to/image.jpg';
      mockPathologyService.getPathologyImagePath.mockResolvedValue(mockPath);

      await controller.getPathologyImages('123', mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith(
        'Content-Type',
        'image/jpeg',
      );
      expect(mockResponse.sendFile).toHaveBeenCalledWith(mockPath);
    });

    it('should handle NotFoundException properly', async () => {
      mockPathologyService.getPathologyImagePath.mockRejectedValue(
        new NotFoundException('Image not found'),
      );

      await controller.getPathologyImages('123', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createPathologies', () => {
    it('should create pathology successfully', async () => {
      const dto: CreatePathologyDto = { name: 'test' } as any;
      const file = { filename: 'file.jpg' } as Express.Multer.File;
      const mockData = { id: '1', name: 'test' };

      mockPathologyService.create.mockResolvedValue(mockData);

      const result = await controller.createPathologies('mod1', dto, file);

      expect(result).toEqual({
        message: 'Pathologies Created Successfully',
        data: mockData,
      });
      expect(service.create).toHaveBeenCalledWith('mod1', dto, file);
    });

    it('should throw BadRequestException on error', async () => {
      mockPathologyService.create.mockRejectedValue(new Error('fail'));

      await expect(
        controller.createPathologies('mod1', {} as any, {} as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePathologies', () => {
    it('should update pathology successfully', async () => {
      const dto: UpdatePathologyDto = { name: 'updated' } as any;
      const mockData = { id: '1', name: 'updated' };
      mockPathologyService.update.mockResolvedValue(mockData);

      const result = await controller.updatePathologies('1', dto);

      expect(result).toEqual({
        message: 'Pathologies Updated Successfully',
        data: mockData,
      });
      expect(service.update).toHaveBeenCalledWith('1', dto);
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockPathologyService.update.mockRejectedValue(new Error('fail'));
      await expect(
        controller.updatePathologies('1', {} as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getPathologiesByModule', () => {
    it('should return pathologies by module', async () => {
      const mockData = [{ id: 'p1' }];
      mockPathologyService.findByModuleIds.mockResolvedValue(mockData);

      const result = await controller.getPathologiesByModule('module-123');

      expect(result).toEqual({
        message: 'Got Pathologies for modules Successfully',
        data: mockData,
      });
      // ✅ Expect a STRING (not array)
      expect(service.findByModuleIds).toHaveBeenCalledWith('module-123');
    });

    it('should throw BadRequestException if moduleId is missing', async () => {
      await expect(controller.getPathologiesByModule('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if none found', async () => {
      mockPathologyService.findByModuleIds.mockResolvedValue([]);
      await expect(
        controller.getPathologiesByModule('module-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      mockPathologyService.findByModuleIds.mockRejectedValue(
        new Error('unexpected'),
      );
      await expect(
        controller.getPathologiesByModule('module-123'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
