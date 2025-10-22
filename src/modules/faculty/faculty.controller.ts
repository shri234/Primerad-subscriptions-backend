import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FacultyService } from './faculty.service';
import { CreateFacultyDto, UpdateFacultyDto } from './dto/faculty.dto';
import type { Response } from 'express';
import type { Express } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('faculty')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/faculty',
        filename: (_, file, cb) => {
          const randomName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async create(
    @Body() createFacultyDto: CreateFacultyDto,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    if (!file) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'Image is required' });
    }
    const faculty = await this.facultyService.create(
      createFacultyDto,
      file.path,
    );
    return res
      .status(HttpStatus.CREATED)
      .json({ message: 'Faculty created successfully', data: faculty });
  }

  @Get()
  async findAll(@Res() res: Response) {
    const faculty = await this.facultyService.findAll();
    return res.status(HttpStatus.OK).json({ data: faculty });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const faculty = await this.facultyService.findOne(id);
    return res.status(HttpStatus.OK).json({ data: faculty });
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/faculty',
        filename: (_, file, cb) => {
          const randomName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() updateFacultyDto: UpdateFacultyDto,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    const faculty = await this.facultyService.update(
      id,
      updateFacultyDto,
      file?.path,
    );
    return res
      .status(HttpStatus.OK)
      .json({ message: 'Faculty updated successfully', data: faculty });
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    await this.facultyService.remove(id);
    return res
      .status(HttpStatus.OK)
      .json({ message: 'Faculty deleted successfully' });
  }
}
