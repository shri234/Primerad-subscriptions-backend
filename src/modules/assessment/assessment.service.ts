import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assessment, AssessmentDocument } from './schema/assessment.schema';
import {
  UserAssessment,
  UserAssessmentDocument,
} from './schema/user-assessment.schema';
import * as stringSimilarity from 'string-similarity';

@Injectable()
export class AssessmentService {
  constructor(
    @InjectModel(Assessment.name)
    private readonly assessmentModel: Model<AssessmentDocument>,
    @InjectModel(UserAssessment.name)
    private readonly userAssessmentModel: Model<UserAssessmentDocument>,
  ) {}

  async createAssessment(data: Partial<Assessment>) {
    return this.assessmentModel.create(data);
  }

  async getAssessmentsBySession(sessionId: string) {
    return this.assessmentModel.find({ sessionId }).lean();
  }

  async submitUserAnswer(
    userId: string,
    assessmentId: string,
    userAnswer: string,
  ) {
    const assessment = await this.assessmentModel.findById(assessmentId);
    if (!assessment) throw new NotFoundException('Assessment not found');

    const facultyAnswer = (assessment.facultyAnswer || '').trim().toLowerCase();
    const userResponse = (userAnswer || '').trim().toLowerCase();

    let pointsAwarded = 0;

    if (facultyAnswer && userResponse) {
      const similarity = stringSimilarity.compareTwoStrings(
        facultyAnswer,
        userResponse,
      );

      if (similarity === 1) {
        pointsAwarded = assessment.maxPoints;
      } else if (similarity >= 0.7) {
        pointsAwarded = Math.floor(assessment.maxPoints / 2);
      } else {
        pointsAwarded = 0;
      }
    }

    const record = await this.userAssessmentModel.findOneAndUpdate(
      { userId, assessmentId },
      { userAnswer, pointsAwarded, isReviewed: true },
      { new: true, upsert: true },
    );

    const totalPointsData = await this.userAssessmentModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $group: { _id: null, totalPoints: { $sum: '$pointsAwarded' } } },
    ]);

    const totalPoints = totalPointsData[0]?.totalPoints || 0;
    const belt = this.calculateBelt(totalPoints);

    await this.userAssessmentModel.updateMany(
      { userId },
      { totalPoints, belt },
    );

    return { ...record.toObject(), totalPoints, belt };
  }

  async getUserAssessments(userId: string) {
    return this.userAssessmentModel
      .find({ userId })
      .populate('assessmentId')
      .lean();
  }

  private calculateBelt(totalPoints: number): string {
    if (totalPoints >= 1000) return 'Black';
    if (totalPoints >= 700) return 'Brown';
    if (totalPoints >= 400) return 'Blue';
    if (totalPoints >= 200) return 'Green';
    if (totalPoints >= 100) return 'Yellow';
    return 'White';
  }
}
