import { jest } from "@jest/globals";

process.env.STRIPE_SECRET_KEY = "sk_test_123";

const sessionsCreateMock = jest.fn();
const sessionsRetrieveMock = jest.fn();
const constructEventMock = jest.fn();
const refundsCreateMock = jest.fn();

const stripeInstance = {
  checkout: {
    sessions: {
      create: sessionsCreateMock,
      retrieve: sessionsRetrieveMock
    }
  },
  webhooks: {
    constructEvent: constructEventMock
  },
  refunds: {
    create: refundsCreateMock
  }
};

const stripeCtorMock = jest.fn(() => stripeInstance);

const OrderMock = jest.fn(function Order(payload) {
  Object.assign(this, payload);
  this._id = payload?._id || "order-new";
  this.statusHistory = payload?.statusHistory || [];
  this.save = jest.fn().mockResolvedValue(this);
});
OrderMock.findOne = jest.fn();
OrderMock.findById = jest.fn();

const BookMock = {
  updateOne: jest.fn()
};

const startSessionMock = jest.fn();

jest.unstable_mockModule("stripe", () => ({
  default: stripeCtorMock
}));

jest.unstable_mockModule("../../models/Order.model.js", () => ({
  default: OrderMock
}));

jest.unstable_mockModule("../../models/Book.model.js", () => ({
  default: BookMock
}));

jest.unstable_mockModule("mongoose", () => ({
  default: {
    startSession: startSessionMock
  }
}));

jest.unstable_mockModule("crypto", () => ({
  default: {
    randomUUID: jest.fn(() => "uuid-123")
  }
}));

const {
  createStripeCheckoutSession,
  handleStripeWebhook,
  getStripeSessionAndOrder,
  refundOrder
} = await import("../../services/stripe.services.js");

const makeSession = () => {
  const withTransaction = jest.fn(async (cb) => cb());
  const endSession = jest.fn();
  return { withTransaction, endSession };
};

