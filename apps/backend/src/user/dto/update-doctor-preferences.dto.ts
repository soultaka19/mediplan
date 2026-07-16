import { IsInt, Max, Min } from 'class-validator';

export class UpdateDoctorPreferencesDto {
  @IsInt()
  @Min(5)
  @Max(240)
  consultationDurationMin: number;
}
