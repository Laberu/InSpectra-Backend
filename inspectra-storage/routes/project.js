const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const Project = require("../models/Project");

// Configure Multer storage for zip files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    // Create a unique filename using timestamp
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Configure multer middleware with file filtering for zip files only
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/zip" ||
      file.mimetype === "application/x-zip-compressed"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only zip files are allowed."), false);
    }
  },
});

// CREATE a new project with a zip file upload
router.post("/", upload.single("zipFile"), async (req, res) => {
  try {
    const { userId, jobId, projectName, description } = req.body;
    const outputFile = req.file ? req.file.path : null;
    const newProject = new Project({ userId, jobId, projectName, description, outputFile });
    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// READ all projects
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// READ one project by id
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE a project by id, optionally uploading a new zip file
router.put("/:id", upload.single("zipFile"), async (req, res) => {
  try {
    const { projectName, description } = req.body;
    let updateData = { projectName, description };
    if (req.file) {
      updateData.outputFile = req.file.path;
      // Optionally, remove the old zip file if it exists
      const existingProject = await Project.findById(req.params.id);
      if (existingProject && existingProject.outputFile) {
        fs.unlink(existingProject.outputFile, (err) => {
          if (err) console.error("Error deleting old file:", err);
        });
      }
    }
    const updatedProject = await Project.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    if (!updatedProject)
      return res.status(404).json({ error: "Project not found" });
    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE a project by id and remove its zip file if exists
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.outputFile) {
      fs.unlink(project.outputFile, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET endpoint that returns the project zip file as a download
router.get("/:id/download", async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project || !project.outputFile) {
        return res.status(404).json({ error: "Project or zip file not found" });
      }
      // Resolve the file path
      const filePath = path.resolve(project.outputFile);
      // Use res.download() to send the file
      res.download(filePath, err => {
        if (err) {
          console.error("Error sending file:", err);
          // If an error occurs while sending, you can send a JSON error or handle it accordingly.
          res.status(500).json({ error: err.message });
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET endpoint to download the oldest zip file for a given jobId
router.get("/download/job/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    // Find all projects with the same jobId
    const projects = await Project.find({ jobId }).sort({ createdAt: 1 });

    if (!projects || projects.length === 0) {
      return res.status(404).json({ error: "No project found with this jobId" });
    }

    const oldestProject = projects[0];

    if (!oldestProject.outputFile) {
      return res.status(404).json({ error: "Output file not found for this project" });
    }

    const filePath = path.resolve(oldestProject.outputFile);
    res.download(filePath, err => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).json({ error: err.message });
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
