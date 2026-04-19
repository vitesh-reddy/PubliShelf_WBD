import { jest } from "@jest/globals";

const getAllBooksMock = jest.fn();
const getBookByIdMock = jest.fn();
const searchBooksMock = jest.fn();
const filterBooksMock = jest.fn();
const getBuyerByIdMock = jest.fn();
const createBuyerMock = jest.fn();
const updateBuyerDetailsMock = jest.fn();
const getTopSoldBooksMock = jest.fn();
const getTrendingBooksMock = jest.fn();
const placeOrderMock = jest.fn();
const prepareCheckoutDataMock = jest.fn();
const getOngoingAuctionsMock = jest.fn();
const getFutureAuctionsMock = jest.fn();
const getEndedAuctionsMock = jest.fn();
const getAuctionItemByIdMock = jest.fn();
const addBidMock = jest.fn();
const createStripeCheckoutSessionMock = jest.fn();
const bcryptMock = { hash: jest.fn() };

jest.unstable_mockModule("../../services/book.services.js", () => ({
  getAllBooks: getAllBooksMock,
  getBookById: getBookByIdMock,
  searchBooks: searchBooksMock,
  filterBooks: filterBooksMock
}));

jest.unstable_mockModule("../../services/buyer.services.js", () => ({
  getBuyerById: getBuyerByIdMock,
  createBuyer: createBuyerMock,
  updateBuyerDetails: updateBuyerDetailsMock,
  getTopSoldBooks: getTopSoldBooksMock,
  getTrendingBooks: getTrendingBooksMock,
  placeOrder: placeOrderMock,
  prepareCheckoutData: prepareCheckoutDataMock
}));

jest.unstable_mockModule("../../services/stripe.services.js", () => ({
  createStripeCheckoutSession: createStripeCheckoutSessionMock
}));

jest.unstable_mockModule("../../services/antiqueBook.services.js", () => ({
  getOngoingAuctions: getOngoingAuctionsMock,
  getFutureAuctions: getFutureAuctionsMock,
  getEndedAuctions: getEndedAuctionsMock,
  getAuctionItemById: getAuctionItemByIdMock,
  addBid: addBidMock
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: bcryptMock
}));

