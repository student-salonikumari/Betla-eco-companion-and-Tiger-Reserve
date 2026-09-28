/*const express = require("express");
const path = require("path");

const app = express();

app.use(express.static(__dirname));
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "Betla.html"));
});

app.get("/api/message", (req, res) => {

    res.json({
        message: "Backend is working Successfully!"
    });

});
app.post("/api/permit", (req, res) => {

    console.log("Permit Data Received:");
    console.log(req.body);

    res.json({
        success: true,
        message: "Safari Permit Submitted Successfully!"
    });
});

app.listen(5000, () => {
    console.log("Server Started on http://localhost:5000");
});*/

require("dotenv").config();

const express = require("express");
const path = require("path");
const {
    MongoClient,
    ServerApiVersion,
    ObjectId
} = require("mongodb");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const verifyToken = require("./authMiddleware");
const verifyAdmin = require("./adminMiddleware");
const ownerRoutes = require("./ownerRoutes");

const app = express();


// ===============================
// MIDDLEWARE
// ===============================

app.use(express.static(__dirname));
app.use(express.json());

app.use("/api/owner", ownerRoutes);


// ===============================
// MONGODB CONNECTION
// ===============================

const uri = process.env.MONGODB_URI;

if (!uri) {

    console.error(
        "❌ MONGODB_URI is missing in .env file"
    );

    process.exit(1);
}


const client = new MongoClient(uri, {

    serverApi: {

        version: ServerApiVersion.v1,

        strict: true,

        deprecationErrors: true

    }

});


let db;


// ===============================
// CONNECT TO MONGODB
// ===============================

async function connectDB() {

    try {

        await client.connect();

        await client
            .db("admin")
            .command({
                ping: 1
            });


        db =
            client.db(
                "betla_ecocompanion"
            );


        app.locals.db = db;


        console.log(
            "================================="
        );

        console.log(
            "✅ MongoDB Connected Successfully"
        );

        console.log(
            "📦 Database: betla_ecocompanion"
        );

        console.log(
            "================================="
        );


    } catch (error) {

        console.error(
            "❌ MongoDB Connection Failed"
        );

        console.error(
            error.message
        );

        process.exit(1);

    }

}


// ===============================
// HOME PAGE
// ===============================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "Betla.html"
        )
    );

});


// ===============================
// TEST BACKEND
// ===============================

app.get(
    "/api/message",
    (req, res) => {

        res.json({

            success: true,

            message:
                "Backend is working Successfully!"

        });

    }
);


// ===============================
// USER SIGNUP
// ===============================

app.post(
    "/api/signup",
    async (req, res) => {

        try {

            const {
                name,
                email,
                password
            } = req.body;


            if (
                !name ||
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "All fields are required."

                });

            }


            const existingUser =
                await db
                    .collection("users")
                    .findOne({

                        email:
                            email
                                .toLowerCase()
                                .trim()

                    });


            if (existingUser) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Email already registered."

                });

            }


            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );


            const newUser = {

                name:
                    name.trim(),

                email:
                    email
                        .toLowerCase()
                        .trim(),

                password:
                    hashedPassword,

                role:
                    "USER",

                createdAt:
                    new Date()

            };


            const result =
                await db
                    .collection("users")
                    .insertOne(
                        newUser
                    );


            console.log(
                "✅ New User Saved in MongoDB"
            );

            console.log(
                "User ID:",
                result.insertedId
            );


            res.json({

                success: true,

                message:
                    "Account created successfully!",

                userId:
                    result.insertedId

            });


        } catch (error) {

            console.error(
                "❌ Signup Error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Account create nahi ho paya."

            });

        }

    }
);


// ===============================
// USER LOGIN
// ===============================

app.post(
    "/api/login",
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;


            if (
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email and password are required."

                });

            }


            const user =
                await db
                    .collection("users")
                    .findOne({

                        email:
                            email
                                .toLowerCase()
                                .trim()

                    });


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid Email or Password!"

                });

            }


            const passwordMatch =
                await bcrypt.compare(

                    password,

                    user.password

                );


            if (!passwordMatch) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid Email or Password!"

                });

            }


            const token =
                jwt.sign(

                    {

                        userId:
                            user._id.toString(),

                        email:
                            user.email,

                        role:
                            user.role

                    },

                    process.env.JWT_SECRET,

                    {

                        expiresIn:
                            "7d"

                    }

                );


            console.log(
                "✅ User Login Successful:",
                user.email
            );


            res.json({

                success: true,

                message:
                    "Login Successful!",

                token:
                    token,

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email,

                    role:
                        user.role

                }

            });


        } catch (error) {

            console.error(
                "❌ Login Error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Login nahi ho paya."

            });

        }

    }
);


