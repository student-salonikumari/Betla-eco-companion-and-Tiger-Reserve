/*const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();

router.post("/apply", async (req, res) => {
    try {

        const db = req.app.locals.db;

        const {
            ownerName,
            propertyName,
            email,
            mobile,
            location,
            address,
            password
        } = req.body;

        // Basic validation
        if (
            !ownerName ||
            !propertyName ||
            !email ||
            !mobile ||
            !location ||
            !address ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const cleanEmail = email.toLowerCase().trim();

        // Check existing user
        const existingUser = await db
            .collection("users")
            .findOne({
                email: cleanEmail
            });

        let userId;

        // =================================================
        // CASE 1: EMAIL ALREADY REGISTERED
        // =================================================

        if (existingUser) {

            userId = existingUser._id;

            console.log("✅ Existing user found:");
            console.log(cleanEmail);

        }

        // =================================================
        // CASE 2: NEW EMAIL
        // =================================================

        else {

            // Hash password only for new user
            const hashedPassword =
                await bcrypt.hash(password, 10);

            const newUser = {
                name: ownerName.trim(),
                email: cleanEmail,
                password: hashedPassword,
                role: "USER",
                createdAt: new Date()
            };

            const userResult = await db
                .collection("users")
                .insertOne(newUser);

            userId = userResult.insertedId;

            console.log("✅ New owner user account created:");
            console.log(cleanEmail);
        }

        // =================================================
        // SAVE OWNER APPLICATION
        // =================================================

        // ================= PROPERTY NUMBER =================

      const existingPropertyCount = await db
    .collection("ownerApplications")
    .countDocuments({
        userId: userId
    });

   const propertyNumber = existingPropertyCount + 1;

   const propertyLabel = `Property ${propertyNumber}`;


    const ownerApplication = {

        propertyNumber: propertyNumber,
    propertyLabel: propertyLabel,

    userId: userId,

    ownerName: ownerName.trim(),

    propertyName: propertyName.trim(),

    email: cleanEmail,

    mobile: mobile.trim(),

    location: location.trim(),

    propertyType: req.body.propertyType || "",

    roomTypes: req.body.roomTypes || "",

    availableRooms: Number(req.body.availableRooms) || 0,

    address: address.trim(),

    languages: req.body.languages || "",

    about: req.body.about || "",

    status: "PENDING",

    createdAt: new Date()
};


        const applicationResult = await db
            .collection("ownerApplications")
            .insertOne(ownerApplication);

        console.log("=================================");
        console.log("🏠 OWNER APPLICATION RECEIVED");
        console.log("Property:", propertyName);
        console.log("Owner:", ownerName);
        console.log("Email:", cleanEmail);
        console.log("Status: PENDING");
        console.log("=================================");

        // =================================================
        // SUCCESS RESPONSE
        // =================================================

        res.json({

            success: true,

            message:
                "Property application submitted successfully! Please wait for admin approval.",

            applicationId:
                applicationResult.insertedId,

            userId: userId
        });

    }

    catch (error) {

        console.error("❌ Owner Application Error:");
        console.error(error.message);

        res.status(500).json({

            success: false,

            message:
                "Owner application submit nahi ho payi."
        });
    }
});

module.exports = router;*/

const express = require("express");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");
const verifyToken = require("./authMiddleware");

const router = express.Router();


// =================================================
// OWNER PROPERTY REGISTRATION
// =================================================

