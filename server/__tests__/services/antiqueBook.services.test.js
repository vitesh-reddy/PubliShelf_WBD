import { jest } from "@jest/globals";

const findMock = jest.fn();
const findByIdMock = jest.fn();
const findOneAndUpdateMock = jest.fn();
const updateOneMock = jest.fn();
const loggerWarnMock = jest.fn();
const loggerErrorMock = jest.fn();
const loggerInfoMock = jest.fn();

jest.unstable_mockModule("../../models/AntiqueBook.model.js", () => ({
  default: {
    find: findMock,
    findById: findByIdMock,
    findOneAndUpdate: findOneAndUpdateMock,
    updateOne: updateOneMock
  }
}));

jest.unstable_mockModule("../../config/logger.js", () => ({
  default: {
    warn: loggerWarnMock,
    error: loggerErrorMock,
    info: loggerInfoMock
  }
}));

const {
  addBid,
  getOngoingAuctions,
  getFutureAuctions,
  getEndedAuctions,
  getAuctionItemById
} = await import("../../services/antiqueBook.services.js");

const createFindChain = (result) => {
  const chain = {
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result)
  };
  return chain;
};

describe("antiqueBook.services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns ongoing auctions with query chain", async () => {
    const chain = createFindChain([{ _id: "a1" }]);
    findMock.mockReturnValue(chain);

    const result = await getOngoingAuctions();

    expect(findMock).toHaveBeenCalledWith({
      status: "approved",
      auctionStart: { $lte: expect.any(Date) },
      auctionEnd: { $gte: expect.any(Date) }
    });
    expect(chain.sort).toHaveBeenCalledWith({ auctionEnd: 1 });
    expect(result).toEqual([{ _id: "a1" }]);
  });

  it("returns future auctions", async () => {
    const chain = createFindChain([{ _id: "future-1" }]);
    findMock.mockReturnValue(chain);

    const result = await getFutureAuctions();

    expect(findMock).toHaveBeenCalledWith({
      status: "approved",
      auctionStart: { $gt: expect.any(Date) }
    });
    expect(result[0]._id).toBe("future-1");
  });

  it("maps ended auctions with winner and final price", async () => {
    const docs = [
      {
        _id: "book-1",
        currentPrice: 700,
        basePrice: 300,
        biddingHistory: [
          {
            bidder: { _id: "b1", firstname: "A", lastname: "One" },
            bidAmount: 500,
            bidTime: "2024-01-01T10:00:00.000Z"
          },
          {
            bidder: { _id: "b2", firstname: "B", lastname: "Two" },
            bidAmount: 700,
            bidTime: "2024-01-01T11:00:00.000Z"
          }
        ]
      }
    ];
    const chain = createFindChain(docs);
    findMock.mockReturnValue(chain);

    const result = await getEndedAuctions();

    expect(result[0].winnerBuyer).toEqual({ _id: "b2", name: "B Two" });
    expect(result[0].finalPrice).toBe(700);
  });

  it("throws when auction item is missing", async () => {
    findByIdMock.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null)
    });

    await expect(getAuctionItemById("missing-id")).rejects.toThrow("Antique book not found");
  });

  it("throws when auction item is not approved", async () => {
    findByIdMock.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: "x", status: "pending" })
    });

    await expect(getAuctionItemById("book-2")).rejects.toThrow("Auction not available");
  });

  it("accepts valid bid and returns updated book", async () => {
    const updatedBook = { _id: "book-1", currentPrice: 400 };
    findOneAndUpdateMock.mockReturnValue({
      populate: jest.fn().mockResolvedValue(updatedBook)
    });

    const result = await addBid("book-1", "buyer-1", 400);

    expect(findOneAndUpdateMock).toHaveBeenCalled();
    expect(result.currentPrice).toBe(400);
    expect(loggerInfoMock).toHaveBeenCalled();
  });

  it("rejects bid when atomic update returns null", async () => {
    findOneAndUpdateMock.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null)
    });

    await expect(addBid("book-1", "buyer-1", 400)).rejects.toThrow("Bid no longer valid. Price may have changed.");
    expect(loggerWarnMock).toHaveBeenCalled();
  });

  it("rolls back bid when race is lost", async () => {
    findOneAndUpdateMock.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: "book-1", currentPrice: 410 })
    });
    updateOneMock.mockResolvedValue({ modifiedCount: 1 });

    await expect(addBid("book-1", "buyer-1", 400)).rejects.toThrow("Bid no longer valid. A higher bid was placed.");
    expect(updateOneMock).toHaveBeenCalled();
  });
});
