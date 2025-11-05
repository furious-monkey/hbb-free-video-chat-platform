import { IProfile, IUser, IAppointment } from './appointment.interface';
import { CreateAppointmentDTO, UpdateAppointmentStatusDTO, UpdateAppointmentDTO } from './appointment.dto';
import * as appointmentRepository from './appointment.repository';
import { APIError } from '../../middleware/error/appError';

export const scheduleAppointment = async (data: CreateAppointmentDTO, callerId: string) => {
  return appointmentRepository.createAppointment(data, callerId);
};

export const viewScheduledAppointments = async (receiverId: string) => {
  return appointmentRepository.findAppointmentsByUserId(receiverId);
};

export const updateAppointmentsStatus = async (): Promise<IAppointment[]> => {
  try {
    const appointments: IAppointment[] = await appointmentRepository.findAppointmentsToUpdate();

    // Use the IAppointment type for the parameter in map
    const updatePromises = appointments.map((appointment: IAppointment) =>
      appointmentRepository.updateAppointmentStatus({
        id: appointment.id,
        appointmentReached: true,
      })
    );

    return Promise.all(updatePromises);
  } catch (error) {
    console.error('Error updating appointments:', error);
    throw error;
  }
};

export const updateAppointment = async (data: UpdateAppointmentDTO) => {
  return appointmentRepository.updateAppointment(data);
};