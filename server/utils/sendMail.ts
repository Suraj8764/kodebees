import nodemailer, { Transporter } from 'nodemailer';
import path from 'path';
import ejs from 'ejs';

interface EmailOption {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const sendMail = async (option: EmailOption): Promise<void> => {
  try {
    // Create a transporter
    const transporter: Transporter = nodemailer.createTransport({
        host :process.env.SMTP_HOST,
        port:parseInt(process.env.SMTP_PORT || '587'),
      service: process.env.SMTP_SERVICE, // Or any other email service like Outlook, etc.
      auth: {
        user: process.env.SMTP_USER, // Your email address
        pass: process.env.SMTP_PASS, // Your email password or app-specific password
      },
    });
const {email,subject,template,data}=option
    // Define the path to the EJS template
    const templatePath = path.join(__dirname, '../mails', `${option.template}.ejs`);

    // Render the EJS template with the provided data
    const html = await ejs.renderFile(templatePath, option.data);

    // Send the email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: option.email,
      subject: option.subject,
      html, // The rendered HTML content
    };

    // Send the email using the transporter
    await transporter.sendMail(mailOptions);

    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};
 export default sendMail;