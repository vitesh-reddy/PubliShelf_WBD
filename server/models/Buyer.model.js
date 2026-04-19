import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true }
}, { _id: true });

const AuthOtpSchema = new mongoose.Schema({
  codeHash: { type: String, default: null },
  purpose: { type: String, enum: ["password-reset"], default: null },
  expiresAt: { type: Date, default: null },
  verifiedAt: { type: Date, default: null },
  attempts: { type: Number, default: 0 },
  requestedAt: { type: Date, default: null }
}, { _id: false });

const buyerSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  cart: [
    {
      book: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
      quantity: { type: Number, default: 1 },
    },
  ],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
  orders: [
    {
      book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true,
      },
      quantity: { type: Number, default: 1 },
      delivered: { type: Boolean, default: false },
      orderDate: { type: Date, default: Date.now },
    },
  ],
  addresses: [AddressSchema],
  authOtp: { type: AuthOtpSchema, default: () => ({}) }
});

const Buyer = mongoose.model("Buyer", buyerSchema);
export default Buyer;
