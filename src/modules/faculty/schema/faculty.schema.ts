import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/** ---------------- Subdocuments ---------------- */

/** Social Media Subdocument */
@Schema({ _id: false })
export class SocialMedia {
  @Prop({ trim: true })
  twitter?: string;

  @Prop({ trim: true })
  linkedin?: string;

  // Add more platforms if needed
}

/** Education Subdocument */
@Schema({ _id: false })
export class Education {
  @Prop({ required: true, trim: true })
  degree: string;

  @Prop({ required: true, trim: true })
  institution: string;

  @Prop({ required: true })
  year: number;

  @Prop({
    enum: ['degree', 'residency', 'fellowship', 'certification'],
    default: 'degree',
  })
  type?: 'degree' | 'residency' | 'fellowship' | 'certification';
}

/** Experience Subdocument */
@Schema({ _id: false })
export class Experience {
  @Prop({ required: true, trim: true })
  position: string;

  @Prop({ required: true, trim: true })
  institution: string;

  @Prop({ required: true })
  startYear: number;

  @Prop()
  endYear?: number;

  @Prop({ trim: true })
  description?: string;
}

/** Research Project Subdocument */
@Schema({ _id: false })
export class ResearchProject {
  @Prop({ trim: true })
  title?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [String], trim: true })
  collaborators?: string[];
}

/** Research Subdocument */
@Schema({ _id: false })
export class Research {
  @Prop({ type: [String], trim: true })
  areas?: string[];

  @Prop({ type: [String], trim: true })
  interests?: string[];

  @Prop({ type: [ResearchProject] })
  currentProjects?: ResearchProject[];
}

/** Publication Subdocument */
@Schema({ _id: false })
export class Publication {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: [String], trim: true })
  authors?: string[];

  @Prop({ trim: true })
  journal?: string;

  @Prop({ required: true })
  year: number;

  @Prop({ trim: true })
  doi?: string;

  @Prop({ trim: true })
  pmid?: string;

  @Prop({
    enum: ['journal', 'conference', 'book', 'chapter', 'abstract'],
    default: 'journal',
  })
  type?: 'journal' | 'conference' | 'book' | 'chapter' | 'abstract';
}

/** Award Subdocument */
@Schema({ _id: false })
export class Award {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  organization?: string;

  @Prop({ required: true })
  year: number;

  @Prop({ trim: true })
  description?: string;
}

/** Membership Subdocument */
@Schema({ _id: false })
export class Membership {
  @Prop({ required: true, trim: true })
  organization: string;

  @Prop({ trim: true })
  position?: string;

  @Prop()
  startYear?: number;

  @Prop()
  endYear?: number;
}

/** Availability Subdocument */
@Schema({ _id: false })
export class Availability {
  @Prop({ trim: true })
  office_hours?: string;

  @Prop({ default: true })
  appointment_required?: boolean;
}

/** ---------------- Main Faculty Schema ---------------- */
export type FacultyDocument = Faculty & Document;

@Schema({ timestamps: true })
export class Faculty {
  // Basic Info
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  location: string;

  @Prop({ required: true, trim: true })
  country: string;

  @Prop({ required: true, trim: true, unique: true })
  email: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true })
  image: string;

  @Prop({ type: [String], trim: true })
  specializations?: string[];

  // Subdocuments
  @Prop({ type: SocialMedia })
  socialMedia?: SocialMedia;

  @Prop({ type: [Education] })
  education?: Education[];

  @Prop({ type: [Experience] })
  experience?: Experience[];

  @Prop({ type: Research })
  research?: Research;

  @Prop({ type: [Publication] })
  publications?: Publication[];

  @Prop({ type: [Award] })
  awards?: Award[];

  @Prop({ type: [Membership] })
  memberships?: Membership[];

  @Prop({ type: Availability })
  availability?: Availability;

  // Status
  @Prop({
    enum: ['active', 'inactive', 'retired', 'sabbatical'],
    default: 'active',
  })
  status?: 'active' | 'inactive' | 'retired' | 'sabbatical';

  @Prop({ default: true })
  isPublic?: boolean;

  yearsOfExperience?: number;
}

export const FacultySchema = SchemaFactory.createForClass(Faculty);
FacultySchema.pre('save', function (next) {
  if (this.education && this.education.length > 0) {
    const oldestEducation = this.education.reduce((oldest, current) =>
      current.year < oldest.year ? current : oldest,
    );
    this.yearsOfExperience = new Date().getFullYear() - oldestEducation.year;
  }
  next();
});

FacultySchema.index({
  name: 'text',
  description: 'text',
  specializations: 'text',
  'education.institution': 'text',
});
