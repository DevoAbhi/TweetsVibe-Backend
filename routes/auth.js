import express from "express";
const router = express.Router();

import { postSignUp, postLogin } from "../controllers/auth.js";
import authMiddleware from '../middleware/auth.js';

router.post('/signup', postSignUp)
router.post('/login', postLogin)

export default router;