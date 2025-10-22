import { IsString, IsNumber, IsMongoId, Min } from 'class-validator';

export class CreatePayPalOrderDto {
  @IsMongoId()
  packageId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  packageName: string;
}