// ===============================
// WEBSITE OWNER - ADMIN LOGIN
// ===============================

app.post(
    "/api/admin/login",
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;


            if (
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Admin email and password are required."

                });

            }


            if (

                email
                    .toLowerCase()
                    .trim() !==
                process.env.ADMIN_EMAIL
                    .toLowerCase()
                    .trim()

                ||

                password !==
                process.env.ADMIN_PASSWORD

            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid Admin Email or Password!"

                });

            }


            const token =
                jwt.sign(

                    {

                        userId:
                            "WEBSITE_OWNER",

                        email:
                            process.env.ADMIN_EMAIL,

                        role:
                            "ADMIN"

                    },

                    process.env.JWT_SECRET,

                    {

                        expiresIn:
                            "7d"

                    }

                );


            console.log(
                "👑 Website Owner Admin Login Successful"
            );


            res.json({

                success: true,

                message:
                    "Admin Login Successful!",

                token:
                    token,

                user: {

                    name:
                        "Website Owner",

                    email:
                        process.env.ADMIN_EMAIL,

                    role:
                        "ADMIN"

                }

            });


        } catch (error) {

            console.error(
                "❌ Admin Login Error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Admin login nahi ho paya."

            });

        }

    }
);


// ===============================
// RESET PASSWORD
// ===============================

app.post(
    "/api/reset-password",
    async (req, res) => {

        try {

            const {
                email,
                newPassword
            } = req.body;


            if (
                !email ||
                !newPassword
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email and new password are required."

                });

            }


            const user =
                await db
                    .collection("users")
                    .findOne({

                        email:
                            email
                                .toLowerCase()
                                .trim()

                    });


            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "This email is not registered!"

                });

            }


            const hashedPassword =
                await bcrypt.hash(
                    newPassword,
                    10
                );


            await db
                .collection("users")
                .updateOne(

                    {
                        _id:
                            user._id
                    },

                    {

                        $set: {

                            password:
                                hashedPassword,

                            passwordUpdatedAt:
                                new Date()

                        }

                    }

                );


            console.log(
                "✅ Password Updated:",
                user.email
            );


            res.json({

                success: true,

                message:
                    "Password Reset Successfully!"

            });


        } catch (error) {

            console.error(
                "❌ Reset Password Error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Password reset nahi ho paya."

            });

        }

    }
);


// ===============================
// DELETE MY ACCOUNT
// ===============================

app.delete(
    "/api/delete-account",
    verifyToken,
    async (req, res) => {

        try {

            const {
                password
            } = req.body;


            if (
                req.user.role ===
                "ADMIN"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Website Owner Admin account cannot be deleted."

                });

            }


            if (!password) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Password is required."

                });

            }


            const userId =
                new ObjectId(
                    req.user.userId
                );


            const user =
                await db
                    .collection("users")
                    .findOne({

                        _id:
                            userId

                    });


            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Account not found."

                });

            }


            const passwordMatch =
                await bcrypt.compare(

                    password,

                    user.password

                );


            if (!passwordMatch) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Incorrect password."

                });

            }


            await db
                .collection("ownerApplications")
                .deleteMany({

                    userId:
                        userId

                });


            await db
                .collection("homestayBookings")
                .deleteMany({

                    userId:
                        req.user.userId

                });


            const result =
                await db
                    .collection("users")
                    .deleteOne({

                        _id:
                            userId

                    });


            if (
                result.deletedCount ===
                0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Account could not be deleted."

                });

            }


            console.log(
                "🗑️ User Account Deleted:",
                user.email
            );


            res.json({

                success: true,

                message:
                    "Your account has been permanently deleted."

            });


        } catch (error) {

            console.error(
                "❌ Delete Account Error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Account delete nahi ho paya."

            });

        }

    }
);


// ===============================
// APPLY FOREST PERMIT
// ===============================

