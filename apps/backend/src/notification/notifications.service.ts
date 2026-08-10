import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, In, IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { AppointmentStatus } from '../appointment/appointment-status.enum';
import { AuthenticatedUser } from '../auth/auth.types';
import { User } from '../user/user.entity';
import { UserRole } from '../user/user-role.enum';
import { NotificationResponse, toNotificationResponse } from './dto/notification-response.dto';
import { Notification } from './notification.entity';
import { NotificationType } from './notification-type.enum';

interface AppointmentNotificationParams {
  manager: EntityManager;
  appointment: Appointment;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async listForUser(currentUser: AuthenticatedUser): Promise<NotificationResponse[]> {
    const notifications = await this.notificationRepository.find({
      where: { recipientId: currentUser.id },
      order: { createdAt: 'DESC' },
      take: 30,
    });

    return notifications.map(toNotificationResponse);
  }

  async unreadCount(currentUser: AuthenticatedUser): Promise<number> {
    return this.notificationRepository.count({
      where: { recipientId: currentUser.id, readAt: IsNull() },
    });
  }

  async markAsRead(
    currentUser: AuthenticatedUser,
    notificationId: string,
  ): Promise<NotificationResponse> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, recipientId: currentUser.id },
    });

    if (!notification) {
      throw new NotFoundException('Notification introuvable.');
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notificationRepository.save(notification);
    }

    return toNotificationResponse(notification);
  }

  async notifyAppointmentBooked(params: AppointmentNotificationParams): Promise<void> {
    await this.createAppointmentNotification({
      ...params,
      type: NotificationType.APPOINTMENT_BOOKED,
      title: 'Nouveau rendez-vous',
      message: this.appointmentMessage(params.appointment, 'Un rendez-vous a ete reserve'),
    });
  }

  async notifyAppointmentCancelled(params: AppointmentNotificationParams): Promise<void> {
    await this.createAppointmentNotification({
      ...params,
      type: NotificationType.APPOINTMENT_CANCELLED,
      title: 'Rendez-vous annule',
      message: this.cancellationMessage(params.appointment),
    });
  }

  async notifyAppointmentUpdated(params: AppointmentNotificationParams): Promise<void> {
    await this.createAppointmentNotification({
      ...params,
      type: NotificationType.APPOINTMENT_UPDATED,
      title: 'Rendez-vous mis a jour',
      message: this.appointmentMessage(
        params.appointment,
        `Le statut du rendez-vous est maintenant ${this.statusLabel(params.appointment.status)}`,
      ),
    });
  }

  private async createAppointmentNotification(params: {
    manager: EntityManager;
    appointment: Appointment;
    type: NotificationType;
    title: string;
    message: string;
  }): Promise<void> {
    const recipientIds = await this.resolveRecipients(params.manager, params.appointment);
    if (recipientIds.length === 0) {
      return;
    }

    const notifications = recipientIds.map((recipientId) =>
      params.manager.create(Notification, {
        recipientId,
        clinicId: params.appointment.clinicId,
        type: params.type,
        title: params.title,
        message: params.message,
        actionUrl: '/clinic-flow/today',
        readAt: null,
      }),
    );

    await params.manager.save(Notification, notifications);
  }

  private async resolveRecipients(
    manager: EntityManager,
    appointment: Appointment,
  ): Promise<string[]> {
    const recipients = new Set<string>();
    recipients.add(appointment.doctorId);

    const staff = await manager.find(User, {
      select: { id: true },
      where: [
        { clinicId: appointment.clinicId, role: In([UserRole.CLINIC_ADMIN, UserRole.DOCTOR]) },
        { role: UserRole.SUPER_ADMIN },
      ],
    });

    staff.forEach((user) => recipients.add(user.id));
    return [...recipients];
  }

  private appointmentMessage(appointment: Appointment, prefix: string): string {
    const patientName = this.displayName(appointment.patient) ?? 'un patient';
    const doctorName = this.displayName(appointment.doctor) ?? 'le medecin';
    const slot = appointment.slot?.startAt
      ? new Intl.DateTimeFormat('fr-CA', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'America/Toronto',
        }).format(appointment.slot.startAt)
      : 'un creneau';

    return `${prefix} pour ${patientName} avec ${doctorName}, le ${slot}.`;
  }

  private cancellationMessage(appointment: Appointment): string {
    const message = this.appointmentMessage(appointment, 'Un rendez-vous a ete annule');
    const reason = appointment.cancellationReason?.trim();

    if (!reason) {
      return message;
    }

    return `${message} Motif : ${reason}.`;
  }

  private displayName(user?: User | null): string | null {
    if (!user) {
      return null;
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email;
  }

  private statusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      [AppointmentStatus.BOOKED]: 'reserve',
      [AppointmentStatus.ARRIVED]: 'arrive',
      [AppointmentStatus.IN_CONSULTATION]: 'en consultation',
      [AppointmentStatus.COMPLETED]: 'termine',
      [AppointmentStatus.ABSENT]: 'absent',
      [AppointmentStatus.CANCELLED]: 'annule',
    };

    return labels[status];
  }
}
