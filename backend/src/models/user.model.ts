import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
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
  userType: "tourist" | "owner" | "admin";
  isActive: boolean;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, required: true, enum: ["M", "F"] },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  profilePicture: { type: String },
  creditCard: { type: String, required: true },
  userType: {
    type: String,
    required: true,
    enum: ["tourist", "owner", "admin"],
  },
  isActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>("User", UserSchema);
