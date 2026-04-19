import { jest } from "@jest/globals";

const findOneAndUpdateMock = jest.fn();
const findOneMock = jest.fn();
const loggerWarnMock = jest.fn();
const loggerErrorMock = jest.fn();
const loggerInfoMock = jest.fn();
const safeRedisOperationMock = jest.fn();

jest.unstable_mockModule("../../models/Analytics.model.js", () => ({
  default: {
    findOneAndUpdate: findOneAndUpdateMock,
    findOne: findOneMock
  }
}));

jest.unstable_mockModule("../../config/redis.js", () => ({
  safeRedisOperation: safeRedisOperationMock
}));

jest.unstable_mockModule("../../config/logger.js", () => ({
  default: {
    warn: loggerWarnMock,
    error: loggerErrorMock,
    info: loggerInfoMock
  }
}));

const { recordVisit, getStats, initializeAnalytics } = await import("../../services/analytics.services.js");

describe("analytics.services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("records visit in redis with anonymous fallback identifier", async () => {
    const client = {
      incr: jest.fn().mockResolvedValue(1),
      sAdd: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1)
    };
    safeRedisOperationMock.mockImplementation(async (op) => op(client));

    await recordVisit();

    expect(client.incr).toHaveBeenCalledTimes(2);
    expect(client.sAdd).toHaveBeenCalledWith(expect.stringContaining("analytics:users"), "anonymous");
    expect(loggerWarnMock).not.toHaveBeenCalled();
  });

  it("falls back to mongodb when redis visit recording fails", async () => {
    safeRedisOperationMock.mockResolvedValue(null);
    findOneAndUpdateMock.mockResolvedValue({ _id: "analytics-doc" });

    await recordVisit("user-1");

    expect(loggerWarnMock).toHaveBeenCalled();
    expect(findOneAndUpdateMock).toHaveBeenCalledWith(
      expect.any(Object),
      { $inc: { viewsToday: 1 } },
      { upsert: true }
    );
  });

  it("returns redis-backed stats and triggers background persistence", async () => {
    const client = {
      get: jest.fn().mockImplementation((key) => {
        if (key === "analytics:views:total") return Promise.resolve("100");
        if (key.startsWith("analytics:views:")) return Promise.resolve("25");
        return Promise.resolve("0");
      }),
      sCard: jest.fn().mockImplementation((key) => {
        if (key === "analytics:users:total") return Promise.resolve(40);
        return Promise.resolve(10);
      })
    };

    safeRedisOperationMock
      .mockImplementationOnce(async (op) => op(client))
      .mockImplementationOnce(async (op) => op(client));
    findOneAndUpdateMock.mockResolvedValue({ _id: "snapshot-doc" });

    const stats = await getStats();

    expect(stats).toEqual({
      totalViews: 100,
      totalUsers: 40,
      viewsToday: 25,
      usersToday: 10
    });
  });

  it("falls back to mongodb in getStats when redis is unavailable", async () => {
    safeRedisOperationMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(true);
    findOneMock.mockResolvedValue({ viewsToday: 12, usersToday: 5 });

    const stats = await getStats();

    expect(findOneMock).toHaveBeenCalledWith({ date: expect.any(String) });
    expect(stats.viewsToday).toBe(12);
    expect(stats.usersToday).toBe(5);
  });

  it("initializes redis values from mongodb when not already initialized", async () => {
    safeRedisOperationMock
      .mockResolvedValueOnce(null)
      .mockImplementationOnce(async (op) =>
        op({
          set: jest.fn().mockResolvedValue("OK"),
          expire: jest.fn().mockResolvedValue(1)
        })
      );
    findOneMock.mockResolvedValue({ viewsToday: 55 });

    await initializeAnalytics();

    expect(findOneMock).toHaveBeenCalledWith({ date: expect.any(String) });
    expect(loggerInfoMock).toHaveBeenCalled();
  });
});