const {
  getBuyerSearchPage,
  searchBooksHandler,
  filterBooksHandler,
  createBuyerSignup,
  placeOrderController,
  createCheckoutSession
} = await import("../../controllers/buyer.controller.js");

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("buyer.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns search page data", async () => {
    getAllBooksMock.mockResolvedValue([{ _id: "b1" }]);

    const req = {};
    const res = createRes();

    await getBuyerSearchPage(req, res);

    expect(getAllBooksMock).toHaveBeenCalledWith({ isDeleted: false });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Search page data fetched successfully",
      data: { books: [{ _id: "b1" }] }
    });
  });

  it("returns search results", async () => {
    searchBooksMock.mockResolvedValue([{ _id: "b2" }]);

    const req = { query: { q: "history" } };
    const res = createRes();

    await searchBooksHandler(req, res);

    expect(searchBooksMock).toHaveBeenCalledWith("history");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Search results fetched successfully",
      data: { books: [{ _id: "b2" }] }
    });
  });

  it("returns filtered books", async () => {
    filterBooksMock.mockResolvedValue([{ _id: "b3" }]);

    const req = {
      query: {
        category: "Fantasy",
        sort: "priceLowToHigh",
        condition: "New",
        priceRange: "10-50"
      }
    };
    const res = createRes();

    await filterBooksHandler(req, res);

    expect(filterBooksMock).toHaveBeenCalledWith({
      category: "Fantasy",
      sort: "priceLowToHigh",
      condition: "New",
      priceRange: "10-50"
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Filtered books fetched successfully",
      data: { books: [{ _id: "b3" }] }
    });
  });

  it("creates buyer signup with hashed password", async () => {
    bcryptMock.hash.mockResolvedValue("hashed");
    createBuyerMock.mockResolvedValue({ _id: "buyer-1" });

    const req = {
      body: { firstname: "Alex", lastname: "Smith", email: "a@test.com", password: "pass" }
    };
    const res = createRes();

    await createBuyerSignup(req, res);

    expect(bcryptMock.hash).toHaveBeenCalledWith("pass", 10);
    expect(createBuyerMock).toHaveBeenCalledWith({
      firstname: "Alex",
      lastname: "Smith",
      email: "a@test.com",
      password: "hashed"
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Buyer account created successfully",
      data: null
    });
  });

  it("returns 400 when email already exists", async () => {
    bcryptMock.hash.mockResolvedValue("hashed");
    createBuyerMock.mockRejectedValue({ code: 11000 });

    const req = {
      body: { firstname: "Alex", lastname: "Smith", email: "a@test.com", password: "pass" }
    };
    const res = createRes();

    await createBuyerSignup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Email already exists",
      data: null
    });
  });

  it("blocks COD endpoint when payment method is ONLINE", async () => {
    const req = {
      body: { addressId: "addr-1", paymentMethod: "ONLINE" },
      user: { id: "buyer-1" }
    };
    const res = createRes();

    await placeOrderController(req, res);

    expect(placeOrderMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "For online payment, use the /payments/stripe/create-checkout-session endpoint",
      data: null
    });
  });

  it("creates COD order and returns order id", async () => {
    placeOrderMock.mockResolvedValue({ _id: "order-1" });
    const req = {
      body: { addressId: "addr-1", paymentMethod: "COD" },
      user: { id: "buyer-1" }
    };
    const res = createRes();

    await placeOrderController(req, res);

    expect(placeOrderMock).toHaveBeenCalledWith("buyer-1", {
      addressId: "addr-1",
      paymentMethod: "COD"
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Order placed successfully",
      data: { orderId: "order-1" }
    });
  });

  it("returns 400 when COD order creation fails", async () => {
    placeOrderMock.mockRejectedValue(new Error("Cart is empty"));
    const req = {
      body: { addressId: "addr-1", paymentMethod: "COD" },
      user: { id: "buyer-1" }
    };
    const res = createRes();

    await placeOrderController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Cart is empty",
      data: null
    });
  });

  it("returns 400 when checkout session address id is missing", async () => {
    const req = { body: {}, user: { id: "buyer-1" } };
    const res = createRes();

    await createCheckoutSession(req, res);

    expect(prepareCheckoutDataMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "addressId is required" });
  });

  it("creates checkout session, clears cart and returns redirect url", async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    prepareCheckoutDataMock.mockResolvedValue({
      buyer: { _id: "buyer-1", email: "buyer@test.com" },
      items: [{ title: "Book A", unitPrice: 100, quantity: 1 }],
      deliveryAddress: { name: "John", address: "A", phone: "9" },
      itemsTotal: 100,
      shipping: 0,
      tax: 2,
      discount: 0,
      grandTotal: 102
    });
    createStripeCheckoutSessionMock.mockResolvedValue({
      sessionUrl: "https://checkout.stripe/session",
      sessionId: "cs_test_1",
      orderId: "order-1"
    });
    getBuyerByIdMock.mockResolvedValue({
      cart: [{ book: "b1", quantity: 1 }],
      save: saveMock
    });

    const req = {
      body: { addressId: "addr-1", idempotencyKey: "idem-1" },
      user: { id: "buyer-1" }
    };
    const res = createRes();

    await createCheckoutSession(req, res);

    expect(prepareCheckoutDataMock).toHaveBeenCalledWith("buyer-1", "addr-1");
    expect(createStripeCheckoutSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "idem-1",
        successUrl: expect.stringContaining("/buyer/payment-success?session_id={CHECKOUT_SESSION_ID}"),
        cancelUrl: expect.stringContaining("/buyer/checkout?paymentCancelled=true")
      })
    );
    expect(getBuyerByIdMock).toHaveBeenCalledWith("buyer-1");
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      url: "https://checkout.stripe/session",
      sessionId: "cs_test_1",
      orderId: "order-1"
    });
  });

  it("returns 500 when checkout session creation fails", async () => {
    prepareCheckoutDataMock.mockRejectedValue(new Error("Cart is empty"));
    const req = {
      body: { addressId: "addr-1" },
      user: { id: "buyer-1" }
    };
    const res = createRes();

    await createCheckoutSession(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Cart is empty"
    });
  });
});