describe("stripe.services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    startSessionMock.mockReturnValue(makeSession());
    BookMock.updateOne.mockResolvedValue({ modifiedCount: 1 });
  });

  it("reuses existing pending order for same idempotency key", async () => {
    OrderMock.findOne.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue({
        _id: "order-1",
        stripeCheckoutSessionId: "cs_existing",
        paymentStatus: "pending"
      })
    });
    sessionsRetrieveMock.mockResolvedValue({ id: "cs_existing", url: "https://stripe/reused" });

    const result = await createStripeCheckoutSession({
      buyer: { _id: "buyer-1", email: "buyer@test.com" },
      items: [{ title: "Book A", unitPrice: 500, quantity: 1 }],
      deliveryAddress: { name: "A", address: "B", phone: "9" },
      itemsTotal: 500,
      shipping: 0,
      tax: 10,
      discount: 0,
      grandTotal: 510,
      successUrl: "https://client/success",
      cancelUrl: "https://client/cancel",
      idempotencyKey: "idem-1"
    });

    expect(OrderMock).not.toHaveBeenCalled();
    expect(sessionsRetrieveMock).toHaveBeenCalledWith("cs_existing");
    expect(result).toEqual({ sessionUrl: "https://stripe/reused", sessionId: "cs_existing", orderId: "order-1" });
  });

  it("creates pending order and stripe checkout session", async () => {
    OrderMock.findOne.mockResolvedValue(null);
    sessionsCreateMock.mockResolvedValue({ id: "cs_new", url: "https://stripe/new", payment_intent: "pi_1" });

    const result = await createStripeCheckoutSession({
      buyer: { _id: "buyer-1", email: "buyer@test.com" },
      items: [{ title: "Book A", unitPrice: 500, quantity: 2 }],
      deliveryAddress: { name: "A", address: "B", phone: "9" },
      itemsTotal: 1000,
      shipping: 0,
      tax: 20,
      discount: 0,
      grandTotal: 1020,
      successUrl: "https://client/success",
      cancelUrl: "https://client/cancel"
    });

    expect(OrderMock).toHaveBeenCalledWith(expect.objectContaining({
      paymentMethod: "ONLINE",
      paymentProvider: "stripe",
      paymentStatus: "pending",
      idempotencyKey: "uuid-123"
    }));
    expect(sessionsCreateMock).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      customer_email: "buyer@test.com",
      metadata: { orderId: "order-new" }
    }));
    expect(result).toEqual({ sessionUrl: "https://stripe/new", sessionId: "cs_new", orderId: "order-new" });
  });

  it("marks order as paid on checkout.session.completed webhook", async () => {
    const orderDoc = {
      paymentStatus: "pending",
      status: "created",
      statusHistory: [],
      save: jest.fn().mockResolvedValue(undefined)
    };
    constructEventMock.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { metadata: { orderId: "order-1" }, payment_intent: "pi_123" } }
    });
    OrderMock.findById.mockResolvedValue(orderDoc);

    await handleStripeWebhook({ body: Buffer.from("{}") }, "sig", "whsec");

    expect(orderDoc.paymentStatus).toBe("paid");
    expect(orderDoc.status).toBe("paid");
    expect(orderDoc.stripePaymentIntentId).toBe("pi_123");
    expect(orderDoc.save).toHaveBeenCalledTimes(1);
  });

  it("marks order as failed and restores stock on checkout.session.expired webhook", async () => {
    const orderDoc = {
      paymentStatus: "pending",
      status: "created",
      statusHistory: [],
      items: [{ book: "b1", quantity: 2 }],
      save: jest.fn().mockResolvedValue(undefined)
    };
    constructEventMock.mockReturnValue({
      type: "checkout.session.expired",
      data: { object: { metadata: { orderId: "order-2" } } }
    });
    OrderMock.findById.mockResolvedValue(orderDoc);

    await handleStripeWebhook({ body: Buffer.from("{}") }, "sig", "whsec");

    expect(BookMock.updateOne).toHaveBeenCalledWith(
      { _id: "b1" },
      { $inc: { quantity: 2 } },
      { session: expect.any(Object) }
    );
    expect(orderDoc.paymentStatus).toBe("failed");
    expect(orderDoc.status).toBe("cancelled");
    expect(orderDoc.save).toHaveBeenCalledTimes(1);
  });

  it("throws when webhook signature verification fails", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("invalid signature");
    });

    await expect(
      handleStripeWebhook({ body: Buffer.from("{}") }, "bad_sig", "whsec")
    ).rejects.toThrow("Webhook signature verification failed: invalid signature");
  });

  it("returns stripe session and order from getStripeSessionAndOrder", async () => {
    sessionsRetrieveMock.mockResolvedValue({ id: "cs_1", metadata: { orderId: "order-3" } });
    OrderMock.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: "order-3", paymentStatus: "paid" }) });

    const result = await getStripeSessionAndOrder("cs_1");

    expect(result).toEqual({
      session: { id: "cs_1", metadata: { orderId: "order-3" } },
      order: { _id: "order-3", paymentStatus: "paid" }
    });
  });

  it("throws when refunding non-paid order", async () => {
    OrderMock.findById.mockResolvedValue({ paymentStatus: "pending" });

    await expect(refundOrder({ orderId: "order-4", adminId: "admin-1" })).rejects.toThrow(
      "Only paid orders can be refunded"
    );
  });

  it("refunds paid order, restores stock and updates status", async () => {
    const orderDoc = {
      paymentStatus: "paid",
      paymentMethod: "ONLINE",
      stripePaymentIntentId: "pi_1",
      statusHistory: [],
      items: [{ book: "b1", quantity: 1 }],
      save: jest.fn().mockResolvedValue(undefined)
    };
    OrderMock.findById.mockResolvedValue(orderDoc);
    refundsCreateMock.mockResolvedValue({ id: "re_1", status: "succeeded" });

    const result = await refundOrder({ orderId: "order-5", adminId: "admin-1" });

    expect(refundsCreateMock).toHaveBeenCalledWith({ payment_intent: "pi_1" });
    expect(BookMock.updateOne).toHaveBeenCalledWith(
      { _id: "b1" },
      { $inc: { quantity: 1 } },
      { session: expect.any(Object) }
    );
    expect(orderDoc.paymentStatus).toBe("refunded");
    expect(orderDoc.status).toBe("cancelled");
    expect(result).toEqual({ id: "re_1", status: "succeeded" });
  });
});
