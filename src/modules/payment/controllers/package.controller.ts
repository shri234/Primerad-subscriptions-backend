import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Package, PackageDocument } from '../schemas/package.schema';
import { CreatePackageDto } from '../dto/create-package.dto';

@Controller('packages')
export class PackageController {
  constructor(
    @InjectModel(Package.name)
    private packageModel: Model<PackageDocument>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPackage(@Body() createPackageDto: CreatePackageDto) {
    const durationMap = {
      monthly: 30,
      yearly: 365,
      biannually: 180,
      quarterly: 90,
    };

    const pricingOptions = createPackageDto.pricingOptions.map((option) => ({
      ...option,
      durationDays: durationMap[option.billingCycle] || null,
    }));

    const pkg = await this.packageModel.create({
      ...createPackageDto,
      pricingOptions,
    });

    return {
      message: 'Package created successfully',
      data: pkg,
    };
  }

  @Get()
  async getPackages() {
    const packages = await this.packageModel.find({ isActive: true }).exec();
    return {
      message: 'Packages fetched successfully',
      data: packages,
    };
  }

  @Get('single')
  async getPackageById(@Query('packageId') packageId: string) {
    const pkg = await this.packageModel.findById(packageId).exec();
    return {
      message: 'Package fetched successfully',
      data: pkg,
    };
  }
}
