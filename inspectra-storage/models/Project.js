const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  jobId: {
    type: String,
    required: true
  },
  projectName: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  outputFile: { 
    type: String  // This could be a path, URL, or any reference to the output file
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Project", ProjectSchema);
