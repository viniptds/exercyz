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

const routes = [
    'boxing',
    'deadlift',
    'phone'
]

routes.forEach(route => {
    app.get('/' + route, (req, res) => {
        res.sendFile(path.join(__dirname, "public", `${route}.html`));
    });
});

app.get('/audio', (req, res) => {
    if (process.env.AUDIO_FILE_NAME) {
        res.json({
            audio: process.env.AUDIO_FILE_NAME ?? 'audio.mp3',
            success: true
        });
    } else {
        res.status(404).json({ success: false, error: 'Audio file not found' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});