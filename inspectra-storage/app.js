const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cookieParser());
app.use(express.json());

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

// New route to fetch a list of uploaded files for the current user
app.get("/user-files", (req, res) => {
    const userId = req.cookies.userid;
    if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
    }

    const userUploadDir = path.join(uploadDir, userId);
    if (!fs.existsSync(userUploadDir)) {
        return res.status(404).json({ message: "No files found for this user" });
    }

    // Read the directory to get all uploaded files
    fs.readdir(userUploadDir, (err, files) => {
        if (err) {
            return res.status(500).json({ message: "Error reading the directory" });
        }

        const filePaths = files.map(file => ({
            filename: file,
            path: `/uploads/${userId}/${file}`,
        }));

        res.json({ files: filePaths });
    });
});

// New route to delete a file
app.delete("/delete-file", (req, res) => {
    const { filename } = req.body; // This will now correctly extract filename
    const userId = req.cookies.userid;

    if (!userId || !filename) {
        return res.status(400).json({ message: "Missing userId or filename" });
    }

    const userUploadDir = path.join(uploadDir, userId);
    const filePath = path.join(userUploadDir, filename);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
    }

    // Delete the file
    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).json({ message: "Error deleting file" });
        }
        res.json({ message: "File deleted successfully" });
    });
});

// Serve uploaded images
app.use("/uploads", express.static(uploadDir));

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
