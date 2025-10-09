import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directories if they don't exist
const profilesDir = path.join(__dirname, "../../uploads/profiles");
const cottagesDir = path.join(__dirname, "../../uploads/cottages");
const defaultDir = path.join(__dirname, "../../uploads/default");

if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}
if (!fs.existsSync(cottagesDir)) {
  fs.mkdirSync(cottagesDir, { recursive: true });
}
if (!fs.existsSync(defaultDir)) {
  fs.mkdirSync(defaultDir, { recursive: true });
}

// Configure storage for profile pictures
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Configure storage for cottage images
const cottageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, cottagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "cottage-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to accept only images
const imageFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only JPG and PNG images are allowed"));
  }
};

// File filter to accept JSON files
const jsonFilter = (req: any, file: any, cb: any) => {
  const extname = path.extname(file.originalname).toLowerCase() === ".json";
  const mimetype = file.mimetype === "application/json";

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only JSON files are allowed"));
  }
};

// Configure multer for profile pictures
export const upload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: imageFilter,
});

// Configure multer for cottage images (multiple files)
export const cottageImageUpload = multer({
  storage: cottageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size per image
  },
  fileFilter: imageFilter,
});

// Configure multer for JSON import
export const jsonUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB max file size
  },
  fileFilter: jsonFilter,
});
