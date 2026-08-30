import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Annulation d'un rendez-vous par la réception.
 *
 * Le motif est **obligatoire** (décision métier verrouillée : annulation avec
 * motif, libère le créneau). Le créneau redevient réservable. Le motif est
 * `trim` avant validation pour rejeter les saisies d'espaces uniquement.
 */
export class CancelAppointmentDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: "Le motif d'annulation est obligatoire." })
  @MaxLength(500)
  cancellationReason: string;
}
