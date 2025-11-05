import { Request, Response, Router, NextFunction } from 'express';
import * as appointmentService from './appointment.service';
import { CreateAppointmentDTO, UpdateAppointmentDTO } from './appointment.dto';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';
import { assertHasUser, verifyJwt, } from '../../middleware/verifyJwt';

import cron from 'node-cron';


export const scheduleAppointmentCtrl = async (req: Request, res: Response, next: NextFunction) => {
  assertHasUser(req);

  const userId = req.user?.id as string;
  const { receiverId, date } = req.body as CreateAppointmentDTO;

  try {
    const appointment = await appointmentService.scheduleAppointment({ receiverId, date }, userId);
    res.status(201).json({ message: 'Appointment scheduled successfully', appointment });
  } catch (error) {
    logger.error('Error scheduling appointment', error);
    next(new APIError('Server Error', 'createOrUpdateProfile', 500, {}, true));
  }
};

export const viewScheduledAppointmentsCtrl = async (req: Request, res: Response, next: NextFunction) => {
  assertHasUser(req);

  const userId = req.user?.id as string;

  try {
    const appointments = await appointmentService.viewScheduledAppointments(userId);
    res.status(200).json({ appointments });
  } catch (error) {
    logger.error('Error fetching appointments', error);
    next(new APIError('Server Error', 'createOrUpdateProfile', 500, {}, true));
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const updateAppointmentsStatusCtrl = async () => {
  try {
    await appointmentService.updateAppointmentsStatus();
    console.log('Appointments updated successfully');
  } catch (error) {
    console.error('Error updating appointments:', error);
  }
};

export const updateAppointmentCtrl = async (req: Request, res: Response, next: NextFunction) => {
  assertHasUser(req);

  const { id, status, date } = req.body as UpdateAppointmentDTO;

  try {
    const appointment = await appointmentService.updateAppointment({ id, status, date });
    res.status(200).json({ message: 'Appointment updated successfully', appointment });
  } catch (error) {
    logger.error('Error updating appointment', error);
    next(new APIError('Server Error', 'updateAppointmentCtrl', 500, {}, true));
  }
};

// Schedule the job to run every minute
cron.schedule('* * * * *', updateAppointmentsStatusCtrl);

// Set up API routes.
const router = Router();

router.post('/', verifyJwt, scheduleAppointmentCtrl);
router.get('/', verifyJwt, viewScheduledAppointmentsCtrl);
router.put('/', verifyJwt, updateAppointmentCtrl);

export default router;