app.post(
    "/api/apply-permit",
    async (req, res) => {

        try {

            const {

                bookingId,

                visitorName,

                visitorMobile,

                visitorEmail,

                visitDate,

                visitorCount,

                idProof,

                amount

            } = req.body;


            const applyPermitData = {

                bookingId,

                visitorName,

                visitorMobile,

                visitorEmail,

                visitDate,

                visitorCount:
                    Number(
                        visitorCount
                    ),

                idProof,

                permitType:
                    "Forest Entry Permit",

                amount,

                status:
                    "PENDING",

                adminVisible:
                    true,

                createdAt:
                    new Date()

            };


            const result =
                await db
                    .collection(
                        "applyPermitBookings"
                    )
                    .insertOne(
                        applyPermitData
                    );


            console.log(
                "✅ APPLY PERMIT SAVED IN MONGODB"
            );

            console.log(
                "Booking ID:",
                bookingId
            );


            res.json({

                success: true,

                message:
                    "Apply Permit saved successfully.",

                id:
                    result.insertedId

            });


        } catch (error) {

            console.error(
                "❌ Apply Permit save error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Apply Permit save nahi ho paya."

            });

        }

    }
);


// ===============================
// SAFARI PERMIT / BOOK SAFARI
// ===============================

app.post(
    "/api/permit",
    async (req, res) => {

        try {

            console.log(
                "Permit Data Received:"
            );

            console.log(
                req.body
            );


            // Generate booking ID
            const bookingId =

                req.body.bookingId ||

                "BETLA" +
                Math.floor(
                    100000 +
                    Math.random() *
                    900000
                );


            const permitData = {

                bookingId:
                    bookingId,

                visitorName:
                    req.body.visitorName,

                visitorId:
                    req.body.visitorId,

                safariDate:
                    req.body.safariDate,

                safariSlot:
                    req.body.safariSlot,

                visitorCount:
                    Number(
                        req.body.visitorCount ||
                        1
                    ),

                visitorMobile:
                    req.body.visitorMobile,

                visitorEmail:
                    req.body.visitorEmail,

                status:
                    "PENDING",

                adminVisible:
                    true,

                createdAt:
                    new Date()

            };


            const result =
                await db
                    .collection(
                        "permitApplications"
                    )
                    .insertOne(
                        permitData
                    );


            console.log(
                "✅ Permit Saved in MongoDB"
            );

            console.log(
                "MongoDB ID:",
                result.insertedId
            );


            res.json({

                success: true,

                message:
                    "Safari Permit Submitted Successfully!",

                id:
                    result.insertedId,

                bookingId:
                    bookingId

            });


        } catch (error) {

            console.error(
                "❌ Permit save error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Permit save nahi ho paya.",

                error:
                    error.message

            });

        }

    }
);


// ===============================
// BOOKING HISTORY BY BOOKING ID
// ===============================

app.get(
    "/api/booking-history/:bookingId",
    async (req, res) => {

        try {

            const {
                bookingId
            } = req.params;


            // First check Safari
            let booking =
                await db
                    .collection(
                        "permitApplications"
                    )
                    .findOne({

                        bookingId:
                            bookingId

                    });


            let bookingType =
                "safari";


            // If not Safari,
            // check Forest Permit
            if (!booking) {

                booking =
                    await db
                        .collection(
                            "applyPermitBookings"
                        )
                        .findOne({

                            bookingId:
                                bookingId

                        });


                bookingType =
                    "permit";

            }


            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Booking not found"

                });

            }


            res.json({

                success: true,

                type:
                    bookingType,

                booking:
                    booking

            });


        } catch (error) {

            console.error(
                "Booking history error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to load booking"

            });

        }

    }
);


// ===============================
// HOMESTAY BOOKING
// ===============================

