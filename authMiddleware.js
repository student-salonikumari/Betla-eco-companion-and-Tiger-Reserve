const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {

    try {

        // Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({
                success: false,
                message: "Login required."
            });

        }

        // Expected format:
        // Bearer TOKEN

        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {

            return res.status(401).json({
                success: false,
                message: "Invalid authentication format."
            });

        }

        const token = parts[1];

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // User information available to next route
        req.user = decoded;

        next();

    } catch (error) {

        console.error("❌ Authentication Error:");
        console.error(error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired login session."
        });

    }

}

module.exports = verifyToken;