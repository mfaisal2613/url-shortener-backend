const express = require("express");
const shortid = require("shortid");
const mongoose = require("mongoose");

const router = express.Router();

// ✅ Updated Schema with Name and Shared Users
const UrlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: { type: String, unique: true },
  email: String, // Owner's email
  name: String, // ✅ Added name field
  sharedWith: [{ type: String }], // Users the URL is shared with
});

const Url = mongoose.model("Url", UrlSchema);

// ✅ Create Short URL (Allow Custom Short URL)
router.post("/shorten", async (req, res) => {
  let { originalUrl, email, customShortUrl, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  if (!/^https?:\/\//i.test(originalUrl)) {
    originalUrl = "http://" + originalUrl;
  }

  let shortUrl = customShortUrl || shortid.generate();

  if (customShortUrl) {
    const existingUrl = await Url.findOne({ shortUrl: customShortUrl });
    if (existingUrl) {
      return res
        .status(400)
        .json({ error: "Custom short URL is already taken" });
    }
  }

  const url = new Url({ originalUrl, shortUrl, email, name }); // ✅ Store name

  await url.save();
  res.json({
    shortUrl,
    shareUrl: `${req.protocol}://${req.get("host")}/${shortUrl}`,
  });
});

// ✅ Share URL with another user
router.post("/share/:shortUrl", async (req, res) => {
  const { shortUrl } = req.params;
  const { ownerEmail, shareWithEmail } = req.body;

  if (!ownerEmail || !shareWithEmail) {
    return res
      .status(400)
      .json({ error: "Both owner email and recipient email are required" });
  }

  const url = await Url.findOne({ shortUrl });

  if (!url) {
    return res.status(404).json({ error: "URL not found" });
  }

  if (url.email !== ownerEmail) {
    return res
      .status(403)
      .json({ error: "You are not authorized to share this URL" });
  }

  // Prevent duplicate sharing
  if (url.sharedWith.includes(shareWithEmail)) {
    return res.status(400).json({ error: "URL already shared with this user" });
  }

  url.sharedWith.push(shareWithEmail);
  await url.save();

  res.json({ message: "URL shared successfully", sharedWith: url.sharedWith });
});

// ✅ Get all URLs owned by the user
router.get("/user/:email", async (req, res) => {
  const { email } = req.params;
  const urls = await Url.find({ email });

  if (urls.length > 0) {
    res.json(urls);
  } else {
    res.status(404).json({ error: "No URLs found for this user" });
  }
});

// ✅ Get all URLs shared with a user
router.get("/shared/:email", async (req, res) => {
  const { email } = req.params;
  const urls = await Url.find({ sharedWith: email });

  if (urls.length > 0) {
    res.json(urls);
  } else {
    res.status(404).json({ error: "No shared URLs found for this user" });
  }
});

// ✅ Delete URL (Only by Owner)
router.delete("/delete/:shortUrl", async (req, res) => {
  const { shortUrl } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required to delete URLs" });
  }

  const url = await Url.findOne({ shortUrl });

  if (!url) {
    return res.status(404).json({ error: "URL not found" });
  }

  if (url.email !== email) {
    return res.status(403).json({ error: "Unauthorized to delete this URL" });
  }

  await Url.deleteOne({ shortUrl });
  res.json({ message: "URL deleted successfully" });
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

module.exports = router;
