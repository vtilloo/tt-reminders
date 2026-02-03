import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (!transporter && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

export async function sendSkipNotification(userEmail, userName, classTitle, classDate) {
  console.log('Attempting to send skip notification email...');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
  console.log('CLUB_EMAIL:', process.env.CLUB_EMAIL || 'NOT SET');

  const transport = getTransporter();
  const clubEmail = process.env.CLUB_EMAIL;

  if (!transport) {
    console.warn('Email not configured - skipping skip notification email');
    return { success: false, reason: 'Email not configured' };
  }

  if (!clubEmail) {
    console.warn('CLUB_EMAIL not configured - skipping skip notification email');
    return { success: false, reason: 'Club email not configured' };
  }

  const formattedDate = new Date(classDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || 'onboarding@resend.dev',
    to: clubEmail,
    subject: `Class Skip Notification - ${userName}`,
    text: `A member has indicated they will skip a class.

Member: ${userName}
Email: ${userEmail}
Class: ${classTitle}
Scheduled Date: ${formattedDate}

This is an automated notification from TT Reminders.`,
    html: `
      <h2>Class Skip Notification</h2>
      <p>A member has indicated they will skip a class.</p>
      <table style="border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Member</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${userName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${userEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Class</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${classTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Scheduled Date</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formattedDate}</td>
        </tr>
      </table>
      <p style="color: #666; font-size: 12px;">This is an automated notification from TT Reminders.</p>
    `
  };

  try {
    console.log('Sending email to:', clubEmail);
    const result = await transport.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true };
  } catch (err) {
    console.error('Failed to send skip notification email:', err.message);
    console.error('Full error:', err);
    return { success: false, reason: err.message };
  }
}
