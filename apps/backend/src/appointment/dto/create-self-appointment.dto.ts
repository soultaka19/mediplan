import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * Réservation d'un créneau par le patient lui-même (MEDIPLAN-21).
 *
 * Volontairement plus pauvre que `CreateReceptionAppointmentDto` : le patient
 * ne désigne personne d'autre que lui-même. Il n'y a donc **ni `patientId`, ni
 * bloc `patient`** — l'identité du réservant est lue dans le jeton, jamais dans
 * le corps de la requête. C'est ce qui interdit de réserver au nom d'autrui.
 */
export class CreateSelfAppointmentDto {
  @IsUUID()
  slotId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
