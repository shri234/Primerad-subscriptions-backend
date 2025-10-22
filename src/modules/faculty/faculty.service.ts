import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Faculty, FacultyDocument } from './schema/faculty.schema';
import { CreateFacultyDto, UpdateFacultyDto } from './dto/faculty.dto';

@Injectable()
export class FacultyService {
  constructor(
    @InjectModel(Faculty.name) private facultyModel: Model<FacultyDocument>,
  ) {}

  async create(createFacultyDto: CreateFacultyDto, imagePath: string) {
    const newFaculty = new this.facultyModel({
      ...createFacultyDto,
      image: imagePath,
    });
    return newFaculty.save();
  }

  async findAll() {
    return this.facultyModel.find().exec();
  }

  async findOne(id: string) {
    const faculty = await this.facultyModel.findById(id).exec();
    if (!faculty) throw new NotFoundException('Faculty not found');
    return faculty;
  }

  async update(
    id: string,
    updateFacultyDto: UpdateFacultyDto,
    imagePath?: string,
  ) {
    const updated = await this.facultyModel.findByIdAndUpdate(
      id,
      { ...updateFacultyDto, ...(imagePath && { image: imagePath }) },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Faculty not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.facultyModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Faculty not found');
    return deleted;
  }
}
