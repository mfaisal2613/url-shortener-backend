const express = require("express");
const shortid = require("shortid");
const mongoose = require("mongoose");

const router = express.Router();

// ✅ Updated Schema with User Email & Short URL
const UrlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: { type: String, unique: true }, // Ensure short URLs are unique
  email: String, // Store the user's email
});

const Url = mongoose.model("Url", UrlSchema);

// ✅ Create Short URL (Allow Custom Short URL)
router.post("/shorten", async (req, res) => {
  let { originalUrl, email, customShortUrl } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  if (!/^https?:\/\//i.test(originalUrl)) {
    originalUrl = "http://" + originalUrl;
  }

  let shortUrl = customShortUrl || shortid.generate(); // Use custom or generate one

  // ✅ Check if custom short URL is already in use
  if (customShortUrl) {
    const existingUrl = await Url.findOne({ shortUrl: customShortUrl });
    if (existingUrl) {
      return res
        .status(400)
        .json({ error: "Custom short URL is already taken" });
    }
  }

  const url = new Url({ originalUrl, shortUrl, email });

  await url.save();
  res.json({ shortUrl });
});

// ✅ Redirect to Original URL
router.get("/:shortUrl", async (req, res) => {
  const { shortUrl } = req.params;
  const url = await Url.findOne({ shortUrl });

  if (url) {
    res.redirect(url.originalUrl);
  } else {
    res.status(404).json({ error: "URL not found" });
  }
});

// ✅ Get all URLs for a specific user
router.get("/user/:email", async (req, res) => {
  const { email } = req.params;
  const urls = await Url.find({ email });

  if (urls.length > 0) {
    res.json(urls);
  } else {
    res.status(404).json({ error: "No URLs found for this user" });
  }
});

module.exports = router;
