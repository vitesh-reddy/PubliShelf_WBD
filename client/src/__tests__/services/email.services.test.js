/* eslint-disable no-undef */
import { jest } from "@jest/globals";

jest.unstable_mockModule("../../utils/axiosInstance.util.js", () => ({
  default: {
    post: jest.fn()
  }
}));

const { sendContactEmail } = await import("../../services/email.services.js");
const axiosInstance = (await import("../../utils/axiosInstance.util.js")).default;

describe("email.services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("posts contact email payload to emailjs endpoint", async () => {
    const payload = { template_id: "t1", user_id: "u1" };
    axiosInstance.post.mockResolvedValue({ data: { status: 200, text: "OK" } });

    const result = await sendContactEmail(payload);

    expect(axiosInstance.post).toHaveBeenCalledWith(
      "https://api.emailjs.com/api/v1.0/email/send",
      payload,
      { withCredentials: false }
    );
    expect(result).toEqual({ status: 200, text: "OK" });
  });
});
