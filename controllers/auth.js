//import dependancies
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

//import models
import User from '../models/User.js';

dotenv.config();

export const postSignUp = async (req, res, next) => {

    try {
        const { email, password } = req.body;

        if (!(email && password )) {
            return res.status(400).json({
                success: false,
                message: "Please send all the details"
            })
        }



        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(200).json({
                    success: true,
                    message: "User is already registered"
                })
            }
        }
        catch (err) {
            console.log(err);
            return res.status(500).json({
                success: false,
                message: err.message
            })
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            email,
            password: hashedPassword
        });


        const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET, { expiresIn: '2hr' });
        user.password = undefined;

        console.log("User registered");

        return res.status(200).json({
            success: true,
            message: "User has been registered",
            user,
            token
        })

    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!"
        })
    }
}


export const postLogin = async (req, res, next) => {

    try {
        const { email, password } = req.body;
        if (!(email && password)) {
            return res.status(400).json({
                success: false,
                message: "Please send all the details"
            })
        }

        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "User does not exists!"
            })
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Password entered is incorrect!"
            })
        }

        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '2hr' });
        console.log("User logged in")
        existingUser.password = undefined;

        return res.status(200).json({
            success: true,
            message: "User logged in!",
            user: existingUser,
            token
        })
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!"
        })
    }

}

export const postUpdateUser = async (req, res, next) => {
    const {physicalDimensions, location, age, gender, skinTone, season} = req.body;
    const userId = req.userId;

    const user = await User.findOne({_id: userId});

    if(!userId) {
        return res.status(400).json({
            success: false,
            message: "User is not logged in!"
        })
    }

    let query = {};

    if(physicalDimensions) {

        query.physicalDimensions = {...user.physicalDimensions, ...physicalDimensions}
    }
    if(location) {
        query.location = location;
    }
    if(age) {
        query.age = age;
    }
    if(gender) {
        query.gender = gender
    }
    if(skinTone) {
        query.skinTone = skinTone
    }
    if(season) {
        query.season = season
    }

    try {
        const updatedUser = await User.updateOne({_id: userId}, {$set: {...query}});
        console.log("User updated with query: ", query);
        return res.status(200).json({
            success: true,
            message: "User updated"
        })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Something went wrong!"
        })
    }
}