import mongoose, { Schema, Document } from "mongoose";

export interface ICottage extends Document {
  name: string;
  location: string;
  ownerId: mongoose.Types.ObjectId;
  description?: string;
  pricePerNight: number; // Deprecated - kept for backwards compatibility
  summerPrice: number; // May, June, July, August
  winterPrice: number; // All other months
  capacity: number;
  amenities?: string[];
  images?: string[];
  phone?: string;
  latitude?: number;
  longitude?: number;
  blockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CottageSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: { type: String },
    pricePerNight: { type: Number }, // Deprecated - kept for backwards compatibility
    summerPrice: { type: Number, required: true },
    winterPrice: { type: Number, required: true },
    capacity: { type: Number, required: true },
    amenities: [{ type: String }],
    images: [{ type: String }],
    phone: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    blockedUntil: { type: Date },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICottage>("Cottage", CottageSchema);
