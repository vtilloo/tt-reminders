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
    from: process.env.SMTP_USER,
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
    await transport.sendMail(mailOptions);
    console.log(`Skip notification email sent to ${clubEmail} for user ${userName}`);
    return { success: true };
  } catch (err) {
    console.error('Failed to send skip notification email:', err.message);
    return { success: false, reason: err.message };
  }
}
