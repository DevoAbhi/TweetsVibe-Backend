import express from "express";
const router = express.Router();

import { postScrapper } from "../controllers/twitterScrapper.js";
import authMiddleware from '../middleware/auth.js';

router.post('/scrap-twitter', authMiddleware, postScrapper)

export default router;