const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// Enable CORS for all routes (so you can still access from other origins if needed)
app.use(cors());

// Serve static files from public/
app.use(express.static(path.join(__dirname, "public")));

// Default route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "home.html"));
});
app.get("/phone", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "phone.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});