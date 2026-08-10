export interface StatisticsSummary {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  noShowRate: number;
  totalSlots: number;
  occupiedSlots: number;
  occupancyRate: number;
}

export interface DoctorStatistics {
  doctorId: string;
  doctorName: string;
  totalAppointments: number;
  noShowAppointments: number;
  noShowRate: number;
  totalSlots: number;
  occupiedSlots: number;
  occupancyRate: number;
}

export interface StatisticsResponse {
  filters: {
    startDate: string;
    endDate: string;
    doctorId: string | null;
  };
  summary: StatisticsSummary;
  byDoctor: DoctorStatistics[];
}
