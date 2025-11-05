import { Prisma, PrismaClient } from '@prisma/client';
import { IProfile, IUser } from './appointment.interface';
import { CreateAppointmentDTO, UpdateAppointmentStatusDTO, UpdateAppointmentDTO } from './appointment.dto';

const prisma = new PrismaClient();

export const createAppointment = async (data: CreateAppointmentDTO, callerId: string) => {
  const isoDate = new Date(data.date).toISOString();
  return prisma.appointment.create({
    data: {
      callerId,
      receiverId: data.receiverId,
      date: isoDate,
      status: 'PENDING',
      appointmentReached: false,
    },
  });
};


export const findAppointmentsByUserId = async (userId: string) => {
  return prisma.appointment.findMany({
    where: {
      OR: [
        { receiverId: userId },
        { callerId: userId },
      ],
    },
    include: {
      caller: {
        include: {
          profile: true,
        },
      },
      receiver: {
        include: {
          profile: true,
        },
      },
    },
  });
};



export const findAppointmentsToUpdate = async () => {
  return prisma.appointment.findMany({
    where: {
      date: { lte: new Date() },
      appointmentReached: false,
    },
  });
};

export const updateAppointmentStatus = async (appointment: UpdateAppointmentStatusDTO) => {
  return prisma.appointment.update({
    where: { id: appointment.id },
    data: { appointmentReached: appointment.appointmentReached },
  });
};

export const updateAppointment = async (data: UpdateAppointmentDTO) => {
  const updateData: any = {};
  if (data.date) updateData.date = new Date(data.date).toISOString();
  if (data.status) updateData.status = data.status;

  return prisma.appointment.update({
    where: { id: data.id },
    data: updateData,
  });
};