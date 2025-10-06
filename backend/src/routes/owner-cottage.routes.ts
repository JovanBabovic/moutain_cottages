import express, { Request, Response } from "express";
import Cottage from "../models/cottage.model";
import Reservation from "../models/reservation.model";
import { cottageImageUpload, jsonUpload } from "../config/multer.config";
import { validateImage, deleteFile } from "../utils/image-validator";
import mongoose from "mongoose";
import path from "path";

const router = express.Router();

// Get all cottages for a specific owner
// @ts-ignore
router.get("/owner/:ownerId", async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;

    // Convert ownerId string to ObjectId
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    const cottages = await Cottage.find({ ownerId: ownerObjectId }).sort({
      createdAt: -1,
    });

    res.json(cottages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Create a new cottage with images
router.post(
  "/",
  cottageImageUpload.array("images", 10), // Allow up to 10 images
  // @ts-ignore
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        location,
        ownerId,
        description,
        summerPrice,
        winterPrice,
        capacity,
        amenities,
        phone,
        latitude,
        longitude,
      } = req.body;

      // Validate required fields
      if (
        !name ||
        !location ||
        !ownerId ||
        !summerPrice ||
        !winterPrice ||
        !capacity
      ) {
        // Delete uploaded files if validation fails
        if (req.files && Array.isArray(req.files)) {
          req.files.forEach((file: any) => deleteFile(file.path));
        }
        return res
          .status(400)
          .json({
            message:
              "Required fields are missing. Name, location, summer price, winter price, and capacity are required.",
          });
      }

      // Validate that prices are different
      if (Number(summerPrice) === Number(winterPrice)) {
        // Delete uploaded files if validation fails
        if (req.files && Array.isArray(req.files)) {
          req.files.forEach((file: any) => deleteFile(file.path));
        }
        return res
          .status(400)
          .json({ message: "Summer and winter prices must be different." });
      }

      // Process uploaded images
      let imagePaths: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const validation = await validateImage(file.path);
          if (!validation.isValid) {
            // Delete all uploaded files
            req.files.forEach((f: any) => deleteFile(f.path));
            return res.status(400).json({ message: validation.error });
          }
          imagePaths.push(`/uploads/cottages/${file.filename}`);
        }
      }

      // Parse amenities if it's a JSON string
      let amenitiesList: string[] = [];
      if (amenities) {
        try {
          amenitiesList =
            typeof amenities === "string" ? JSON.parse(amenities) : amenities;
        } catch (e) {
          amenitiesList = [amenities];
        }
      }

      // Create cottage
      const cottage = new Cottage({
        name,
        location,
        ownerId: new mongoose.Types.ObjectId(ownerId),
        description: description || "",
        summerPrice: Number(summerPrice),
        winterPrice: Number(winterPrice),
        pricePerNight: Number(summerPrice), // Keep for backwards compatibility, use summer as default
        capacity: Number(capacity),
        amenities: amenitiesList,
        images: imagePaths,
        phone: phone || "",
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
      });

      await cottage.save();

      res.status(201).json({
        message: "Cottage created successfully",
        cottage,
      });
    } catch (error) {
      // Delete uploaded files on error
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file: any) => deleteFile(file.path));
      }
      res.status(500).json({ message: "Server error", error });
    }
  }
);

