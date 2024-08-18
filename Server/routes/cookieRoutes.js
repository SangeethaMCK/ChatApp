// routes/cookieRoutes.js
const express = require("express");
const router = express.Router();
const cookieController = require("../controllers/cookieController");

router.post("/cookie", cookieController.setCookie);
router.get("/cookie", cookieController.getCookie);
router.delete("/cookie", cookieController.deleteCookie);

module.exports = router;