router.post("/apply", async (req, res) => {
    try {

        const db = req.app.locals.db;

        const {
            ownerName,
            propertyName,
            email,
            mobile,
            location,
            address,
            password
        } = req.body;


        // Basic validation
        if (
            !ownerName ||
            !propertyName ||
            !email ||
            !mobile ||
            !location ||
            !address ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }


        const cleanEmail = email.toLowerCase().trim();


        // =================================================
        // CHECK EXISTING USER
        // =================================================

        const existingUser = await db
            .collection("users")
            .findOne({
                email: cleanEmail
            });

        let userId;


        // =================================================
        // EXISTING USER
        // =================================================

        if (existingUser) {

            userId = existingUser._id;

            console.log("✅ Existing user found:");
            console.log(cleanEmail);

        }


        // =================================================
        // NEW USER
        // =================================================

        else {

            const hashedPassword =
                await bcrypt.hash(password, 10);

            const newUser = {
                name: ownerName.trim(),
                email: cleanEmail,
                password: hashedPassword,
                role: "USER",
                createdAt: new Date()
            };

            const userResult = await db
                .collection("users")
                .insertOne(newUser);

            userId = userResult.insertedId;

            console.log("✅ New owner user account created:");
            console.log(cleanEmail);
        }


        // =================================================
        // PROPERTY NUMBER
        // =================================================

        const existingPropertyCount = await db
            .collection("ownerApplications")
            .countDocuments({
                userId: userId
            });

        const propertyNumber = existingPropertyCount + 1;

        const propertyLabel = `Property ${propertyNumber}`;


        // =================================================
        // OWNER APPLICATION
        // =================================================

        const ownerApplication = {

            propertyNumber: propertyNumber,

            propertyLabel: propertyLabel,

            userId: userId,

            ownerName: ownerName.trim(),

            propertyName: propertyName.trim(),

            email: cleanEmail,

            mobile: mobile.trim(),

            location: location.trim(),

            propertyType: req.body.propertyType || "",

            roomTypes: req.body.roomTypes || "",

            availableRooms:
                Number(req.body.availableRooms) || 0,

            pricePerNight:
               Number(req.body.pricePerNight) || 0,

            address: address.trim(),

            languages: req.body.languages || "",

            about: req.body.about || "",

            status: "PENDING",

            createdAt: new Date()
        };


        const applicationResult = await db
            .collection("ownerApplications")
            .insertOne(ownerApplication);


        console.log("=================================");
        console.log("🏠 OWNER APPLICATION RECEIVED");
        console.log("Property:", propertyName);
        console.log("Owner:", ownerName);
        console.log("Email:", cleanEmail);
        console.log("Status: PENDING");
        console.log("=================================");


        res.json({

            success: true,

            message:
                "Property application submitted successfully! Please wait for admin approval.",

            applicationId:
                applicationResult.insertedId,

            userId: userId
        });

    }

    catch (error) {

        console.error("❌ Owner Application Error:");
        console.error(error.message);

        res.status(500).json({

            success: false,

            message:
                "Owner application submit nahi ho payi."
        });
    }
});

// =================================================
// GET MY REGISTERED PROPERTIES
// =================================================

router.get("/my-properties", verifyToken, async (req, res) => {

    try {

        const db = req.app.locals.db;

        const properties = await db
            .collection("ownerApplications")
            .find({
                userId: new ObjectId(req.user.userId)
            })
            .sort({ createdAt: -1 })
            .toArray();

        res.json({
            success: true,
            properties: properties
        });

    } catch (error) {

        console.error("❌ My Properties Error:");
        console.error(error.message);

        res.status(500).json({
            success: false,
            message: "Properties load nahi ho paayi."
        });

    }

});


// =================================================
// OWNER REMOVE PROPERTY
// =================================================

router.delete("/property/:id", verifyToken, async (req, res) => {

    try {

        const db = req.app.locals.db;

        const propertyId = req.params.id;


        // Check MongoDB ID
        if (!ObjectId.isValid(propertyId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid property ID."
            });

        }


        const applicationId =
            new ObjectId(propertyId);


        // =================================================
        // FIND PROPERTY
        // =================================================

        const property = await db
            .collection("ownerApplications")
            .findOne({
                _id: applicationId
            });


        if (!property) {

            return res.status(404).json({
                success: false,
                message: "Property nahi mili."
            });

        }


        // =================================================
        // OWNER SECURITY CHECK
        // =================================================

        if (
            property.userId.toString() !==
            req.user.userId
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "You can remove only your own property."
            });

        }


        // =================================================
        // ALREADY REMOVED
        // =================================================

        if (property.status === "REMOVED") {

            return res.status(400).json({
                success: false,
                message:
                    "This property is already removed."
            });

        }


        // =================================================
        // REMOVE PROPERTY
        // =================================================

        await db
            .collection("ownerApplications")
            .updateOne(

                {
                    _id: applicationId,
                    userId: property.userId
                },

                {
                    $set: {

                        status: "REMOVED",

                        removedAt: new Date(),

                        removedBy: "OWNER"

                    }
                }
            );


        console.log("=================================");
        console.log("🗑️ PROPERTY REMOVED BY OWNER");
        console.log("Property:", property.propertyName);
        console.log("Owner:", property.ownerName);
        console.log("Property ID:", propertyId);
        console.log("=================================");


        res.json({

            success: true,

            message:
                "Your property has been removed successfully."

        });

    }

    catch (error) {

        console.error("❌ Remove Property Error:");
        console.error(error.message);

        res.status(500).json({

            success: false,

            message:
                "Property remove nahi ho payi."

        });

    }

});
// =================================================
// IMPORT FRONTEND HOMESTAY PROPERTIES
// =================================================

