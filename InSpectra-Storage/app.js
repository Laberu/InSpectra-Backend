const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cookieParser());

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {        
        const userId = req.cookies.userid;
        
        if (!userId) {
            return cb(new Error('User ID not found'), null);
        }

        const userUploadDir = path.join(uploadDir, userId);
        if (!fs.existsSync(userUploadDir)) {
            fs.mkdirSync(userUploadDir, { recursive: true });
        }

        cb(null, userUploadDir); // Upload to the user's specific folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Serve frontend files
app.use(express.static("public"));
// Upload API
app.post("/upload", upload.array("photos", 50), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
    }

    const userId = req.cookies.userid; // Assuming userId is stored in cookies
    const files = req.files.map(file => ({
        filename: file.filename,
        path: `/uploads/${userId}/${file.filename}`, // Updated path to include userId
    }));

    res.json({
        message: "Files uploaded successfully!",
        files: files,
    });
});

// Serve uploaded images
app.use("/uploads", express.static(uploadDir));

app.get("/test-cookies", (req, res) => {
    console.log("All cookies:", req.cookies); // Print all cookies to the terminal
    res.send("Cookies printed to terminal.");
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