app.post(
    "/api/homestay-booking",
    verifyToken,
    async (req, res) => {

        try {

            console.log(
                "🏠 Homestay Booking Data Received:"
            );

            console.log(
                req.body
            );


            const bookingData = {

                bookingId:
                    req.body.bookingId,

                userId:
                    req.user.userId,

                userEmail:
                    req.user.email,

                property:
                    req.body.property,

                destination:
                    req.body.destination,

                customerName:
                    req.body.customerName,

                customerPhone:
                    req.body.customerPhone,

                checkIn:
                    req.body.checkIn,

                checkOut:
                    req.body.checkOut,

                guests:
                    req.body.guests,

                rooms:
                    req.body.rooms,

                publishedPrice:
                    req.body.publishedPrice,

                requestTime:
                    req.body.requestTime,

                status:
                    "Booking Request Received",

                createdAt:
                    new Date()

            };


            const result =
                await db
                    .collection(
                        "homestayBookings"
                    )
                    .insertOne(
                        bookingData
                    );


            console.log(
                "✅ Homestay Booking Saved in MongoDB"
            );

            console.log(
                "MongoDB ID:",
                result.insertedId
            );


            res.json({

                success: true,

                message:
                    "Homestay booking saved successfully!",

                id:
                    result.insertedId

            });


        } catch (error) {

            console.error(
                "❌ Homestay Booking Save Error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Homestay booking save nahi ho payi.",

                error:
                    error.message

            });

        }

    }
);


// =================================================
// GET LOGGED-IN USER'S HOMESTAY BOOKINGS
// =================================================

app.get(
    "/api/my-bookings",
    verifyToken,
    async (req, res) => {

        try {

            const bookings =
                await db
                    .collection(
                        "homestayBookings"
                    )
                    .find({

                        userId:
                            req.user.userId

                    })
                    .sort({

                        createdAt:
                            -1

                    })
                    .toArray();


            res.json({

                success: true,

                bookings:
                    bookings

            });


        } catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "❌ My Bookings Error:"
            );

            console.error(
                error.message
            );

            console.error(
                "================================="
            );


            res.status(500).json({

                success: false,

                message:
                    "Bookings load nahi ho paayi."

            });

        }

    }
);


// =================================================
// CANCEL HOMESTAY BOOKING
// =================================================

app.patch(
    "/api/booking/:bookingId/cancel",
    verifyToken,
    async (req, res) => {

        try {

            const bookingId =
                req.params.bookingId;


            const booking =
                await db
                    .collection(
                        "homestayBookings"
                    )
                    .findOne({

                        bookingId:
                            bookingId,

                        userId:
                            req.user.userId

                    });


            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Booking nahi mili."

                });

            }


            if (
                booking.status ===
                "CANCELLED"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Booking already cancelled hai."

                });

            }


            await db
                .collection(
                    "homestayBookings"
                )
                .updateOne(

                    {

                        bookingId:
                            bookingId,

                        userId:
                            req.user.userId

                    },

                    {

                        $set: {

                            status:
                                "CANCELLED",

                            cancelledAt:
                                new Date(),

                            cancellationReason:
                                req.body.reason ||
                                "Cancelled by user"

                        }

                    }

                );


            console.log(
                "❌ Booking Cancelled:",
                bookingId
            );


            res.json({

                success: true,

                message:
                    "Booking cancelled successfully!"

            });


        } catch (error) {

            console.error(
                "❌ Booking Cancellation Error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Booking cancel nahi ho paayi."

            });

        }

    }
);


// =================================================
// OWNER - BOOKING REQUESTS
// =================================================

app.get(
    "/api/owner/booking-requests",
    verifyToken,
    async (req, res) => {

        try {

            const userId =
                new ObjectId(
                    req.user.userId
                );


            const properties =
                await db
                    .collection(
                        "ownerApplications"
                    )
                    .find({

                        userId:
                            userId,

                        status:
                            "APPROVED"

                    })
                    .toArray();


            const propertyNames =
                properties.map(

                    property =>
                        property.propertyName

                );


            const bookings =
                await db
                    .collection(
                        "homestayBookings"
                    )
                    .find({

                        property: {

                            $in:
                                propertyNames

                        }

                    })
                    .sort({

                        createdAt:
                            -1

                    })
                    .toArray();


            res.json({

                success: true,

                bookings:
                    bookings

            });


        } catch (error) {

            console.error(
                "❌ Owner Booking Requests Error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Booking requests load nahi ho paayi."

            });

        }

    }
);


// =================================================
// OWNER - APPROVE BOOKING
// =================================================

