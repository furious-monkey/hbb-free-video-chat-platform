import mailgun from 'mailgun-js';
import { ContactUsDto } from './noAuth.dto';

const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY as string,
  domain: process.env.MAILGUN_DOMAIN as string,
});

export const sendContactUsEmail = async (data: ContactUsDto): Promise<void> => {
  const { name, email, subject, message } = data;

  const mailOptions = {
    from: process.env.MAILGUN_SENDER_EMAIL as string, 
    to: process.env.ADMIN_EMAIL as string,  
    subject: `Contact Us: ${subject}`,
    text: `You have received a new message from ${name} (${email}):\n\n${message}`,
  };

  try {
    await mg.messages().send(mailOptions);
  } catch (err) {
    console.error('Error sending email with Mailgun:', err);
    throw new Error('Failed to send email');
  }
};
