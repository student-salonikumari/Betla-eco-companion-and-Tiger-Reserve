const verifyToken = require("./authMiddleware");

function verifyAdmin(req, res, next) {

    verifyToken(req, res, () => {

        if (req.user.role !== "ADMIN") {

            return res.status(403).json({
                success: false,
                message: "Admin access required."
            });

        }

        next();
    });

}

module.exports = verifyAdmin;