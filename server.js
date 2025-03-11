require("dotenv").config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const { BearerStrategy } = require("passport-azure-ad");

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Set this higher if needed
  })
  .then(() => console.log(`Connected to MongoDB (${process.env.NODE_ENV})`))
  .catch((err) => console.error("MongoDB connection error:", err));

// ✅ Azure AD Authentication Setup
const options = {
  identityMetadata: `${process.env.AZURE_AUTHORITY}/.well-known/openid-configuration`,
  clientID: process.env.AZURE_CLIENT_ID,
  validateIssuer: true,
  loggingLevel: "info",
  passReqToCallback: false,
};

passport.use(
  new BearerStrategy(options, (token, done) => {
    console.log("Decoded Token:", token);
    done(null, token);
  })
);

app.use(passport.initialize());

// ✅ Protected Route
app.get(
  "/protected",
  passport.authenticate("oauth-bearer", { session: false }),
  (req, res) => {
    res.json({ message: "Access granted!", user: req.user });
  }
);

// ✅ Import URL Shortener Routes
const urlRoutes = require("./shorten");
app.use("/api", urlRoutes);

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
