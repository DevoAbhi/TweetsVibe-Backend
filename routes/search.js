import express from "express";
const router = express.Router();

import { getAllSearchData } from "../controllers/search.js";
import authMiddleware from '../middleware/auth.js';

router.get('/search-data', authMiddleware, getAllSearchData)

export default router;