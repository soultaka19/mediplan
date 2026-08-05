import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class StatisticsQueryDto {
  @IsOptional()
  @IsISO8601({ strict: true })
  startDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  endDate?: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;
}
