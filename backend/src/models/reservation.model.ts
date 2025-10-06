import mongoose, { Schema, Document } from "mongoose";

export interface IReservation extends Document {
  cottageId: mongoose.Types.ObjectId;
  touristId: mongoose.Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled";
  adults?: number;
  children?: number;
  creditCard?: string;
  note?: string;
  createdAt: Date;
}

const ReservationSchema: Schema = new Schema({
  cottageId: {
    type: Schema.Types.ObjectId,
    ref: "Cottage",
    required: true,
  },
  touristId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending",
  },
  adults: { type: Number, default: 0 },
  children: { type: Number, default: 0 },
  creditCard: { type: String },
  note: { type: String, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IReservation>("Reservation", ReservationSchema);
