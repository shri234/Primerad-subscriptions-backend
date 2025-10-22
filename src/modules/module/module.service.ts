import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Module as ModuleEntity, ModuleDocument } from './schema/module.schema';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import type { Express } from 'express';

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

  constructor(
    @InjectModel(ModuleEntity.name)
    private moduleModel: Model<ModuleDocument>,
  ) {}

  async findAll(): Promise<ModuleDocument[]> {
    return this.moduleModel.find({}).exec();
  }

  async findById(moduleId: string): Promise<ModuleDocument> {
    const module = await this.moduleModel.findById(moduleId).exec();

    if (!module) {
      throw new NotFoundException('Module Not Found');
    }

    return module;
  }

  async getModulesWithPathologyCount(): Promise<ModuleWithPathologyCount[]> {
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

    console.log(modules);
    return modules;
  }

  async getModulesWithSessionCount(): Promise<ModuleWithSessionCount[]> {
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
              in: {
                $slice: ['$pathologyNames', '$$randomIndex', 3],
              },
            },
          },
        },
      },
    ]);

    return modules;
  }

  async create(
    createModuleDto: CreateModuleDto,
    file?: Express.Multer.File,
  ): Promise<ModuleDocument> {
    const imagePath = file ? `/uploads/${file.filename}` : null;

    const module = new this.moduleModel({
      moduleName: createModuleDto.moduleName,
      description: createModuleDto.description,
      imageUrl: imagePath,
    });

    const savedModule = await module.save();

    if (!savedModule) {
      this.logger.log('Input fields are not all required');
      throw new BadRequestException('Bad Request');
    }

    return savedModule;
  }

  async update(
    moduleId: string,
    updateModuleDto: UpdateModuleDto,
  ): Promise<ModuleDocument> {
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
      throw new NotFoundException('Module Not Found');
    }

    return updatedModule;
  }
}
