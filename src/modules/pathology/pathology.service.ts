import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';
import { Pathology, PathologyDocument } from './schema/pathology.schema';
import { Module, ModuleDocument } from '../module/schema/module.schema';
import { CreatePathologyDto } from './dto/create-pathology.dto';
import { UpdatePathologyDto } from './dto/update-pathology.dto';
import { ImageDomainHelper } from 'src/config/image-domain.util';
import type { Express } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PathologyService {
  private readonly logger = new Logger(PathologyService.name);
  private readonly imageHelper: ImageDomainHelper;

  constructor(
    @InjectModel(Pathology.name)
    private pathologyModel: Model<PathologyDocument>,
    @InjectModel(Module.name)
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

  // ✅ Get all pathologies with domain appended to image URLs
  async findAll() {
    const pathologies = await this.pathologyModel.find({}).lean().exec();
    const updated = this.imageHelper.appendImageDomainToMany(pathologies);
    return this.successResponse('Got all pathologies successfully', updated);
  }

  // ✅ Get one pathology by ID with image domain applied
  async findById(pathologyId: string) {
    const pathology = await this.pathologyModel
      .findById(pathologyId)
      .lean()
      .exec();

    if (!pathology) {
      throw new NotFoundException(this.errorResponse('Pathology Not Found'));
    }

    const updated = this.imageHelper.appendImageDomain(pathology);
    return this.successResponse('Got pathology successfully', updated);
  }

  // ✅ Get local image path (used for serving static files)
  async getPathologyImagePath(pathologyId: string): Promise<string> {
    const pathologyDoc = await this.pathologyModel.findById(pathologyId).exec();

    if (!pathologyDoc) {
      this.logger.log('Image for Pathology not found');
      throw new NotFoundException('Pathology Not Found');
    }

    if (!pathologyDoc.imageUrl) {
      this.logger.log('Image URL not found for pathology');
      throw new NotFoundException('Image URL Not Found');
    }

    const imagePath = path.join(__dirname, '..', '..', pathologyDoc.imageUrl!);

    if (!fs.existsSync(imagePath)) {
      this.logger.log('Image not found in the upload folder');
      throw new NotFoundException('Image Not Found');
    }

    return imagePath;
  }

  // ✅ Create a new pathology and return with image domain
  async create(
    moduleId: string,
    createPathologyDto: CreatePathologyDto,
    file?: Express.Multer.File,
  ) {
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

    const updated = this.imageHelper.appendImageDomain(
      savedPathology.toObject(),
    );
    return this.successResponse('Pathology created successfully', updated);
  }

  // ✅ Update pathology and return updated object with image domain
  async update(pathologyId: string, updatePathologyDto: UpdatePathologyDto) {
    const updatedPathology = await this.pathologyModel
      .findByIdAndUpdate(
        pathologyId,
        {
          pathologyName: updatePathologyDto.pathologyName,
          description: updatePathologyDto.description,
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!updatedPathology) {
      throw new NotFoundException('Pathology Not Found');
    }

    const updated = this.imageHelper.appendImageDomain(updatedPathology);
    return this.successResponse('Pathology updated successfully', updated);
  }

  async findByModuleIds(moduleId: string) {
    const module = await this.moduleModel.findById(moduleId).lean().exec();
    if (!module) {
      return this.errorResponse('Module not found');
    }

    const pathologies = await this.pathologyModel
      .find({ moduleId: new mongoose.Types.ObjectId(moduleId) })
      .lean()
      .exec();

    const updatedPathologies =
      this.imageHelper.appendImageDomainToMany(pathologies);

    const responseData = {
      assessment: module.assessment ?? false,
      pathologies: updatedPathologies,
    };

    // 5️⃣ Return unified response
    return this.successResponse(
      'Got pathologies by module successfully',
      responseData,
    );
  }
}
