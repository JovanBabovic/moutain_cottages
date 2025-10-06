import express, { Request, Response } from "express";
import Cottage from "../models/cottage.model";
import Reservation from "../models/reservation.model";
import Rating from "../models/rating.model";

const router = express.Router();

// Get all cottages with ratings (for tourists)
// @ts-ignore
router.get("/", async (req: Request, res: Response) => {
  try {
    const { sortBy = "name", sortOrder = "asc", name, location } = req.query;

    // Build query filter
    const filter: any = {};
    if (name) {
      filter.name = { $regex: name as string, $options: "i" };
    }
    if (location) {
      filter.location = { $regex: location as string, $options: "i" };
    }

    // Build sort options
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const cottages = await Cottage.find(filter)
      .sort(sortOptions)
      .populate("ownerId", "firstName lastName email phone");

    // Calculate average rating for each cottage
    const cottagesWithRatings = await Promise.all(
      cottages.map(async (cottage) => {
        const ratings = await Rating.find({ cottageId: cottage._id });
        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

        return {
          ...cottage.toObject(),
          averageRating: Math.round(avgRating * 10) / 10,
          ratingCount: ratings.length,
        };
      })
    );

    res.json(cottagesWithRatings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get cottage by ID with full details
// @ts-ignore
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const cottage = await Cottage.findById(req.params.id).populate(
      "ownerId",
      "firstName lastName email phone"
    );

    if (!cottage) {
      return res.status(404).json({ message: "Cottage not found" });
    }

    // Get all ratings and comments
    const ratings = await Rating.find({ cottageId: cottage._id })
      .populate("touristId", "firstName lastName")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    res.json({
      ...cottage.toObject(),
      averageRating: Math.round(avgRating * 10) / 10,
      ratingCount: ratings.length,
      ratings: ratings,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Check cottage availability
// @ts-ignore
router.post("/:id/check-availability", async (req: Request, res: Response) => {
  try {
    const { checkIn, checkOut, adults, children } = req.body;
    const cottage = await Cottage.findById(req.params.id);

    if (!cottage) {
      return res.status(404).json({ message: "Cottage not found" });
    }

    // Check if cottage is blocked
    if (cottage.blockedUntil && new Date(cottage.blockedUntil) > new Date()) {
      return res.status(400).json({
        available: false,
        message:
          "This cottage is temporarily blocked by the administrator. Please try again later.",
      });
    }

    // Check capacity
    const totalGuests = (adults || 0) + (children || 0);
    if (totalGuests > cottage.capacity) {
      return res.status(400).json({
        available: false,
        message: `Cottage capacity is ${cottage.capacity} guests. You selected ${totalGuests} guests.`,
      });
    }

    // Check for conflicting reservations
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Validate dates
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        available: false,
        message: "Check-out date must be after check-in date.",
      });
    }

    if (checkInDate < new Date()) {
      return res.status(400).json({
        available: false,
        message: "Check-in date cannot be in the past.",
      });
    }

    // Find overlapping reservations (only confirmed ones block dates)
    const conflictingReservations = await Reservation.find({
      cottageId: cottage._id,
      status: "confirmed",
      $or: [
        {
          checkIn: { $lte: checkOutDate },
          checkOut: { $gte: checkInDate },
        },
      ],
    });

    if (conflictingReservations.length > 0) {
      return res.status(400).json({
        available: false,
        message:
          "Cottage is not available for the selected dates. Please choose different dates.",
      });
    }

    // Calculate price based on seasonal pricing
    // Summer period: May (5), June (6), July (7), August (8)
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let totalPrice = 0;
    const currentDate = new Date(checkInDate);

    while (currentDate < checkOutDate) {
      const month = currentDate.getMonth() + 1; // getMonth() returns 0-11
      const isSummer = month >= 5 && month <= 8;
      totalPrice += isSummer ? cottage.summerPrice : cottage.winterPrice;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      available: true,
      message: "Cottage is available!",
      nights,
      totalPrice,
      summerPrice: cottage.summerPrice,
      winterPrice: cottage.winterPrice,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Create reservation
// @ts-ignore
router.post("/:id/reserve", async (req: Request, res: Response) => {
  try {
    const {
      touristId,
      checkIn,
      checkOut,
      adults,
      children,
      totalPrice,
      creditCard,
      note,
    } = req.body;

    const cottage = await Cottage.findById(req.params.id);

    if (!cottage) {
      return res.status(404).json({ message: "Cottage not found" });
    }

    // Check if cottage is blocked
    if (cottage.blockedUntil && new Date(cottage.blockedUntil) > new Date()) {
      return res.status(400).json({
        message:
          "This cottage is temporarily blocked by the administrator. Reservations are not allowed at this time.",
      });
    }

    // Double-check availability before creating reservation
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Only confirmed reservations block dates (pending ones are awaiting approval)
    const conflictingReservations = await Reservation.find({
      cottageId: cottage._id,
      status: "confirmed",
      $or: [
        {
          checkIn: { $lte: checkOutDate },
          checkOut: { $gte: checkInDate },
        },
      ],
    });

    if (conflictingReservations.length > 0) {
      return res.status(400).json({
        message:
          "Cottage is no longer available for the selected dates. Please try again.",
      });
    }

    // Create reservation with PENDING status (owner must approve)
    const reservation = new Reservation({
      cottageId: cottage._id,
      touristId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice,
      status: "pending",
      adults: adults || 0,
      children: children || 0,
      creditCard: creditCard || "",
      note: note || "",
    });

    await reservation.save();

    res.status(201).json({
      message: "Reservation request submitted! Waiting for owner approval.",
      reservation,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Add rating and comment to cottage
// @ts-ignore
router.post("/:id/rate", async (req: Request, res: Response) => {
  try {
    const { touristId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: "Comment is required" });
    }

    // Check if user already rated this cottage
    const existingRating = await Rating.findOne({
      cottageId: req.params.id,
      touristId,
    });

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.comment = comment;
      await existingRating.save();
      return res.json({ message: "Rating updated successfully" });
    }

    // Create new rating
    const newRating = new Rating({
      cottageId: req.params.id,
      touristId,
      rating,
      comment,
    });

    await newRating.save();
    res.status(201).json({ message: "Rating added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
