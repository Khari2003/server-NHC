const multer = require("multer");
const express = require("express");
const { readMenuFromBoundingBoxes } = require("../controller/ocrMenu.controller.js");

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post("/menu", upload.single("image"), readMenuFromBoundingBoxes);

module.exports = router; 