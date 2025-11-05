export interface CreateAppointmentDTO {
  receiverId: string;
  date: Date;
}

export interface UpdateAppointmentDTO {
  id: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  date?: Date;
}

export interface UpdateAppointmentStatusDTO {
  id: string;
  appointmentReached: boolean;
}

