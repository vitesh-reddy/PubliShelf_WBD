/* eslint-disable no-undef */
import { jest } from "@jest/globals";

jest.unstable_mockModule("../../utils/axiosInstance.util.js", () => ({
  default: {
    get: jest.fn()
  }
}));

const { getAuctionPage, getAuctionItemDetail, getAuctionOngoing } = await import("../../services/antiqueBook.services.js");
const axiosInstance = (await import("../../utils/axiosInstance.util.js")).default;

describe("antiqueBook.services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches auction page data", async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, data: [] } });

    const result = await getAuctionPage();

    expect(axiosInstance.get).toHaveBeenCalledWith("buyer/auction-page");
    expect(result).toEqual({ success: true, data: [] });
  });

  it("fetches auction item detail", async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, data: { id: "a1" } } });

    const result = await getAuctionItemDetail("a1");

    expect(axiosInstance.get).toHaveBeenCalledWith("buyer/auction-item-detail/a1");
    expect(result).toEqual({ success: true, data: { id: "a1" } });
  });

  it("fetches ongoing auction detail", async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, data: { id: "a2" } } });

    const result = await getAuctionOngoing("a2");

    expect(axiosInstance.get).toHaveBeenCalledWith("buyer/auction-ongoing/a2");
    expect(result).toEqual({ success: true, data: { id: "a2" } });
  });
});
