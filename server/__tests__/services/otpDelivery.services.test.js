import { jest } from "@jest/globals";

const sendMailMock = jest.fn();
const transportFactoryMock = jest.fn();

const { sendPasswordResetOtp, __setOtpTransportFactoryForTests } = await import("../../services/otpDelivery.services.js");

describe("otpDelivery.services", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...envBackup };
    __setOtpTransportFactoryForTests(null);
  });

  afterAll(() => {
    process.env = envBackup;
  });

  it("falls back to console channel when smtp env is missing", async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const result = await sendPasswordResetOtp({ email: "a@b.com", otp: "123456" });

    expect(result).toEqual({ sent: true, channel: "console" });
    expect(transportFactoryMock).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();

    logSpy.mockRestore();
  });

  it("sends otp by smtp when smtp config exists", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "noreply@example.com";
    process.env.SMTP_PASS = "secret";
    process.env.SMTP_PORT = "587";

    sendMailMock.mockResolvedValue({ messageId: "m1" });
    transportFactoryMock.mockReturnValue({ sendMail: sendMailMock });
    __setOtpTransportFactoryForTests(transportFactoryMock);

    const result = await sendPasswordResetOtp({ email: "a@b.com", otp: "654321" });

    expect(transportFactoryMock).toHaveBeenCalledWith(expect.objectContaining({
      host: "smtp.example.com",
      port: 587,
      user: "noreply@example.com",
      pass: "secret"
    }));
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
      to: "a@b.com",
      subject: "Publishelf Password Reset OTP"
    }));
    expect(result).toEqual({ sent: true, channel: "smtp" });
  });
});
