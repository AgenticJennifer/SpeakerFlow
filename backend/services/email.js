const consoleProvider = {
  async send({ to, subject, body }) {
    console.log(`\n--- [email:console] to=${to} subject="${subject}" ---\n${body}\n---`);
  },
};

const resendProvider = {
  async send({ to, subject, body }) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [to],
        subject,
        text: body,
      }),
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

async function sendStatusChangeEmail(submission, newStatus) {
  const link = selfServiceLink(submission.editToken);
  await getProvider().send({
    to: submission.email,
    subject: `Your talk submission status: ${newStatus}`,
    body:
      `Hi ${submission.name},\n\n` +
      `The status of your submission "${submission.talkTitle}" has changed to: ${newStatus}.\n\n` +
      `View it here: ${link}`,
  });
}

module.exports = { sendConfirmationEmail, sendStatusChangeEmail };
