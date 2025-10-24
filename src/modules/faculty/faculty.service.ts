import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Faculty, FacultyDocument } from './schema/faculty.schema';
import { CreateFacultyDto, UpdateFacultyDto } from './dto/faculty.dto';

@Injectable()
export class FacultyService {
  private readonly domain = process.env.BACKEND_IMAGE_DOMAIN || '';

  constructor(
    @InjectModel(Faculty.name) private facultyModel: Model<FacultyDocument>,
  ) {}

  private addDomainToImage(faculty: FacultyDocument | any) {
    if (!faculty) return null;
    const obj = faculty.toObject ? faculty.toObject() : faculty;
    if (obj.image && !obj.image.startsWith('http')) {
      obj.image = `${this.domain}/${obj.image}`;
    }
    return obj;
  }

  async create(createFacultyDto: CreateFacultyDto, imagePath: string) {
    const newFaculty = new this.facultyModel({
      ...createFacultyDto,
      image: imagePath,
    });
    const saved = await newFaculty.save();
    return this.addDomainToImage(saved);
  }

  async findAll() {
    const faculties = await this.facultyModel.find().exec();
    return faculties.map((f) => this.addDomainToImage(f));
  }

  async findOne(id: string) {
    const faculty = await this.facultyModel.findById(id).exec();
    if (!faculty) throw new NotFoundException('Faculty not found');
    return this.addDomainToImage(faculty);
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
    return this.addDomainToImage(updated);
  }

  async remove(id: string) {
    const deleted = await this.facultyModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Faculty not found');
    return this.addDomainToImage(deleted);
  }
}
