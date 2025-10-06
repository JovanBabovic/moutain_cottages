import express, { Request, Response } from "express";
import Reservation from "../models/reservation.model";
import Cottage from "../models/cottage.model";
import Rating from "../models/rating.model";
import mongoose from "mongoose";

const router = express.Router();

// Get all reservations for a tourist
// @ts-ignore
router.get("/tourist/:touristId", async (req: Request, res: Response) => {
  try {
    const { touristId } = req.params;

    const reservations = await Reservation.find({ touristId })
      .populate("cottageId", "name location pricePerNight")
      .sort({ checkIn: -1 });

    // Separate current and past reservations
    const now = new Date();
    const currentReservations = reservations.filter(
      (r) => new Date(r.checkOut) >= now && r.status !== "cancelled"
    );
    const pastReservations = reservations.filter(
      (r) => new Date(r.checkOut) < now && r.status !== "cancelled"
    );

    // Add hasRated flag to past reservations
    const pastReservationsWithRating = await Promise.all(
      pastReservations.map(async (reservation) => {
        const existingRating = await Rating.findOne({
          cottageId: reservation.cottageId,
          touristId: reservation.touristId,
        });
        return {
          ...reservation.toObject(),
          hasRated: !!existingRating,
          rating: existingRating ? existingRating.rating : null,
          comment: existingRating ? existingRating.comment : null,
        };
      })
    );

    res.json({
      currentReservations: currentReservations,
      pastReservations: pastReservationsWithRating,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Cancel reservation
// @ts-ignore
router.post("/:id/cancel", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Check if reservation is already cancelled
    if (reservation.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Reservation is already cancelled" });
    }

    // Check if check-in is more than 1 day away
    const checkInDate = new Date(reservation.checkIn);
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (checkInDate <= oneDayFromNow) {
      return res.status(400).json({
        message:
          "Cannot cancel reservation. Cancellation must be made at least 1 day before check-in.",
      });
    }

    // Cancel the reservation
    reservation.status = "cancelled";
    await reservation.save();

    res.json({
      message: "Reservation cancelled successfully",
      reservation,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get all reservations for an owner's cottages
// @ts-ignore
router.get("/owner/:ownerId", async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;

    // Convert ownerId string to ObjectId
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // First, find all cottages owned by this owner
    const cottages = await Cottage.find({ ownerId: ownerObjectId });
    const cottageIds = cottages.map((c) => c._id);

    // Then find all reservations for these cottages
    const reservations = await Reservation.find({
      cottageId: { $in: cottageIds },
    })
      .populate("cottageId", "name location")
      .populate("touristId", "firstName lastName email phone")
      .sort({ checkIn: -1 });

    // Separate pending and all reservations
    const pendingReservations = reservations.filter(
      (r) => r.status === "pending"
    );

    res.json({
      pending: pendingReservations,
      all: reservations,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Confirm reservation
// @ts-ignore
router.post("/:id/confirm", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.status !== "pending") {
      return res.status(400).json({
        message: `Reservation is already ${reservation.status}`,
      });
    }

    reservation.status = "confirmed";
    await reservation.save();

    res.json({
      message: "Reservation confirmed successfully",
      reservation,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Reject reservation
// @ts-ignore
router.post("/:id/reject", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json({
        message: "Rejection reason is required",
      });
    }

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.status !== "pending") {
      return res.status(400).json({
        message: `Reservation is already ${reservation.status}`,
      });
    }

    reservation.status = "cancelled";
    reservation.note = `Rejected by owner: ${rejectionReason}`;
    await reservation.save();

    res.json({
      message: "Reservation rejected successfully",
      reservation,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
