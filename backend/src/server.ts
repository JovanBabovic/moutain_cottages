import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import authRoutes from "./routes/auth.routes";
import publicRoutes from "./routes/public.routes";
import cottageRoutes from "./routes/cottage.routes";
import reservationRoutes from "./routes/reservation.routes";
import ownerCottageRoutes from "./routes/owner-cottage.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// MongoDB connection
const MONGODB_URI = "mongodb://localhost:27017/mountain-cottage";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/cottages", cottageRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/owner/cottages", ownerCottageRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Mountain Cottage API is running");
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Express running on port ${PORT}`));
