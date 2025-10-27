import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Body,
  Res,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { PathologyService } from './pathology.service';
import { CreatePathologyDto } from './dto/create-pathology.dto';
import { UpdatePathologyDto } from './dto/update-pathology.dto';
import type { Express } from 'express';

@Controller('pathologies')
export class PathologyController {
  private readonly logger = new Logger(PathologyController.name);

  constructor(private readonly pathologyService: PathologyService) {}

  // ✅ Get all pathologies (service handles response formatting)
  @Get('get')
  async getPathologies() {
    try {
      const response = await this.pathologyService.findAll();
      return response;
    } catch (err) {
      this.logger.error(`Error fetching pathologies: ${err.message}`);
      throw new InternalServerErrorException('Failed to get pathologies', {
        cause: err,
      });
    }
  }

  // ✅ Serve pathology image by ID
  @Get('image')
  async getPathologyImages(
    @Query('pathologyId') pathologyId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const imagePath =
        await this.pathologyService.getPathologyImagePath(pathologyId);

      res.set('Content-Type', 'image/jpeg');
      res.sendFile(imagePath);
    } catch (err) {
      this.logger.error(`Error retrieving pathology image: ${err.message}`);

      if (err instanceof NotFoundException) {
        res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: err.message,
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Server Error',
          error: err.message,
        });
      }
    }
  }

  // ✅ Create a new pathology (service returns formatted response)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createPathologies(
    @Query('moduleId') moduleId: string,
    @Body() createPathologyDto: CreatePathologyDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const response = await this.pathologyService.create(
        moduleId?.trim(),
        createPathologyDto,
        file,
      );

      this.logger.log('Pathology created successfully');
      return response;
    } catch (err) {
      this.logger.error(`Error creating pathology: ${err.message}`);
      throw new BadRequestException('Failed to create pathology', {
        cause: err,
      });
    }
  }

  // ✅ Update an existing pathology (service returns formatted response)
  @Put()
  async updatePathologies(
    @Query('id') id: string,
    @Body() updatePathologyDto: UpdatePathologyDto,
  ) {
    try {
      const response = await this.pathologyService.update(
        id,
        updatePathologyDto,
      );

      this.logger.log(`Pathology updated successfully for ID: ${id}`);
      return response;
    } catch (err) {
      this.logger.error(`Error updating pathology: ${err.message}`);
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to update pathology', {
        cause: err,
      });
    }
  }

  // ✅ Get pathologies by module ID (service returns formatted response)
  @Get('getByModule')
  async getPathologiesByModule(@Query('moduleId') moduleId: string) {
    try {
      if (!moduleId || (Array.isArray(moduleId) && moduleId.length === 0)) {
        throw new BadRequestException('Module ID(s) are required');
      }

      const response = await this.pathologyService.findByModuleIds(moduleId);

      this.logger.log(
        `Successfully retrieved pathologies for module ID: ${moduleId}`,
      );
      return response;
    } catch (err) {
      this.logger.error(`Error getting pathologies by module: ${err.message}`);

      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }

      throw new InternalServerErrorException('Server Error', { cause: err });
    }
  }
}
