import mongoose, { Schema, Document } from "mongoose";

export interface IRegistrationRequest extends Document {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  address: string;
  phone: string;
  email: string;
  profilePicture?: string;
  creditCard: string;
  userType: "tourist" | "owner";
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  reviewedAt?: Date;
}

const RegistrationRequestSchema: Schema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, required: true, enum: ["M", "F"] },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  profilePicture: { type: String },
  creditCard: { type: String, required: true },
  userType: { type: String, required: true, enum: ["tourist", "owner"] },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "approved", "rejected"],
  },
  createdAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
});

export default mongoose.model<IRegistrationRequest>(
  "RegistrationRequest",
  RegistrationRequestSchema
);
