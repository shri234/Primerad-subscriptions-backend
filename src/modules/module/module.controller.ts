import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Body,
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
  async getModules(): Promise<ModuleResponse<any[]>> {
    try {
      const response = await this.moduleService.findAll();
      const modules = response.data;

      if (!modules || modules.length === 0) {
        this.logger.log("Couldn't find any modules");
        throw new NotFoundException('Modules not found');
      }

      return {
        success: true,
        message: 'Got Modules Successfully',
        data: modules,
      };
    } catch (err) {
      this.logger.error(`Error fetching modules: ${err.message}`);
      throw new InternalServerErrorException('Internal Server Error', {
        cause: err,
      });
    }
  }

  @Get('modules-with-pathology-count')
  async getModulesWithPathologyCount(): Promise<
    ModuleResponse<ModuleWithPathologyCount[]>
  > {
    try {
      const response = await this.moduleService.getModulesWithPathologyCount();
      const modules = response.data;

      if (!modules || modules.length === 0) {
        this.logger.log("Couldn't find any modules to count pathologies for.");
        return {
          success: true,
          message: 'No modules found',
          data: [],
        };
      }

      this.logger.log(
        'Got Modules with Pathology Count and Sample Pathologies Successfully',
      );
      return {
        success: true,
        message:
          'Got Modules with Pathology Count and Sample Pathologies Successfully',
        data: modules,
      };
    } catch (err) {
      this.logger.error(
        `Error getting modules with pathology count: ${err.message}`,
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
      const response = await this.moduleService.getModulesWithSessionCount();
      const modules = response.data;

      if (!modules || modules.length === 0) {
        this.logger.log("Couldn't find any modules with sessions or pathologies.");
        return {
          success: true,
          message: 'No modules found',
          data: [],
        };
      }

      this.logger.log(
        'Got Modules with Session, Pathology Count, and Sample Pathologies Successfully',
      );
      return {
        success: true,
        message:
          'Got Modules with Session, Pathology Count, and Sample Pathologies Successfully',
        data: modules,
      };
    } catch (err) {
      this.logger.error(
        `Error getting modules with session count: ${err.message}`,
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
  ): Promise<ModuleResponse<any>> {
    try {
      const response = await this.moduleService.create(createModuleDto, file);
      const module = response.data;

      this.logger.log('Module created successfully');
      return {
        success: true,
        message: 'Module Created Successfully',
        data: module,
      };
    } catch (err) {
      this.logger.error(`Error creating module: ${err.message}`);
      throw new InternalServerErrorException('Internal Server Error', {
        cause: err,
      });
    }
  }

  @Put()
  async updateModules(
    @Query('id') id: string,
    @Body() updateModuleDto: UpdateModuleDto,
  ): Promise<ModuleResponse<any>> {
    try {
      if (!id) {
        throw new BadRequestException('Module ID is required for update.');
      }

      const response = await this.moduleService.update(id, updateModuleDto);
      const updatedModule = response.data;

      this.logger.log('Module Updated Successfully');
      return {
        success: true,
        message: 'Module Updated Successfully',
        data: updatedModule,
      };
    } catch (err) {
      this.logger.error(`Error updating module: ${err.message}`);

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
