const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

const Feedback = require("./models/Feedback");

dotenv.config();

const app = express();


app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully!");

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
}


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
        message: "Name and comment are required.",
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
        message: "Rating must be an integer between 1 and 5.",
      });
    }

   
    const feedback = new Feedback({
      name: name.trim(),
      rating: numericRating,
      comment: comment.trim(),
    });

    await feedback.save();

    res.status(201).json({
      message: "Feedback submitted successfully!",
      feedback,
    });
  } catch (error) {
    console.error("Error saving feedback:", error.message);

    res.status(500).json({
      message: "Unable to save feedback.",
    });
  }
});


app.get("/api/feedback", async (req, res) => {
  try {
    const feedbackList = await Feedback.find().sort({
      createdAt: -1,
    });

    res.status(200).json(feedbackList);
  } catch (error) {
    console.error("Error retrieving feedback:", error.message);

    res.status(500).json({
      message: "Unable to retrieve feedback.",
    });
  }
});


startServer();