router.post("/import-frontend-properties", verifyToken, async (req, res) => {

    try {

        const db = req.app.locals.db;

        // Admin account se frontend properties import nahi hongi
        if (req.user.role === "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Admin account cannot import owner properties."
            });
        }

        // Logged-in user ID
        if (!ObjectId.isValid(req.user.userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user account."
            });
        }

        const userId = new ObjectId(req.user.userId);

        // Logged-in user's actual account information
        const user = await db
            .collection("users")
            .findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        const properties = req.body.properties;

        if (!Array.isArray(properties) || properties.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No frontend properties received."
            });
        }

        let imported = 0;
        let alreadyExists = 0;

        for (const property of properties) {

            if (!property.name) {
                continue;
            }

            // Same property ko baar-baar duplicate hone se rokega
            const existingProperty = await db
                .collection("ownerApplications")
                .findOne({
                    userId: userId,
                    source: "HOMESTAY_FRONTEND",
                    sourcePropertyName: property.name
                });

            if (existingProperty) {
                alreadyExists++;
                continue;
            }

            // Existing properties count
            const propertyCount = await db
                .collection("ownerApplications")
                .countDocuments({
                    userId: userId
                });

            const propertyNumber = propertyCount + 1;

            let propertyType = "Hotel";

            if (property.type) {
                const type = property.type.toLowerCase();

                if (type.includes("resort")) {
                    propertyType = "Resort";
                } else if (type.includes("government")) {
                    propertyType = "Government Stay";
                } else if (type.includes("guest")) {
                    propertyType = "Guest House";
                }
            }

            const ownerProperty = {

                propertyNumber: propertyNumber,

                propertyLabel: `Property ${propertyNumber}`,

                userId: userId,

                // Name automatically logged-in account se
                ownerName: user.name || "Website Owner",

                email: user.email,

                propertyName: property.name,

                propertyType: propertyType,

                location:
                    property.destination === "betla"
                        ? "Betla"
                        : "Netarhat",

                address:
                    property.destination === "betla"
                        ? "Betla, Palamu, Jharkhand"
                        : "Netarhat, Latehar, Jharkhand",

                mobile: "",

                roomTypes: "",

                availableRooms: 0,

                about: property.description || "",

                rating: property.rating || 0,

                reviews: property.reviews || 0,

                price: property.price || 0,

                priceText: property.priceText || "",

                image: property.image || "",

                destination: property.destination || "",

                // Important: frontend se imported property
                source: "HOMESTAY_FRONTEND",

                sourcePropertyName: property.name,

                // Demo owner properties directly dashboard mein active
                status: "APPROVED",

                createdAt: new Date(),

                importedAt: new Date()

            };

            await db
                .collection("ownerApplications")
                .insertOne(ownerProperty);

            imported++;

        }

        console.log("=================================");
        console.log("🏨 FRONTEND PROPERTIES IMPORTED");
        console.log("Owner:", user.name);
        console.log("Email:", user.email);
        console.log("Imported:", imported);
        console.log("Already Exists:", alreadyExists);
        console.log("=================================");

        res.json({

            success: true,

            message: "Frontend properties registered successfully.",

            imported: imported,

            alreadyExists: alreadyExists,

            ownerName: user.name,

            totalProperties: imported + alreadyExists

        });

    } catch (error) {

        console.error("❌ Frontend Property Import Error:");
        console.error(error.message);

        res.status(500).json({

            success: false,

            message: "Frontend properties register nahi ho paayi."

        });

    }

});


module.exports = router;