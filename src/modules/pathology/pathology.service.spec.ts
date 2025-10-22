import { Test, TestingModule } from '@nestjs/testing';
import { PathologyService } from './pathology.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import * as fs from 'fs';

// Mock fs.existsSync globally
jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

// --- Mock Documents ---
const mockPathology = {
  _id: 'path123',
  pathologyName: 'Brain MRI',
  description: 'MRI of brain',
  imageUrl: '/uploads/image.jpg',
  moduleId: 'module123',
};

const mockModule = {
  _id: 'module123',
  moduleName: 'Neuro Module',
};

// --- Mock Mongoose Models ---
const pathologyModelMock = {
  find: jest.fn().mockReturnThis(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  exec: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

const moduleModelMock = {
  findById: jest.fn(),
  exec: jest.fn(),
};

describe('PathologyService', () => {
  let service: PathologyService;
  let pathologyModel: Model<any>;
  let moduleModel: Model<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PathologyService,
        {
          provide: getModelToken('Pathology'),
          useValue: { ...pathologyModelMock },
        },
        {
          provide: getModelToken('Module'),
          useValue: { ...moduleModelMock },
        },
      ],
    }).compile();

    service = module.get<PathologyService>(PathologyService);
    pathologyModel = module.get<Model<any>>(getModelToken('Pathology'));
    moduleModel = module.get<Model<any>>(getModelToken('Module'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // findAll()
  // -----------------------------
  it('should return all pathologies', async () => {
    const mockResult = [mockPathology];
    pathologyModel.find.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(mockResult),
    });

    const result = await service.findAll();
    expect(result).toEqual(mockResult);
  });

  // -----------------------------
  // findById()
  // -----------------------------
  it('should return a pathology by id', async () => {
    pathologyModel.findById.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(mockPathology),
    });

    const result = await service.findById('path123');
    expect(result).toEqual(mockPathology);
  });

  it('should throw NotFoundException if pathology not found', async () => {
    pathologyModel.findById.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(null),
    });

    await expect(service.findById('wrongId')).rejects.toThrow(
      NotFoundException,
    );
  });

  // -----------------------------
  // getPathologyImagePath()
  // -----------------------------
  it('should return image path if image exists', async () => {
    jest.spyOn(service, 'findById').mockResolvedValueOnce(mockPathology as any);
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    const imagePath = await service.getPathologyImagePath('path123');
    expect(imagePath.replace(/\\/g, '/')).toContain('/uploads/image.jpg');
  });

  it('should throw NotFoundException if image not found on disk', async () => {
    jest.spyOn(service, 'findById').mockResolvedValueOnce(mockPathology as any);
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await expect(service.getPathologyImagePath('path123')).rejects.toThrow(
      NotFoundException,
    );
  });

  // -----------------------------
  // create()
  // -----------------------------
  it('should create a pathology successfully', async () => {
    moduleModel.findById.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(mockModule),
    });

    const saveMock = jest.fn().mockResolvedValue(mockPathology);
    const newPathologyMock = function () {
      return { save: saveMock };
    } as any;

    Object.defineProperty(service, 'pathologyModel', {
      value: Object.assign(newPathologyMock, pathologyModel),
    });

    const result = await service.create('module123', {
      pathologyName: 'Brain MRI',
      description: 'MRI of brain',
    });

    expect(result).toEqual(mockPathology);
    expect(saveMock).toHaveBeenCalled();
  });

  it('should throw NotFoundException if module not found', async () => {
    moduleModel.findById.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(null),
    });

    await expect(
      service.create('invalid', { pathologyName: 'test', description: 'desc' }),
    ).rejects.toThrow(NotFoundException);
  });

  // -----------------------------
  // update()
  // -----------------------------
  it('should update a pathology', async () => {
    pathologyModel.findByIdAndUpdate.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(mockPathology),
    });

    const result = await service.update('path123', {
      pathologyName: 'Updated',
      description: 'Updated Desc',
    });

    expect(result).toEqual(mockPathology);
  });

  it('should throw NotFoundException if pathology not found in update', async () => {
    pathologyModel.findByIdAndUpdate.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(null),
    });

    await expect(
      service.update('wrongId', { pathologyName: 'X', description: 'Y' }),
    ).rejects.toThrow(NotFoundException);
  });

  // -----------------------------
  // findByModuleIds()
  // -----------------------------
  it('should return pathologies for given module IDs', async () => {
    const mockResult = [mockPathology];
    pathologyModel.find.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(mockResult),
    });

    const result = await service.findByModuleIds(['module123']);
    expect(result).toEqual(mockResult);
  });
});
