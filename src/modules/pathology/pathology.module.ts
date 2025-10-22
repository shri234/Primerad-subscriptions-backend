// pathology.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PathologyController } from './pathology.controller';
import { PathologyService } from './pathology.service';
import { Pathology, PathologySchema } from './schema/pathology.schema';
import {
  Module as ModuleEntity,
  ModuleSchema,
} from '../module/schema/module.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Pathology.name, schema: PathologySchema },
      { name: ModuleEntity.name, schema: ModuleSchema },
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  ],
  controllers: [PathologyController],
  providers: [PathologyService],
  exports: [PathologyService, MongooseModule],
})
export class PathologyModule {}