app.patch(
    "/api/owner/booking-requests/:bookingId/approve",
    verifyToken,
    async (req, res) => {

        try {

            if (

                req.user.role ===
                "ADMIN"

                ||

                !ObjectId.isValid(
                    req.user.userId
                )

            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Owner access required."

                });

            }


            const userId =
                new ObjectId(
                    req.user.userId
                );


            const bookingId =
                req.params.bookingId;


            const properties =
                await db
                    .collection(
                        "ownerApplications"
                    )
                    .find({

                        userId:
                            userId,

                        status:
                            "APPROVED"

                    })
                    .toArray();


            const propertyNames =
                properties.map(

                    property =>
                        property.propertyName

                );


            const booking =
                await db
                    .collection(
                        "homestayBookings"
                    )
                    .findOne({

                        bookingId:
                            bookingId,

                        property: {

                            $in:
                                propertyNames

                        }

                    });


            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Booking nahi mili."

                });

            }


            if (

                booking.status ===
                "CONFIRMED"

                ||

                booking.status ===
                "REJECTED"

            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This booking has already been processed."

                });

            }


            await db
                .collection(
                    "homestayBookings"
                )
                .updateOne(

                    {

                        bookingId:
                            bookingId

                    },

                    {

                        $set: {

                            status:
                                "CONFIRMED",

                            ownerMessage:
                                "Your booking has been confirmed by the property owner.",

                            approvedAt:
                                new Date(),

                            approvedBy:
                                req.user.userId

                        },

                        $unset: {

                            ownerHidden:
                                "",

                            ownerHiddenAt:
                                ""

                        }

                    }

                );


            console.log(
                "✅ BOOKING APPROVED:",
                bookingId
            );


            res.json({

                success: true,

                message:
                    "Booking approved successfully."

            });


        } catch (error) {

            console.error(
                "❌ Booking Approval Error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Booking approve nahi ho paayi."

            });

        }

    }
);


// =================================================
// OWNER - REJECT BOOKING
// =================================================

app.patch(
    "/api/owner/booking-requests/:bookingId/reject",
    verifyToken,
    async (req, res) => {

        try {

            if (

                req.user.role ===
                "ADMIN"

                ||

                !ObjectId.isValid(
                    req.user.userId
                )

            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Owner access required."

                });

            }


            const userId =
                new ObjectId(
                    req.user.userId
                );


            const bookingId =
                req.params.bookingId;


            const properties =
                await db
                    .collection(
                        "ownerApplications"
                    )
                    .find({

                        userId:
                            userId,

                        status:
                            "APPROVED"

                    })
                    .toArray();


            const propertyNames =
                properties.map(

                    property =>
                        property.propertyName

                );


            const booking =
                await db
                    .collection(
                        "homestayBookings"
                    )
                    .findOne({

                        bookingId:
                            bookingId,

                        property: {

                            $in:
                                propertyNames

                        }

                    });


            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Booking nahi mili."

                });

            }


            if (

                booking.status ===
                "CONFIRMED"

                ||

                booking.status ===
                "REJECTED"

            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This booking has already been processed."

                });

            }


            await db
                .collection(
                    "homestayBookings"
                )
                .updateOne(

                    {

                        bookingId:
                            bookingId

                    },

                    {

                        $set: {

                            status:
                                "REJECTED",

                            ownerMessage:
                                "Room unavailable for the selected dates.",

                            rejectedAt:
                                new Date(),

                            rejectedBy:
                                req.user.userId,

                            ownerHidden:
                                true,

                            ownerHiddenAt:
                                new Date()

                        }

                    }

                );


            console.log(
                "❌ BOOKING REJECTED:",
                bookingId
            );


            res.json({

                success: true,

                message:
                    "Booking rejected successfully."

            });


        } catch (error) {

            console.error(
                "❌ Booking Rejection Error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Booking reject nahi ho paayi."

            });

        }

    }
);


// =================================================
// OWNER - DELETE BOOKING / NOTIFICATION
// =================================================

