import mongoose from "mongoose";

const managerSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // Moderation tracking (admin approval flow)
    moderation: {
      status: { 
        type: String, 
        enum: ["pending", "approved", "rejected"], 
        default: "pending",
        index: true 
      },
      by: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
      at: { type: Date, default: null },
      reason: { type: String, default: null }
    },
    
    // Account status (ban/active)
    account: {
      status: { 
        type: String, 
        enum: ["active", "banned"], 
        default: "active",
        index: true 
      },
      by: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
      at: { type: Date, default: null },
      reason: { type: String, default: null }
    },
    
    // Activity tracking
    lastLogin: { type: Date, default: null }
  },
  { timestamps: true }
);

const Manager = mongoose.model("Manager", managerSchema);

export default Manager;