// Import cottage data from JSON file
router.post(
  "/import-json/:ownerId",
  jsonUpload.single("jsonFile"),
  // @ts-ignore
  async (req: Request, res: Response) => {
    try {
      const { ownerId } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: "No JSON file uploaded" });
      }

      // Parse JSON data
      const jsonData = JSON.parse(req.file.buffer.toString());

      // Validate required fields
      if (
        !jsonData.name ||
        !jsonData.location ||
        !jsonData.summerPrice ||
        !jsonData.winterPrice ||
        !jsonData.capacity
      ) {
        return res
          .status(400)
          .json({
            message:
              "JSON missing required fields (name, location, summerPrice, winterPrice, capacity)",
          });
      }

      // Validate that prices are different
      if (Number(jsonData.summerPrice) === Number(jsonData.winterPrice)) {
        return res
          .status(400)
          .json({ message: "Summer and winter prices must be different." });
      }

      // Create cottage from JSON data
      const cottage = new Cottage({
        name: jsonData.name,
        location: jsonData.location,
        ownerId: new mongoose.Types.ObjectId(ownerId),
        description: jsonData.description || "",
        summerPrice: Number(jsonData.summerPrice),
        winterPrice: Number(jsonData.winterPrice),
        pricePerNight: Number(jsonData.summerPrice), // Keep for backwards compatibility
        capacity: Number(jsonData.capacity),
        amenities: jsonData.amenities || [],
        images: [], // Images must be uploaded separately
        phone: jsonData.phone || "",
        latitude: jsonData.latitude ? Number(jsonData.latitude) : undefined,
        longitude: jsonData.longitude ? Number(jsonData.longitude) : undefined,
      });

      await cottage.save();

      res.status(201).json({
        message: "Cottage imported successfully from JSON",
        cottage,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error or invalid JSON", error });
    }
  }
);

// Update a cottage
router.put(
  "/:id",
  cottageImageUpload.array("images", 10),
  // @ts-ignore
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        name,
        location,
        description,
        summerPrice,
        winterPrice,
        capacity,
        amenities,
        phone,
        latitude,
        longitude,
        existingImages,
      } = req.body;

      const cottage = await Cottage.findById(id);

      if (!cottage) {
        if (req.files && Array.isArray(req.files)) {
          req.files.forEach((file: any) => deleteFile(file.path));
        }
        return res.status(404).json({ message: "Cottage not found" });
      }

      // Validate that prices are different if both are provided
      if (
        summerPrice &&
        winterPrice &&
        Number(summerPrice) === Number(winterPrice)
      ) {
        if (req.files && Array.isArray(req.files)) {
          req.files.forEach((file: any) => deleteFile(file.path));
        }
        return res
          .status(400)
          .json({ message: "Summer and winter prices must be different." });
      }

      // Update fields
      if (name) cottage.name = name;
      if (location) cottage.location = location;
      if (description !== undefined) cottage.description = description;
      if (summerPrice) {
        cottage.summerPrice = Number(summerPrice);
        cottage.pricePerNight = Number(summerPrice); // Update backwards compatibility field
      }
      if (winterPrice) cottage.winterPrice = Number(winterPrice);
      if (capacity) cottage.capacity = Number(capacity);
      if (phone !== undefined) cottage.phone = phone;
      if (latitude !== undefined) cottage.latitude = Number(latitude);
      if (longitude !== undefined) cottage.longitude = Number(longitude);

      // Update amenities
      if (amenities) {
        try {
          cottage.amenities =
            typeof amenities === "string" ? JSON.parse(amenities) : amenities;
        } catch (e) {
          cottage.amenities = [amenities];
        }
      }

      // Handle images
      let newImagePaths: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const validation = await validateImage(file.path);
          if (!validation.isValid) {
            req.files.forEach((f: any) => deleteFile(f.path));
            return res.status(400).json({ message: validation.error });
          }
          newImagePaths.push(`/uploads/cottages/${file.filename}`);
        }
      }

      // Parse existing images to keep
      let keptImages: string[] = [];
      if (existingImages) {
        try {
          keptImages =
            typeof existingImages === "string"
              ? JSON.parse(existingImages)
              : existingImages;
        } catch (e) {
          keptImages = cottage.images || [];
        }
      } else {
        keptImages = cottage.images || [];
      }

      // Delete removed images from filesystem
      const currentImages = cottage.images || [];
      const removedImages = currentImages.filter(
        (img) => !keptImages.includes(img)
      );
      removedImages.forEach((imgPath) => {
        const fullPath = path.join(__dirname, "../../", imgPath);
        deleteFile(fullPath);
      });

      // Combine kept and new images
      cottage.images = [...keptImages, ...newImagePaths];

      await cottage.save();

      res.json({
        message: "Cottage updated successfully",
        cottage,
      });
    } catch (error) {
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file: any) => deleteFile(file.path));
      }
      res.status(500).json({ message: "Server error", error });
    }
  }
);

