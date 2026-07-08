import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRole } from '../user/user-role.enum';
import { AppointmentStatus } from './appointment-status.enum';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentResponse } from './dto/appointment-response.dto';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: jest.Mocked<
    Pick<AppointmentsService, 'createByReception' | 'findToday' | 'updateStatus'>
  >;

  const currentUser: AuthenticatedUser = {
    id: 'doctor-1',
    role: UserRole.DOCTOR,
    clinicId: 'clinic-1',
    email: 'doctor@example.com',
  };

  const response: AppointmentResponse = {
    id: 'appointment-1',
    slotId: 'slot-1',
    clinicId: 'clinic-1',
    patientId: 'patient-1',
    doctorId: 'doctor-1',
    createdById: 'admin-1',
    status: AppointmentStatus.BOOKED,
    reason: null,
    createdAt: new Date('2026-07-05T13:00:00Z'),
  };

  beforeEach(async () => {
    service = {
      createByReception: jest.fn(),
      findToday: jest.fn(),
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [{ provide: AppointmentsService, useValue: service }],
    }).compile();

    controller = module.get(AppointmentsController);
  });

  it('GET /appointments/today delegue au service avec l utilisateur courant', async () => {
    service.findToday.mockResolvedValue([response]);

    const result = await controller.findToday(currentUser);

    expect(service.findToday.mock.calls[0]).toEqual([currentUser]);
    expect(result).toEqual([response]);
  });

  it('PATCH /appointments/:id/status delegue le changement de statut', async () => {
    service.updateStatus.mockResolvedValue({ ...response, status: AppointmentStatus.ARRIVED });

    const result = await controller.updateStatus(currentUser, 'appointment-1', {
      status: AppointmentStatus.ARRIVED,
    });

    expect(service.updateStatus.mock.calls[0]).toEqual([
      currentUser,
      'appointment-1',
      { status: AppointmentStatus.ARRIVED },
    ]);
    expect(result.status).toBe(AppointmentStatus.ARRIVED);
  });
});