app.delete(
    "/api/owner/booking-requests/:bookingId",
    verifyToken,
    async (req, res) => {

        try {

            if (

                req.user.role ===
                "ADMIN"

                ||

                !ObjectId.isValid(
                    req.user.userId
                )

            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Owner access required."

                });

            }


            const userId =
                new ObjectId(
                    req.user.userId
                );


            const bookingId =
                req.params.bookingId;


            const properties =
                await db
                    .collection(
                        "ownerApplications"
                    )
                    .find({

                        userId:
                            userId,

                        status:
                            "APPROVED"

                    })
                    .toArray();


            const propertyNames =
                properties.map(

                    property =>
                        property.propertyName

                );


            const booking =
                await db
                    .collection(
                        "homestayBookings"
                    )
                    .findOne({

                        bookingId:
                            bookingId,

                        property: {

                            $in:
                                propertyNames

                        }

                    });


            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Booking nahi mili."

                });

            }


            const result =
                await db
                    .collection(
                        "homestayBookings"
                    )
                    .deleteOne({

                        _id:
                            booking._id

                    });


            if (
                result.deletedCount ===
                0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Booking delete nahi ho paayi."

                });

            }


            console.log(
                "================================="
            );

            console.log(
                "🗑️ OWNER BOOKING DELETED"
            );

            console.log(
                "Booking ID:",
                bookingId
            );

            console.log(
                "Property:",
                booking.property
            );

            console.log(
                "Customer:",
                booking.customerName
            );

            console.log(
                "Status:",
                booking.status
            );

            console.log(
                "================================="
            );


            res.json({

                success: true,

                message:
                    "Booking deleted successfully."

            });


        } catch (error) {

            console.error(
                "❌ Delete Owner Booking Error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Booking delete nahi ho paayi."

            });

        }

    }
);


// ===============================
// ADMIN - OWNER APPLICATIONS
// ===============================


// GET ALL OWNER APPLICATIONS

app.get(
    "/api/admin/owner-applications",
    verifyAdmin,
    async (req, res) => {

        try {

            const applications =
                await db
                    .collection(
                        "ownerApplications"
                    )
                    .find({})
                    .sort({
                        createdAt:
                            -1
                    })
                    .toArray();


            res.json({

                success: true,

                applications:
                    applications

            });


        } catch (error) {

            console.error(
                "❌ Admin Applications Error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Owner applications load nahi ho paayi."

            });

        }

    }
);


// ===============================
// APPROVE OWNER APPLICATION
// ===============================

app.patch(
    "/api/admin/owner-applications/:id/approve",
    verifyAdmin,
    async (req, res) => {

        try {

            const applicationId =
                new ObjectId(
                    req.params.id
                );


            const result =
                await db
                    .collection(
                        "ownerApplications"
                    )
                    .updateOne(

                        {
                            _id:
                                applicationId

                        },

                        {

                            $set: {

                                status:
                                    "APPROVED",

                                approvedAt:
                                    new Date()

                            }

                        }

                    );


            if (
                result.matchedCount ===
                0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Owner application nahi mili."

                });

            }


            console.log(
                "✅ Owner Application Approved:",
                req.params.id
            );


            res.json({

                success: true,

                message:
                    "Owner application approved successfully!"

            });


        } catch (error) {

            console.error(
                "❌ Approval Error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Application approve nahi ho payi."

            });

        }

    }
);


// ===============================
// REJECT OWNER APPLICATION
// ===============================

app.patch(
    "/api/admin/owner-applications/:id/reject",
    verifyAdmin,
    async (req, res) => {

        try {

            const applicationId =
                new ObjectId(
                    req.params.id
                );


            const result =
                await db
                    .collection(
                        "ownerApplications"
                    )
                    .updateOne(

                        {
                            _id:
                                applicationId

                        },

                        {

                            $set: {

                                status:
                                    "REJECTED",

                                rejectedAt:
                                    new Date()

                            }

                        }

                    );


            if (
                result.matchedCount ===
                0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Owner application nahi mili."

                });

            }


            console.log(
                "❌ Owner Application Rejected:",
                req.params.id
            );


            res.json({

                success: true,

                message:
                    "Owner application rejected successfully!"

            });


        } catch (error) {

            console.error(
                "❌ Rejection Error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Application reject nahi ho payi."

            });

        }

    }
);


// ===============================
// OWNER - MY PROPERTIES
// ===============================

app.get(
    "/api/owner/my-properties",
    verifyToken,
    async (req, res) => {

        try {

            const properties =
                await db
                    .collection(
                        "ownerApplications"
                    )
                    .find({

                        userId:
                            new ObjectId(
                                req.user.userId
                            )

                    })
                    .sort({

                        createdAt:
                            -1

                    })
                    .toArray();


            res.json({

                success: true,

                properties:
                    properties

            });


        } catch (error) {

            console.error(
                "❌ My Properties Error:"
            );

            console.error(
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Properties load nahi ho paayi."

            });

        }

    }
);


