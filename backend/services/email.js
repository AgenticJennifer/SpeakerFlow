const consoleProvider = {
  async send({ to, subject, body, attachment }) {
    console.log(`\n--- [email:console] to=${to} subject="${subject}" ---\n${body}\n---`);
    if (attachment) {
      console.log(`[email:console] attachment=${attachment.filename}\n${attachment.content}\n---`);
    }
  },
};

const resendProvider = {
  async send({ to, subject, body, attachment }) {
    const payload = {
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject,
      text: body,
    };
    if (attachment) {
      payload.attachments = [
        { filename: attachment.filename, content: Buffer.from(attachment.content).toString('base64') },
      ];
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Resend API error (${response.status}): ${text}`);
    }
  },
};

function getProvider() {
  return process.env.RESEND_API_KEY ? resendProvider : consoleProvider;
}

function selfServiceLink(editToken) {
  const base = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${base}/my-submission/${editToken}`;
}

async function sendConfirmationEmail(submission) {
  const link = selfServiceLink(submission.editToken);
  await getProvider().send({
    to: submission.email,
    subject: 'We received your talk submission',
    body:
      `Hi ${submission.name},\n\n` +
      `Thanks for submitting "${submission.talkTitle}"! You can view or edit your submission any time here:\n${link}\n\n` +
      `We'll email you when there's a status update.`,
  });
}

async function sendStatusChangeEmail(submission, newStatus, icsContent) {
  const link = selfServiceLink(submission.editToken);
  const scheduledNote = icsContent
    ? `\n\nYour session is scheduled — a calendar invite is attached for your calendar (Gmail, Outlook, iCal all accept .ics files).`
    : '';
  await getProvider().send({
    to: submission.email,
    subject: `Your talk submission status: ${newStatus}`,
    body:
      `Hi ${submission.name},\n\n` +
      `The status of your submission "${submission.talkTitle}" has changed to: ${newStatus}.\n\n` +
      `View it here: ${link}${scheduledNote}`,
    attachment: icsContent ? { filename: 'session-invite.ics', content: icsContent } : undefined,
  });
}

async function sendCalendarInviteEmail(submission, icsContent) {
  const link = selfServiceLink(submission.editToken);
  await getProvider().send({
    to: submission.email,
    subject: `Your session is scheduled: ${submission.talkTitle}`,
    body:
      `Hi ${submission.name},\n\n` +
      `Your talk "${submission.talkTitle}" has been scheduled for ${submission.sessionDay} ` +
      `${submission.sessionStart}-${submission.sessionEnd} in ${submission.sessionRoom}.\n\n` +
      `A calendar invite is attached — add it to Gmail, Outlook, or iCal.\n\n` +
      `View your submission here: ${link}`,
    attachment: { filename: 'session-invite.ics', content: icsContent },
  });
}

const REMINDER_MESSAGES = {
  missingMaterials:
    'Your talk was accepted, but your bio and/or talk description still look incomplete — ' +
    'please fill those in so we can finalize your speaker materials.',
  unscheduled:
    'Your talk was accepted and is awaiting a schedule slot — no action needed from you yet, ' +
    'we just wanted to keep you posted.',
};

async function sendReminderEmail(submission, reason) {
  const link = selfServiceLink(submission.editToken);
  const message = REMINDER_MESSAGES[reason] || REMINDER_MESSAGES.missingMaterials;
  await getProvider().send({
    to: submission.email,
    subject: `Reminder: "${submission.talkTitle}"`,
    body: `Hi ${submission.name},\n\n${message}\n\nUpdate your submission here: ${link}`,
  });
}

module.exports = {
  sendConfirmationEmail,
  sendStatusChangeEmail,
  sendCalendarInviteEmail,
  sendReminderEmail,
};
