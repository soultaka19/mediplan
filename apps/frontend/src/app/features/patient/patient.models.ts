/**
 * Créneau encore réservable, tel que proposé au patient.
 *
 * Le backend ne renvoie que des créneaux libres, à venir, et bornés à la
 * clinique du patient : le frontend n'a donc aucun filtrage de sécurité à
 * refaire, seulement du confort d'affichage.
 */
export interface OpenSlot {
  id: string;
  doctorId: string;
  doctorName: string;
  startAt: string;
  endAt: string;
}

/** Charge utile de réservation par le patient lui-même. */
export interface BookSelfPayload {
  slotId: string;
  reason?: string;
}

/** Clinique de l'annuaire public (choix à l'inscription). */
export interface PublicClinic {
  id: string;
  name: string;
  address: string | null;
}
