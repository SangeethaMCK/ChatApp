// routes/cookieRoutes.js
const express = require("express");
const router = express.Router();
const cookieController = require("../controllers/cookieController");

router.post("/set-cookie", cookieController.setCookie);
router.get("/get-cookie", cookieController.getCookie);
router.delete("/delete-cookie", cookieController.deleteCookie);

module.exports = router;
