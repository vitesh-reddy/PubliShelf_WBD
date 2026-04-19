import { jest } from "@jest/globals";

const configMock = jest.fn();
const dotenvConfigMock = jest.fn();

jest.unstable_mockModule("cloudinary", () => ({
  v2: {
    config: configMock
  }
}));

jest.unstable_mockModule("dotenv", () => ({
  default: {
    config: dotenvConfigMock
  }
}));

describe("config/cloudinary", () => {
  const oldEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...oldEnv,
      CLOUDINARY_CLOUD_NAME: "demo-cloud",
      CLOUDINARY_API_KEY: "demo-key",
      CLOUDINARY_API_SECRET: "demo-secret"
    };
    configMock.mockClear();
    dotenvConfigMock.mockClear();
  });

  afterAll(() => {
    process.env = oldEnv;
  });

  it("loads env and configures cloudinary", async () => {
    const mod = await import("../../config/cloudinary.js");

    expect(dotenvConfigMock).toHaveBeenCalledTimes(1);
    expect(configMock).toHaveBeenCalledWith({
      cloud_name: "demo-cloud",
      api_key: "demo-key",
      api_secret: "demo-secret"
    });
    expect(mod.default).toEqual({ config: configMock });
  });
});
