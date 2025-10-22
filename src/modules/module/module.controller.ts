import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Body,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ModuleService } from './module.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import type { Express } from 'express';
import {
  ModuleWithPathologyCount,
  ModuleWithSessionCount,
  ModuleResponse,
} from './interface/module.interface';

@Controller('modules')
export class ModuleController {
  private readonly logger = new Logger(ModuleController.name);

  constructor(private readonly moduleService: ModuleService) {}

  @Get('get')
  async getModules() {
    try {
      const modules = await this.moduleService.findAll();

      if (!modules || modules.length === 0) {
        this.logger.log("Couldn't find any modules");
        throw new NotFoundException('Not Found');
      }

      return {
        message: 'Got Modules Successfully',
        data: modules,
      };
    } catch (err) {
      this.logger.error(`Error Modules Not Found message: ${err}`);
      throw new NotFoundException('Not Found');
    }
  }

  @Get('with-pathology-count')
  async getModulesWithPathologyCount(): Promise<
    ModuleResponse<ModuleWithPathologyCount[]>
  > {
    try {
      const modules = await this.moduleService.getModulesWithPathologyCount();

      if (!modules || modules.length === 0) {
        this.logger.log("Couldn't find any modules to count pathologies for.");
        return {
          message: 'No modules found',
          data: [],
        };
      }

      this.logger.log(
        'Got Modules with Pathology Count and Sample Pathologies Successfully',
      );
      return {
        message:
          'Got Modules with Pathology Count and Sample Pathologies Successfully',
        data: modules,
      };
    } catch (err) {
      this.logger.error(
        `Error getting modules with pathology count and sample pathologies: ${err.message}`,
      );
      throw new InternalServerErrorException('Internal Server Error', {
        cause: err,
      });
    }
  }

  @Get('with-session-count')
  async getModulesWithSessionCount(): Promise<
    ModuleResponse<ModuleWithSessionCount[]>
  > {
    try {
      const modules = await this.moduleService.getModulesWithSessionCount();

      if (!modules || modules.length === 0) {
        this.logger.log(
          "Couldn't find any modules with sessions or pathologies.",
        );
        return {
          message: 'No modules found',
          data: [],
        };
      }

      this.logger.log(
        'Got Modules with Session, Pathology Count, and Sample Pathologies Successfully',
      );
      return {
        message:
          'Got Modules with Session, Pathology Count, and Sample Pathologies Successfully',
        data: modules,
      };
    } catch (err) {
      this.logger.error(
        `Error getting modules with session and pathology count: ${err.message}`,
      );
      throw new InternalServerErrorException('Internal Server Error', {
        cause: err,
      });
    }
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createModules(
    @Body() createModuleDto: CreateModuleDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const module = await this.moduleService.create(createModuleDto, file);

      if (!module) {
        this.logger.log('Input fields are not all required');
        throw new BadRequestException('Bad Request');
      }

      this.logger.log('Modules created successfully');
      console.log(module);

      return {
        message: 'Modules Created Successfully',
        data: module,
      };
    } catch (err) {
      console.log(err);
      this.logger.error(`Error internal server error message: ${err}`);
      throw new InternalServerErrorException('Internal Server Error', {
        cause: err,
      });
    }
  }

  @Put()
  async updateModules(
    @Query('id') id: string,
    @Body() updateModuleDto: UpdateModuleDto,
  ) {
    try {
      if (!id) {
        throw new BadRequestException('Module ID is required for update.');
      }

      const updatedModule = await this.moduleService.update(
        id,
        updateModuleDto,
      );

      if (!updatedModule) {
        this.logger.log(`Module with ID ${id} not found for update.`);
        throw new NotFoundException('Module not found to update');
      }

      this.logger.log('Modules Updated Successfully');
      return {
        message: 'Modules Updated Successfully',
        data: updatedModule,
      };
    } catch (err) {
      this.logger.error(`Error in updating module: ${err.message}`);

      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }

      throw new InternalServerErrorException('Error in updating module', {
        cause: err,
      });
    }
  }
}
