const express = require("express");
const shortid = require("shortid");
const mongoose = require("mongoose");

const router = express.Router();

const UrlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
});

const Url = mongoose.model("Url", UrlSchema);

// ✅ Create Short URL
router.post("/shorten", async (req, res) => {
  let { originalUrl } = req.body;
  if (!/^https?:\/\//i.test(originalUrl)) {
    originalUrl = "http://" + originalUrl;
  }
  const shortUrl = shortid.generate();
  const url = new Url({ originalUrl, shortUrl });
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

module.exports = router;
