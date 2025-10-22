import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';
import { Pathology, PathologyDocument } from './schema/pathology.schema';
import { Module, ModuleDocument } from '../module/schema/module.schema';
import { CreatePathologyDto } from './dto/create-pathology.dto';
import { UpdatePathologyDto } from './dto/update-pathology.dto';
import type { Express } from 'express';

@Injectable()
export class PathologyService {
  private readonly logger = new Logger(PathologyService.name);

  constructor(
    @InjectModel(Pathology.name)
    private pathologyModel: Model<PathologyDocument>,
    @InjectModel(Module.name)
    private moduleModel: Model<ModuleDocument>,
  ) {}

  async findAll(): Promise<PathologyDocument[]> {
    return this.pathologyModel.find({}).exec();
  }

  async findById(pathologyId: string): Promise<PathologyDocument> {
    const pathology = await this.pathologyModel.findById(pathologyId).exec();

    if (!pathology) {
      throw new NotFoundException('Pathology Not Found');
    }

    return pathology;
  }

  async getPathologyImagePath(pathologyId: string): Promise<string> {
    const pathology = await this.findById(pathologyId);

    if (!pathology) {
      this.logger.log('Image for Pathology not found');
      throw new NotFoundException('Pathology Not Found');
    }

    if (!pathology.imageUrl) {
      this.logger.log('Image URL not found for pathology');
      throw new NotFoundException('Image URL Not Found');
    }

    const imagePath = path.join(__dirname, '..', '..', pathology.imageUrl!);

    if (!fs.existsSync(imagePath)) {
      this.logger.log('Image not found in the upload folder');
      throw new NotFoundException('Image Not Found');
    }

    return imagePath;
  }

  async create(
    moduleId: string,
    createPathologyDto: CreatePathologyDto,
    file?: Express.Multer.File,
  ): Promise<PathologyDocument> {
    const module = await this.moduleModel.findById(moduleId).exec();

    if (!module) {
      throw new NotFoundException('Module Not Found');
    }

    const imagePath = file ? `/uploads/${file.filename}` : null;

    const pathology = new this.pathologyModel({
      pathologyName: createPathologyDto.pathologyName,
      description: createPathologyDto.description,
      moduleId: module._id,
      imageUrl: imagePath,
    });

    const savedPathology = await pathology.save();

    if (!savedPathology) {
      this.logger.log(
        "Couldn't create Pathology due to bad field data type request",
      );
      throw new BadRequestException('Bad Request');
    }

    return savedPathology;
  }

  async update(
    pathologyId: string,
    updatePathologyDto: UpdatePathologyDto,
  ): Promise<PathologyDocument> {
    const updatedPathology = await this.pathologyModel
      .findByIdAndUpdate(
        pathologyId,
        {
          pathologyName: updatePathologyDto.pathologyName,
          description: updatePathologyDto.description,
        },
        { new: true },
      )
      .exec();

    if (!updatedPathology) {
      throw new NotFoundException('Pathology Not Found');
    }

    return updatedPathology;
  }

  async findByModuleIds(moduleIds: string[]): Promise<PathologyDocument[]> {
    return this.pathologyModel.find({ moduleId: { $in: moduleIds } }).exec();
  }
}
