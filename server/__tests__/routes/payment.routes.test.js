import { jest } from "@jest/globals";

const protectMock = jest.fn((req, _res, next) => {
  req.user = { id: "buyer-1", role: "buyer" };
  next();
});
const getStripeSessionAndOrderMock = jest.fn();

jest.unstable_mockModule("../../middleware/auth.middleware.js", () => ({
  protect: protectMock
}));

jest.unstable_mockModule("../../services/stripe.services.js", () => ({
  getStripeSessionAndOrder: getStripeSessionAndOrderMock
}));

const { default: paymentRouter } = await import("../../routes/payment.routes.js");

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const executePaymentSessionRoute = async (req, res) => {
  const layer = paymentRouter.stack.find((l) => l.route?.path === "/stripe/session/:id");
  const [protectLayer, handlerLayer] = layer.route.stack;

  await new Promise((resolve, reject) => {
    try {
      protectLayer.handle(req, res, (err) => {
        if (err) return reject(err);
        Promise.resolve(handlerLayer.handle(req, res)).then(resolve).catch(reject);
      });
    } catch (err) {
      reject(err);
    }
  });
};

describe("payment.routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns payment and order details when session is valid", async () => {
    getStripeSessionAndOrderMock.mockResolvedValue({
      session: { id: "cs_1", payment_status: "paid" },
      order: {
        _id: "order-1",
        paymentStatus: "paid",
        items: [{ title: "Book A", quantity: 1 }],
        deliveryAddress: { name: "Alex" },
        grandTotal: 1200,
        status: "paid"
      }
    });

    const req = { params: { id: "cs_1" } };
    const res = createRes();

    await executePaymentSessionRoute(req, res);

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(getStripeSessionAndOrderMock).toHaveBeenCalledWith("cs_1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        paymentStatus: "paid",
        order: {
          id: "order-1",
          items: [{ title: "Book A", quantity: 1 }],
          deliveryAddress: { name: "Alex" },
          grandTotal: 1200,
          status: "paid"
        },
        session: {
          id: "cs_1",
          payment_status: "paid"
        }
      }
    });
  });

  it("returns 404 when order cannot be found for stripe session", async () => {
    getStripeSessionAndOrderMock.mockResolvedValue({
      session: { id: "cs_2", payment_status: "unpaid" },
      order: null
    });

    const req = { params: { id: "cs_2" } };
    const res = createRes();

    await executePaymentSessionRoute(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Order not found for this session"
    });
  });

  it("returns 500 when stripe service throws", async () => {
    getStripeSessionAndOrderMock.mockRejectedValue(new Error("Stripe service down"));

    const req = { params: { id: "cs_3" } };
    const res = createRes();

    await executePaymentSessionRoute(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Stripe service down"
    });
  });

  it("returns fallback 500 message when service throws without message", async () => {
    getStripeSessionAndOrderMock.mockRejectedValue({});

    const req = { params: { id: "cs_4" } };
    const res = createRes();

    await executePaymentSessionRoute(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Failed to fetch Stripe session"
    });
  });
});
