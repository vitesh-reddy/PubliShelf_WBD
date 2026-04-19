// services/otpDelivery.services.js

let testTransportFactory = null;

export const __setOtpTransportFactoryForTests = (factory) => {
  testTransportFactory = factory;
};

const createTransporter = async () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  if (testTransportFactory) {
    return testTransportFactory({ host, port, user, pass });
  }

  let nodemailer;
  try {
    ({ default: nodemailer } = await import("nodemailer"));
  } catch {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
};

export const sendPasswordResetOtp = async ({ email, otp }) => {
  const transporter = await createTransporter();

  if (!transporter) {
    // Fallback for local development where SMTP is not configured.
    console.log(`[OTP-DEV] Password reset OTP for ${email}: ${otp}`);
    return { sent: true, channel: "console" };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Publishelf Password Reset OTP",
    text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your password reset OTP is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`
  });

  return { sent: true, channel: "smtp" };
};
