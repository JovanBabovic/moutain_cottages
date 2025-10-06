import express, { Request, Response } from "express";
import User from "../models/user.model";
import Cottage from "../models/cottage.model";
import Reservation from "../models/reservation.model";

const router = express.Router();

// Get statistics for home page
router.get("/statistics", async (req: Request, res: Response) => {
  try {
    // Total number of cottages
    const totalCottages = await Cottage.countDocuments();

    // Total number of registered owners
    const totalOwners = await User.countDocuments({
      userType: "owner",
      isActive: true,
    });

    // Total number of registered tourists
    const totalTourists = await User.countDocuments({
      userType: "tourist",
      isActive: true,
    });

    // Calculate time thresholds
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Number of cottages reserved in different time periods
    const reservedLast24Hours = await Reservation.countDocuments({
      createdAt: { $gte: last24Hours },
      status: { $ne: "cancelled" },
    });

    const reservedLast7Days = await Reservation.countDocuments({
      createdAt: { $gte: last7Days },
      status: { $ne: "cancelled" },
    });

    const reservedLast30Days = await Reservation.countDocuments({
      createdAt: { $gte: last30Days },
      status: { $ne: "cancelled" },
    });

    res.json({
      totalCottages,
      totalOwners,
      totalTourists,
      reservations: {
        last24Hours: reservedLast24Hours,
        last7Days: reservedLast7Days,
        last30Days: reservedLast30Days,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get all cottages with optional sorting and filtering
router.get("/cottages", async (req: Request, res: Response) => {
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
      .populate("ownerId", "firstName lastName email");

    res.json(cottages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get cottage by ID
// @ts-ignore
router.get("/cottages/:id", async (req: Request, res: Response) => {
  try {
    const cottage = await Cottage.findById(req.params.id).populate(
      "ownerId",
      "firstName lastName email phone"
    );

    if (!cottage) {
      return res.status(404).json({ message: "Cottage not found" });
    }

    res.json(cottage);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