// ===============================
// ADMIN DELETE OWNER APPLICATION
// ===============================

app.delete(
    "/api/admin/owner-applications/:applicationId",
    verifyAdmin,
    async (req, res) => {

        try {

            const applicationId =
                req.params.applicationId;


            if (
                !ObjectId.isValid(
                    applicationId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid application ID."

                });

            }


            const result =
                await db
                    .collection(
                        "ownerApplications"
                    )
                    .deleteOne({

                        _id:
                            new ObjectId(
                                applicationId
                            )

                    });


            if (
                result.deletedCount ===
                0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Property application not found."

                });

            }


            console.log(
                "================================="
            );

            console.log(
                "🗑️ ADMIN DELETED PROPERTY APPLICATION"
            );

            console.log(
                "Application ID:",
                applicationId
            );

            console.log(
                "================================="
            );


            res.json({

                success: true,

                message:
                    "Property application deleted successfully."

            });


        } catch (error) {

            console.error(
                "❌ Admin Delete Application Error:",
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Property application delete nahi ho paayi."

            });

        }

    }
);


// =================================================
// PUBLIC APPROVED HOMESTAY PROPERTIES
// =================================================

app.get(
    "/api/public-homestays",
    async (req, res) => {

        try {

            const properties =
                await db
                    .collection(
                        "ownerApplications"
                    )
                    .find({

                        status:
                            "APPROVED",

                        source: {
                            $ne:
                                "HOMESTAY_FRONTEND"
                        }

                    })
                    .sort({

                        createdAt:
                            -1

                    })
                    .toArray();


            res.json({

                success: true,

                properties:
                    properties

            });


        } catch (error) {

            console.error(
                "❌ Public Homestay Properties Error:",
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Approved properties load nahi ho paayi."

            });

        }

    }
);


// =================================================
// ADMIN REQUESTS
// =================================================

app.get(
    "/api/admin/requests",
    async (req, res) => {

        try {

            // =========================
            // 🐯 SAFARI BOOKINGS
            // =========================

            const safariRequests =
                await db
                    .collection(
                        "permitApplications"
                    )
                    .find({

                        adminVisible:
                            {
                                $ne:
                                    false
                            }

                    })
                    .sort({

                        createdAt:
                            -1

                    })
                    .toArray();


            // =========================
            // 🌳 FOREST PERMITS
            // =========================

            const permitRequests =
                await db
                    .collection(
                        "applyPermitBookings"
                    )
                    .find({

                        adminVisible:
                            {
                                $ne:
                                    false
                            }

                    })
                    .sort({

                        createdAt:
                            -1

                    })
                    .toArray();


            console.log(
                "🌳 APPLY PERMIT DATA:",
                permitRequests
            );


            console.log(
                "🐯 Safari Requests:",
                safariRequests.length
            );


            console.log(
                "🌳 Permit Requests:",
                permitRequests.length
            );


            res.json({

                success:
                    true,

                safari:
                    safariRequests,

                permits:
                    permitRequests

            });


        } catch (error) {

            console.error(
                "❌ Admin request fetch error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Requests load nahi ho paayi."

            });

        }

    }
);


// =================================================
// ADMIN CONFIRM / REJECT / CANCEL / CLEAR
// =================================================

