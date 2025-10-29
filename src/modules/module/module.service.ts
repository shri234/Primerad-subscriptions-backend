import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import type { Express } from 'express';

import { Module as ModuleEntity, ModuleDocument } from './schema/module.schema';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ImageDomainHelper } from 'src/config/image-domain.util';

interface ModuleWithPathologyCount {
  _id: string;
  moduleName: string;
  totalPathologiesCount: number;
  randomPathologyNames: string[];
}

interface ModuleWithSessionCount extends ModuleWithPathologyCount {
  totalSessionsCount: number;
}

@Injectable()
export class ModuleService {
  private readonly logger = new Logger(ModuleService.name);
  private readonly imageHelper: ImageDomainHelper;

  constructor(
    @InjectModel(ModuleEntity.name)
    private moduleModel: Model<ModuleDocument>,
    private configService: ConfigService,
  ) {
    const domain: string =
      this.configService.get<string>('BACKEND_IMAGE_DOMAIN') ?? '';
    this.imageHelper = new ImageDomainHelper(domain);
  }

  private successResponse(message: string, data: any) {
    return { success: true, message, data };
  }

  private errorResponse(message: string) {
    return { success: false, message };
  }

  async findAll() {
    const modules = await this.moduleModel.find({}).exec();
    const updated = this.imageHelper.appendImageDomainToMany(modules);
    return this.successResponse('Modules fetched successfully', updated);
  }

  async findById(moduleId: string) {
    const module = await this.moduleModel.findById(moduleId).exec();
    if (!module) {
      throw new NotFoundException(this.errorResponse('Module Not Found'));
    }

    const updated = this.imageHelper.appendImageDomain(module);
    return this.successResponse('Module fetched successfully', updated);
  }

  async getModulesWithPathologyCount() {
    const modules = await this.moduleModel.aggregate([
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
          imageUrl: 1,
          assessment: 1,
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
              in: { $slice: ['$pathologyNames', '$$randomIndex', 3] },
            },
          },
        },
      },
    ]);

    const updated = this.imageHelper.appendImageDomainToMany(modules);
    return this.successResponse(
      'Modules with pathology count fetched',
      updated,
    );
  }

  async getModulesWithSessionCount() {
    const modules = await this.moduleModel.aggregate([
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
              in: { $slice: ['$pathologyNames', '$$randomIndex', 3] },
            },
          },
        },
      },
    ]);

    const updated = this.imageHelper.appendImageDomainToMany(modules);
    return this.successResponse('Modules with session count fetched', updated);
  }

  async create(createModuleDto: CreateModuleDto, file?: Express.Multer.File) {
    const imagePath = file ? `/uploads/${file.filename}` : null;

    const module = new this.moduleModel({
      moduleName: createModuleDto.moduleName,
      description: createModuleDto.description,
      imageUrl: imagePath,
    });

    const savedModule = await module.save();

    if (!savedModule) {
      this.logger.log('Input fields are not all required');
      throw new BadRequestException(this.errorResponse('Bad Request'));
    }

    const updated = this.imageHelper.appendImageDomain(savedModule);
    return this.successResponse('Module created successfully', updated);
  }

  async update(moduleId: string, updateModuleDto: UpdateModuleDto) {
    const updatedData: any = {};

    if (updateModuleDto.moduleName) {
      updatedData.moduleName = updateModuleDto.moduleName;
    }

    if (updateModuleDto.description !== undefined) {
      updatedData.description = updateModuleDto.description;
    }

    const updatedModule = await this.moduleModel
      .findByIdAndUpdate(moduleId, updatedData, { new: true })
      .exec();

    if (!updatedModule) {
      throw new NotFoundException(this.errorResponse('Module Not Found'));
    }

    const updated = this.imageHelper.appendImageDomain(updatedModule);
    return this.successResponse('Module updated successfully', updated);
  }
}
