import Search from "../models/Search.js";

export const getAllSearchData = async (req, res, next) => {
    const userId = req.userId;

    try {
        const searchData = await Search.find({userId});
        return res.status(200).json({
            success: true,
            searchData
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong!"
        })
    }
}