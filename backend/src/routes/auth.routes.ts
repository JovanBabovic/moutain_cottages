import express, { Request, Response } from "express";
import User from "../models/user.model";
import RegistrationRequest from "../models/registration-request.model";
import { upload } from "../config/multer.config";
import { validateImage, deleteFile } from "../utils/image-validator";
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validatePhone,
  validateRequiredString,
  validateCreditCard,
  validateGender,
  validateUserType,
  combineValidationResults,
  sanitizeString,
} from "../utils/validation";
import path from "path";
import bcrypt from "bcrypt";

const router = express.Router();

const DEFAULT_PROFILE_PICTURE = "/uploads/default-profile.png";

// Login route for tourists and owners
// @ts-ignore
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validate inputs
    const usernameValidation = validateRequiredString(username, "Username");
    const passwordValidation = validateRequiredString(password, "Password");

    if (!usernameValidation.isValid || !passwordValidation.isValid) {
      const errors = [
        ...usernameValidation.errors,
        ...passwordValidation.errors,
      ];
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    const user = await User.findOne({
      username: sanitizeString(username),
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Account is not active. Waiting for administrator approval.",
      });
    }

    if (user.userType === "admin") {
      return res
        .status(403)
        .json({ message: "Please use the admin login page" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        profilePicture: user.profilePicture,
        address: user.address,
        phone: user.phone,
        creditCard: user.creditCard,
        gender: user.gender,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Admin login route
// @ts-ignore
router.post("/admin-login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validate inputs
    const usernameValidation = validateRequiredString(username, "Username");
    const passwordValidation = validateRequiredString(password, "Password");

    if (!usernameValidation.isValid || !passwordValidation.isValid) {
      const errors = [
        ...usernameValidation.errors,
        ...passwordValidation.errors,
      ];
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    const user = await User.findOne({
      username: sanitizeString(username),
      userType: "admin",
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    res.json({
      message: "Admin login successful",
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Registration route with profile picture upload
router.post(
  "/register",
  upload.single("profilePicture"),
  // @ts-ignore
  async (req: Request, res: Response) => {
    try {
      const {
        username,
        password,
        firstName,
        lastName,
        gender,
        address,
        phone,
        email,
        creditCard,
        userType,
      } = req.body;

      // Comprehensive validation
      const validationResult = combineValidationResults(
        validateUsername(username),
        validatePassword(password),
        validateRequiredString(firstName, "First name", 1, 100),
        validateRequiredString(lastName, "Last name", 1, 100),
        validateGender(gender),
        validateRequiredString(address, "Address", 5, 500),
        validatePhone(phone),
        validateEmail(email),
        validateCreditCard(creditCard),
        validateUserType(userType)
      );

      if (!validationResult.isValid) {
        if (req.file) {
          deleteFile(req.file.path);
        }
        return res.status(400).json({
          message: "Validation failed",
          errors: validationResult.errors,
        });
      }

      // Check if username already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        if (req.file) {
          deleteFile(req.file.path);
        }
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        if (req.file) {
          deleteFile(req.file.path);
        }
        return res.status(400).json({ message: "Email already registered" });
      }

      // Check if there's already a pending request
      const existingRequest = await RegistrationRequest.findOne({
        $or: [{ username }, { email }],
        status: "pending",
      });
      if (existingRequest) {
        if (req.file) {
          deleteFile(req.file.path);
        }
        return res
          .status(400)
          .json({ message: "Registration request already pending" });
      }

      // Check if username or email was previously rejected
      const rejectedRequest = await RegistrationRequest.findOne({
        $or: [{ username }, { email }],
        status: "rejected",
      });
      if (rejectedRequest) {
        if (req.file) {
          deleteFile(req.file.path);
        }
        return res.status(400).json({
          message:
            "This username or email was previously rejected and cannot be used for registration.",
        });
      }

      let profilePicturePath = "";

      // Handle profile picture for owners
      if (userType === "owner") {
        if (req.file) {
          // Validate image dimensions
          const validation = await validateImage(req.file.path);
          if (!validation.isValid) {
            deleteFile(req.file.path);
            return res.status(400).json({ message: validation.error });
          }
          profilePicturePath = `/uploads/profiles/${req.file.filename}`;
        } else {
          // Use default profile picture for owners without upload
          profilePicturePath = DEFAULT_PROFILE_PICTURE;
        }
      } else if (req.file) {
        // If tourist uploaded a picture, use it
        const validation = await validateImage(req.file.path);
        if (!validation.isValid) {
          deleteFile(req.file.path);
          return res.status(400).json({ message: validation.error });
        }
        profilePicturePath = `/uploads/profiles/${req.file.filename}`;
      }

      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, 10);

      // Sanitize string inputs to prevent injection attacks
      const sanitizedData = {
        username: sanitizeString(username),
        password: hashedPassword, // Store hashed password
        firstName: sanitizeString(firstName),
        lastName: sanitizeString(lastName),
        gender: gender.trim().toUpperCase(),
        address: sanitizeString(address),
        phone: sanitizeString(phone),
        email: sanitizeString(email.toLowerCase()),
        creditCard: creditCard.replace(/[\s\-]/g, ""), // Remove spaces and hyphens
        userType: userType.trim().toLowerCase(),
      };

      // Create registration request
      const registrationRequest = new RegistrationRequest({
        ...sanitizedData,
        profilePicture: profilePicturePath,
        status: "pending",
      });

      await registrationRequest.save();

      res.status(201).json({
        message:
          "Registration request submitted successfully. Waiting for administrator approval.",
        requestId: registrationRequest._id,
      });
    } catch (error) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      res.status(500).json({ message: "Server error", error });
    }
  }
);

// Password change route (public)
// @ts-ignore
router.post("/change-password", async (req: Request, res: Response) => {
  try {
    const { username, oldPassword, newPassword } = req.body;

    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if old and new passwords are the same
    if (oldPassword === newPassword) {
      return res
        .status(400)
        .json({ message: "New password must be different from old password" });
    }

    // Validate new password (minimum 6 characters)
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(401).json({ message: "Incorrect old password" });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Update user profile
router.put(
  "/profile/:userId",
  upload.single("profilePicture"),
  // @ts-ignore
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { firstName, lastName, address, phone, email, creditCard } =
        req.body;

      const user = await User.findById(userId);

      if (!user) {
        if (req.file) {
          deleteFile(req.file.path);
        }
        return res.status(404).json({ message: "User not found" });
      }

      // Update basic fields if provided
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (address) user.address = address;
      if (phone) user.phone = phone;
      if (email) {
        // Check if email is already in use by another user
        const existingEmail = await User.findOne({
          email,
          _id: { $ne: userId },
        });
        if (existingEmail) {
          if (req.file) {
            deleteFile(req.file.path);
          }
          return res
            .status(400)
            .json({ message: "Email already in use by another user" });
        }
        user.email = email;
      }
      if (creditCard) user.creditCard = creditCard;

      // Handle profile picture update
      if (req.file) {
        const validation = await validateImage(req.file.path);
        if (!validation.isValid) {
          deleteFile(req.file.path);
          return res.status(400).json({ message: validation.error });
        }

        // Delete old profile picture if it's not the default
        if (
          user.profilePicture &&
          user.profilePicture !== DEFAULT_PROFILE_PICTURE
        ) {
          const oldFilePath = path.join(
            __dirname,
            "../../",
            user.profilePicture
          );
          deleteFile(oldFilePath);
        }

        user.profilePicture = `/uploads/profiles/${req.file.filename}`;
      }

      await user.save();

      res.json({
        message: "Profile updated successfully",
        user: {
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType,
          profilePicture: user.profilePicture,
          address: user.address,
          phone: user.phone,
          creditCard: user.creditCard,
          gender: user.gender,
        },
      });
    } catch (error) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      res.status(500).json({ message: "Server error", error });
    }
  }
);

// Get all pending registration requests (admin only)
router.get("/registration-requests", async (req: Request, res: Response) => {
  try {
    const requests = await RegistrationRequest.find({ status: "pending" });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Approve registration request (admin only)
router.post(
  "/registration-requests/:id/approve",
  // @ts-ignore
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const request = await RegistrationRequest.findById(id);

      if (!request) {
        return res
          .status(404)
          .json({ message: "Registration request not found" });
      }

      if (request.status !== "pending") {
        return res.status(400).json({ message: "Request already processed" });
      }

      // Create new user
      const newUser = new User({
        username: request.username,
        password: request.password,
        firstName: request.firstName,
        lastName: request.lastName,
        gender: request.gender,
        address: request.address,
        phone: request.phone,
        email: request.email,
        profilePicture: request.profilePicture,
        creditCard: request.creditCard,
        userType: request.userType,
        isActive: true,
      });

      await newUser.save();

      // Update request status
      request.status = "approved";
      request.reviewedAt = new Date();
      await request.save();

      res.json({ message: "Registration request approved", user: newUser });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

// Reject registration request (admin only)
router.post(
  "/registration-requests/:id/reject",
  // @ts-ignore
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const request = await RegistrationRequest.findById(id);

      if (!request) {
        return res
          .status(404)
          .json({ message: "Registration request not found" });
      }

      if (request.status !== "pending") {
        return res.status(400).json({ message: "Request already processed" });
      }

      // Delete uploaded profile picture if exists
      if (
        request.profilePicture &&
        request.profilePicture !== DEFAULT_PROFILE_PICTURE
      ) {
        const filePath = path.join(__dirname, "../../", request.profilePicture);
        deleteFile(filePath);
      }

      request.status = "rejected";
      request.reviewedAt = new Date();
      await request.save();

      res.json({ message: "Registration request rejected" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

export default router;
