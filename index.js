// Import necessary modules and packages
const express = require("express");
const app = express();
const os = require("os");
const userRoutes = require("./routes/user");
const profileRoutes = require("./routes/profile");
const courseRoutes = require("./routes/course");
const paymentRoutes = require("./routes/payment");
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

// Loading environment variables from .env file
dotenv.config();

// Setting up port number
const PORT = process.env.PORT || 4000;



// Connecting to database
database.connect();
 
// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
	cors({
		origin: process.env.CLIENT_URL || "http://localhost:5173",
		credentials: true,
	})
);
app.use(
	fileUpload({
		useTempFiles: true,
		tempFileDir: process.env.TEMP_DIR || os.tmpdir(),
	})
);

// Connecting to cloudinary
cloudinaryConnect();

// Setting up routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);

// Testing the server
app.get("/", (req, res) => {
	return res.json({
		success: true,
		message: "Server running successfully",
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		success: false,
		message: "Route not found"
	});
});

// Global error handler
app.use((err, req, res, next) => {
	console.error("Error:", err.message);
	res.status(err.status || 500).json({
		success: false,
		message: err.message || "Internal server error"
	});
});

// Listening to the server
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
