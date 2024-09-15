import express from "express";
import { setCookie, getCookie, deleteCookie } from "../controllers/cookieController.js"; // Updated import

const router = express.Router();

router.post("/cookie", setCookie);
router.get("/cookie", getCookie);
router.delete("/cookie", deleteCookie);

export default router;
