
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Feedback = require("./models/Feedback");

dotenv.config();

const app = express();

app.use(express.json());

// Reuse MongoDB connection between Vercel requests
let cachedConnection = global.mongoose;

if (!cachedConnection) {
  cachedConnection = global.mongoose = {
    conn: null,
    promise: null
  };
}

async function connectDB() {
  if (cachedConnection.conn) {
    return cachedConnection.conn;
  }

  if (!cachedConnection.promise) {
    cachedConnection.promise = mongoose
      .connect(process.env.MONGODB_URI)
      .then((connection) => {
        console.log("MongoDB connected successfully!");
        return connection;
      })
      .catch((error) => {
        cachedConnection.promise = null;
        throw error;
      });
  }

  cachedConnection.conn = await cachedConnection.promise;
  return cachedConnection.conn;
}

// Connect to MongoDB before handling API requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection error:", error.message);

    res.status(503).json({
      message: "Database connection unavailable."
    });
  }
});

// POST: Submit student feedback
app.post("/api/feedback", async (req, res) => {
  try {
    const { name, rating, comment } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof comment !== "string" ||
      !comment.trim()
    ) {
      return res.status(400).json({
        message: "Name and comment are required."
      });
    }

    const numericRating = Number(rating);

    if (
      rating === "" ||
      rating === null ||
      rating === undefined ||
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5."
      });
    }

    const feedback = new Feedback({
      name: name.trim(),
      rating: numericRating,
      comment: comment.trim()
    });

    await feedback.save();

    res.status(201).json({
      message: "Feedback submitted successfully!",
      feedback
    });

  } catch (error) {
    console.error("Error saving feedback:", error.message);

    res.status(500).json({
      message: "Unable to save feedback."
    });
  }
});

// GET: Retrieve all feedback
app.get("/api/feedback", async (req, res) => {
  try {
    const feedbackList = await Feedback.find().sort({
      createdAt: -1
    });

    res.status(200).json(feedbackList);

  } catch (error) {
    console.error("Error retrieving feedback:", error.message);

    res.status(500).json({
      message: "Unable to retrieve feedback."
    });
  }
});

// Export Express app for Vercel
module.exports = app;

// Run a normal local server when not running on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