// Delete a cottage
// @ts-ignore
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cottage = await Cottage.findById(id);

    if (!cottage) {
      return res.status(404).json({ message: "Cottage not found" });
    }

    // Check if there are any active reservations
    const activeReservations = await Reservation.find({
      cottageId: cottage._id,
      status: { $in: ["pending", "confirmed"] },
      checkOut: { $gte: new Date() },
    });

    if (activeReservations.length > 0) {
      return res.status(400).json({
        message: "Cannot delete cottage with active or upcoming reservations",
      });
    }

    // Delete cottage images from filesystem
    if (cottage.images && cottage.images.length > 0) {
      cottage.images.forEach((imgPath) => {
        const fullPath = path.join(__dirname, "../../", imgPath);
        deleteFile(fullPath);
      });
    }

    await Cottage.findByIdAndDelete(id);

    res.json({ message: "Cottage deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get statistics for an owner's cottages
// @ts-ignore
router.get("/statistics/:ownerId", async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;

    // Convert ownerId string to ObjectId
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // Get all cottages owned by this owner
    const cottages = await Cottage.find({ ownerId: ownerObjectId });
    const cottageIds = cottages.map((c) => c._id);

    if (cottages.length === 0) {
      return res.json({
        reservationsPerMonth: [],
        weekendVsWeekday: [],
      });
    }

    // Get all confirmed reservations for these cottages with past checkOut date
    const now = new Date();
    const reservations = await Reservation.find({
      cottageId: { $in: cottageIds },
      status: "confirmed",
      checkOut: { $lt: now }, // Only completed reservations
    });

    // Calculate reservations per month per cottage
    const reservationsPerMonth: any = {};
    cottages.forEach((cottage) => {
      reservationsPerMonth[cottage._id.toString()] = {
        cottageName: cottage.name,
        cottageId: cottage._id.toString(),
        months: {},
      };
    });

    // Helper function to check if a date falls on a weekend
    const isWeekend = (date: Date): boolean => {
      const day = date.getDay();
      return day === 0 || day === 6; // Sunday = 0, Saturday = 6
    };

    // Helper function to count weekend/weekday days in a date range
    const countWeekendWeekdayDays = (
      checkIn: Date,
      checkOut: Date
    ): { weekendDays: number; weekdayDays: number } => {
      let weekendDays = 0;
      let weekdayDays = 0;
      const currentDate = new Date(checkIn);

      while (currentDate < checkOut) {
        if (isWeekend(currentDate)) {
          weekendDays++;
        } else {
          weekdayDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return { weekendDays, weekdayDays };
    };

    // Initialize weekend/weekday counters
    const weekendVsWeekday: any = {};
    cottages.forEach((cottage) => {
      weekendVsWeekday[cottage._id.toString()] = {
        cottageName: cottage.name,
        cottageId: cottage._id.toString(),
        weekendDays: 0,
        weekdayDays: 0,
      };
    });

    // Process each reservation
    reservations.forEach((reservation) => {
      const cottageId = reservation.cottageId.toString();
      const checkOutDate = new Date(reservation.checkOut);
      const monthYear = `${checkOutDate.getFullYear()}-${String(
        checkOutDate.getMonth() + 1
      ).padStart(2, "0")}`;

      // Count reservations per month
      if (reservationsPerMonth[cottageId]) {
        if (!reservationsPerMonth[cottageId].months[monthYear]) {
          reservationsPerMonth[cottageId].months[monthYear] = 0;
        }
        reservationsPerMonth[cottageId].months[monthYear]++;
      }

      // Count weekend vs weekday days
      const { weekendDays, weekdayDays } = countWeekendWeekdayDays(
        new Date(reservation.checkIn),
        new Date(reservation.checkOut)
      );

      if (weekendVsWeekday[cottageId]) {
        weekendVsWeekday[cottageId].weekendDays += weekendDays;
        weekendVsWeekday[cottageId].weekdayDays += weekdayDays;
      }
    });

    // Format the data for response
    const formattedReservationsPerMonth = Object.values(reservationsPerMonth);
    const formattedWeekendVsWeekday = Object.values(weekendVsWeekday);

    res.json({
      reservationsPerMonth: formattedReservationsPerMonth,
      weekendVsWeekday: formattedWeekendVsWeekday,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
