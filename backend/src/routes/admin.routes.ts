import express, { Request, Response } from "express";
import User from "../models/user.model";
import Cottage from "../models/cottage.model";
import Rating from "../models/rating.model";
import RegistrationRequest from "../models/registration-request.model";

const router = express.Router();

// Get all users (owners and tourists)
// @ts-ignore
router.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await User.find({ userType: { $in: ["owner", "tourist"] } })
      .sort({ createdAt: -1 })
      .select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get user by ID
// @ts-ignore
router.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Update user
// @ts-ignore
router.put("/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating userType, password through this route
    delete updateData.userType;
    delete updateData.password;
    delete updateData._id;

    // If email is being updated, check if it's already in use
    if (updateData.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: id },
      });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Deactivate user
// @ts-ignore
router.put("/users/:id/deactivate", async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deactivated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Activate user
// @ts-ignore
router.put("/users/:id/activate", async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User activated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Delete user
// @ts-ignore
router.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get all cottages with rating analysis (for admin cottage management)
// @ts-ignore
router.get("/cottages", async (req: Request, res: Response) => {
  try {
    const cottages = await Cottage.find()
      .populate("ownerId", "firstName lastName email username")
      .sort({ createdAt: -1 });

    // Calculate ratings for each cottage
    const cottagesWithRatings = await Promise.all(
      cottages.map(async (cottage) => {
        const ratings = await Rating.find({ cottageId: cottage._id })
          .sort({ createdAt: -1 })
          .limit(3);

        const allRatings = await Rating.find({ cottageId: cottage._id });

        // Check if last 3 ratings are all below 2
        const lastThreeLow =
          ratings.length >= 3 && ratings.every((r) => r.rating < 2);

        // Calculate average rating
        const avgRating =
          allRatings.length > 0
            ? allRatings.reduce((sum, r) => sum + r.rating, 0) /
              allRatings.length
            : 0;

        // Check if cottage is currently blocked
        const isBlocked =
          cottage.blockedUntil && new Date(cottage.blockedUntil) > new Date();

        return {
          ...cottage.toObject(),
          lastThreeRatings: ratings.map((r) => r.rating),
          needsAttention: lastThreeLow,
          averageRating: Math.round(avgRating * 10) / 10,
          totalRatings: allRatings.length,
          isBlocked,
          blockedUntil: cottage.blockedUntil,
        };
      })
    );

    res.json(cottagesWithRatings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Temporarily block cottage (48 hours)
// @ts-ignore
router.post("/cottages/:id/block", async (req: Request, res: Response) => {
  try {
    const cottage = await Cottage.findById(req.params.id);

    if (!cottage) {
      return res.status(404).json({ message: "Cottage not found" });
    }

    // Set block to expire in 48 hours
    const blockedUntil = new Date();
    blockedUntil.setHours(blockedUntil.getHours() + 48);

    cottage.blockedUntil = blockedUntil;
    await cottage.save();

    res.json({
      message: "Cottage blocked for 48 hours",
      blockedUntil,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Unblock cottage manually
// @ts-ignore
router.post("/cottages/:id/unblock", async (req: Request, res: Response) => {
  try {
    const cottage = await Cottage.findById(req.params.id);

    if (!cottage) {
      return res.status(404).json({ message: "Cottage not found" });
    }

    cottage.blockedUntil = undefined;
    await cottage.save();

    res.json({ message: "Cottage unblocked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
