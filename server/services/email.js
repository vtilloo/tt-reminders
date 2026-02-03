// Using Resend HTTP API instead of SMTP (Render blocks SMTP ports)

export async function sendSkipNotification(userEmail, userName, classTitle, classDate) {
  const apiKey = process.env.RESEND_API_KEY;
  const clubEmail = process.env.CLUB_EMAIL;

  console.log('Attempting to send skip notification email...');
  console.log('RESEND_API_KEY:', apiKey ? 'SET' : 'NOT SET');
  console.log('CLUB_EMAIL:', clubEmail || 'NOT SET');

  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return { success: false, reason: 'Resend API key not configured' };
  }

  if (!clubEmail) {
    console.warn('CLUB_EMAIL not configured - skipping email');
    return { success: false, reason: 'Club email not configured' };
  }

  const formattedDate = new Date(classDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const emailData = {
    from: 'TT Reminders <onboarding@resend.dev>',
    to: [clubEmail],
    subject: `Class Skip Notification - ${userName}`,
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

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return { success: false, reason: result.message || 'API error' };
    }

    console.log('Email sent successfully:', result.id);
    return { success: true };
  } catch (err) {
    console.error('Failed to send email:', err.message);
    return { success: false, reason: err.message };
  }
}
