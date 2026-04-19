/* eslint-disable no-undef */
import { jest } from "@jest/globals";
import { configureStore } from "@reduxjs/toolkit";

const axiosGetMock = jest.fn();

jest.unstable_mockModule("../../utils/axiosInstance.util", () => ({
  default: {
    get: axiosGetMock
  }
}));

const {
  default: backendReducer,
  checkBackendHealth,
  incrementAttempt,
  resetBackendState,
  setCelebrationShown
} = await import("../../store/slices/backendSlice.js");

describe("backendSlice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("increments attempt counter", () => {
    const state = backendReducer(undefined, incrementAttempt());
    expect(state.attempts).toBe(1);
  });

  it("sets celebration shown flag", () => {
    const state = backendReducer(undefined, setCelebrationShown());
    expect(state.celebrationShown).toBe(true);
  });

  it("resets state to retry mode", () => {
    const started = {
      ...backendReducer(undefined, incrementAttempt()),
      isReady: true,
      isChecking: false,
      celebrationShown: true,
      error: "x"
    };

    const state = backendReducer(started, resetBackendState());

    expect(state.isReady).toBe(false);
    expect(state.isChecking).toBe(true);
    expect(state.attempts).toBe(0);
    expect(state.error).toBeNull();
    expect(state.celebrationShown).toBe(false);
  });

  it("checkBackendHealth fulfilled marks backend ready", async () => {
    axiosGetMock.mockResolvedValue({ data: { success: true } });
    const store = configureStore({ reducer: { backend: backendReducer } });

    await store.dispatch(checkBackendHealth());

    const state = store.getState().backend;
    expect(state.isReady).toBe(true);
    expect(state.isChecking).toBe(false);
    expect(state.error).toBeNull();
  });

  it("checkBackendHealth rejected keeps backend not ready initially", async () => {
    axiosGetMock.mockRejectedValue(new Error("down"));
    const store = configureStore({ reducer: { backend: backendReducer } });

    await store.dispatch(checkBackendHealth());

    const state = store.getState().backend;
    expect(state.isChecking).toBe(false);
    expect(state.error).toBe("down");
  });

  it("checkBackendHealth rejected marks ready after max attempts reached", async () => {
    axiosGetMock.mockRejectedValue(new Error("down"));

    const preloadedState = {
      backend: {
        isReady: false,
        isChecking: true,
        error: null,
        attempts: 30,
        maxAttempts: 30,
        celebrationShown: false
      }
    };

    const store = configureStore({
      reducer: { backend: backendReducer },
      preloadedState
    });

    await store.dispatch(checkBackendHealth());

    const state = store.getState().backend;
    expect(state.isReady).toBe(true);
    expect(state.error).toBe("down");
  });
});
