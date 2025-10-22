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

  @Get('get')
  async getPathologies() {
    try {
      const pathologies = await this.pathologyService.findAll();

      if (!pathologies || pathologies.length === 0) {
        this.logger.log('Pathologies Not found');
        throw new NotFoundException('Not Found');
      }

      this.logger.log('Got Pathologies Successfully');
      return {
        message: 'Got Pathologies Successfully',
        data: pathologies,
      };
    } catch (err) {
      this.logger.error(`Error Internal Server Error message: ${err}`);
      throw new NotFoundException('Not Found');
    }
  }

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
      this.logger.error(`Error Internal Server Error message: ${err}`);

      if (err instanceof NotFoundException) {
        res.status(HttpStatus.NOT_FOUND).json({
          message: err.message,
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Server Error',
          error: err.message,
        });
      }
    }
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createPathologies(
    @Query('moduleId') moduleId: string,
    @Body() createPathologyDto: CreatePathologyDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const pathology = await this.pathologyService.create(
        moduleId?.trim(),
        createPathologyDto,
        file,
      );

      this.logger.log('Pathology created successfully');
      return {
        message: 'Pathologies Created Successfully',
        data: pathology,
      };
    } catch (err) {
      this.logger.error(`Error Internal Server Error message: ${err}`);
      throw new BadRequestException('Not Found', { cause: err });
    }
  }

  @Put()
  async updatePathologies(
    @Query('id') id: string,
    @Body() updatePathologyDto: UpdatePathologyDto,
  ) {
    try {
      const updatedPathology = await this.pathologyService.update(
        id,
        updatePathologyDto,
      );

      if (!updatedPathology) {
        throw new BadRequestException('Bad Request');
      }

      return {
        message: 'Pathologies Updated Successfully',
        data: updatedPathology,
      };
    } catch (err) {
      this.logger.error(`Error updating pathology: ${err}`);
      throw new InternalServerErrorException('Not Found to update pathology');
    }
  }

  @Get('getByModule')
  async getPathologiesByModule(@Query('moduleId') moduleId: string) {
    try {
      if (!moduleId || (Array.isArray(moduleId) && moduleId.length === 0)) {
        throw new BadRequestException('Module ID(s) are required');
      }

      const pathologies = await this.pathologyService.findByModuleIds(moduleId);

      if (!pathologies || pathologies.length === 0) {
        this.logger.log(`No pathologies found for module ID: ${moduleId}`);
        throw new NotFoundException('No pathologies found for these modules');
      }

      this.logger.log(
        `Successfully retrieved pathologies for module IDs: ${moduleId}`,
      );
      return {
        message: 'Got Pathologies for modules Successfully',
        data: pathologies,
      };
    } catch (err) {
      this.logger.error(`Error getting pathologies by modules: ${err.message}`);

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
