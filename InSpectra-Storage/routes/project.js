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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
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
    const { userId, projectName, description } = req.body;
    const outputFile = req.file ? req.file.path : null;
    const newProject = new Project({ userId, projectName, description, outputFile });
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

// NEW endpoint: Get project details and provide a download URL for the zip file
router.get("/:id/download", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || !project.outputFile) {
      return res.status(404).json({ error: "Project or zip file not found" });
    }
    // Construct the download URL based on the server host and file path
    const downloadUrl = `${req.protocol}://${req.get("host")}/${project.outputFile}`;
    res.json({
      project,
      downloadUrl,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
