import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Requiring dependancies
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Routes imports
import authRoutes from './routes/auth.js';
import scrapRoutes from './routes/twitterScrapper.js';


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-AUTH-TOKEN");
    res.setHeader("Access-Control-Allow-Methods",
        "GET, POST, PATCH,PUT, DELETE,OPTIONS");

    next();
});

//use the routes
app.use('/api',authRoutes);
app.use('/api',scrapRoutes);


mongoose.connect(process.env.MONGODB_URI,
    { useUnifiedTopology: true, useNewUrlParser: true }
)
    .then(result => {
        console.log("Database has been connected successfully!")

    })
    .catch(err => {
        console.log("Could not connect to the Database!")
        console.log(err)
    })


export default app;