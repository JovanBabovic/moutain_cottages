import mongoose, { Schema, Document } from "mongoose";

export interface IRating extends Document {
  cottageId: mongoose.Types.ObjectId;
  touristId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const RatingSchema: Schema = new Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IRating>("Rating", RatingSchema);