app.patch(
    "/api/admin/request/:type/:id",
    async (req, res) => {

        try {

            const {
                type,
                id
            } = req.params;


            const {
                action,
                reason
            } = req.body;


            let collectionName;


            if (
                type ===
                "safari"
            ) {

                collectionName =
                    "permitApplications";

            }

            else if (
                type ===
                "permit"
            ) {

                collectionName =
                    "applyPermitBookings";

            }

            else {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid request type."

                });

            }


            if (
                !ObjectId.isValid(id)
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid request ID."

                });

            }


            const collection =
                db.collection(
                    collectionName
                );


            const existingRequest =
                await collection
                    .findOne({

                        _id:
                            new ObjectId(id)

                    });


            if (!existingRequest) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "Request not found."

                });

            }


            // =========================
            // CONFIRM
            // =========================

            if (
                action ===
                "confirm"
            ) {

                const bookingId =

                    existingRequest.bookingId ||

                    "BETLA" +
                    Math.floor(
                        100000 +
                        Math.random() *
                        900000
                    );


                await collection
                    .updateOne(

                        {
                            _id:
                                new ObjectId(id)

                        },

                        {

                            $set: {

                                status:
                                    "CONFIRMED",

                                bookingId:
                                    bookingId,

                                adminVisible:
                                    true,

                                confirmedAt:
                                    new Date()

                            }

                        }

                    );


                return res.json({

                    success:
                        true,

                    message:
                        "Request confirmed successfully.",

                    bookingId:
                        bookingId

                });

            }


            // =========================
            // REJECT SAFARI
            // =========================

            if (
                action ===
                "reject"
            ) {

                await collection
                    .updateOne(

                        {
                            _id:
                                new ObjectId(id)

                        },

                        {

                            $set: {

                                status:
                                    "REJECTED",

                                rejectionReason:
                                    reason ||
                                    "Request rejected by admin.",

                                rejectedAt:
                                    new Date(),

                                adminVisible:
                                    false

                            }

                        }

                    );


                return res.json({

                    success:
                        true,

                    message:
                        "Safari booking rejected successfully."

                });

            }


            // =========================
            // CANCEL FOREST PERMIT
            // =========================

            if (
                action ===
                "cancel"
            ) {

                if (
                    type !==
                    "permit"
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        message:
                            "Cancel action is only for Forest Permit."

                    });

                }


                if (!reason) {

                    return res.status(400).json({

                        success:
                            false,

                        message:
                            "Cancellation reason required."

                    });

                }


                await collection
                    .updateOne(

                        {
                            _id:
                                new ObjectId(id)

                        },

                        {

                            $set: {

                                status:
                                    "CANCELLED",

                                cancellationReason:
                                    reason,

                                cancelledAt:
                                    new Date(),

                                adminVisible:
                                    false

                            }

                        }

                    );


                return res.json({

                    success:
                        true,

                    message:
                        "Forest permit cancelled."

                });

            }


            // =========================
            // CLEAR FROM ADMIN PANEL
            // =========================

            if (
                action ===
                "clear"
            ) {

                await collection
                    .updateOne(

                        {
                            _id:
                                new ObjectId(id)

                        },

                        {

                            $set: {

                                adminVisible:
                                    false,

                                clearedAt:
                                    new Date()

                            }

                        }

                    );


                return res.json({

                    success:
                        true,

                    message:
                        "Request cleared from admin panel."

                });

            }


            return res.status(400).json({

                success:
                    false,

                message:
                    "Invalid action."

            });


        } catch (error) {

            console.error(
                "❌ Admin action error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Admin action failed."

            });

        }

    }
);


// =================================================
// SAFARI + FOREST PERMIT HISTORY BY EMAIL
// =================================================

app.get(
    "/api/my-bookings",
    async (req, res) => {

        try {

            const email =
                String(
                    req.query.email ||
                    ""
                )
                    .toLowerCase()
                    .trim();


            if (!email) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Email required."

                });

            }


            const safariBookings =
                await db
                    .collection(
                        "permitApplications"
                    )
                    .find({

                        visitorEmail:
                            email

                    })
                    .sort({

                        createdAt:
                            -1

                    })
                    .toArray();


            const permitBookings =
                await db
                    .collection(
                        "applyPermitBookings"
                    )
                    .find({

                        visitorEmail:
                            email

                    })
                    .sort({

                        createdAt:
                            -1

                    })
                    .toArray();


            res.json({

                success:
                    true,

                safari:
                    safariBookings,

                permits:
                    permitBookings

            });


        } catch (error) {

            console.error(
                "❌ My bookings error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Unable to load booking history."

            });

        }

    }
);


// ===============================
// START SERVER
// ===============================

async function startServer() {

    try {

        await connectDB();


        app.listen(
            5000,
            () => {

                console.log(
                    "================================="
                );

                console.log(
                    "🚀 Server Started Successfully"
                );

                console.log(
                    "🌐 http://localhost:5000"
                );

                console.log(
                    "================================="
                );

            }
        );


    } catch (error) {

        console.error(
            "❌ Server failed to start:"
        );

        console.error(
            error.message
        );

    }

}


startServer();