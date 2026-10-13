
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // 1. Get registration fields from the request body
    const { username, email, fullName, password } = req.body;
    
    // 2. Validate required fields
    if ([username, email, fullName, password].some(
        (field) => !field?.trim()
    )) {
        throw new ApiError(400, "All fields are required");
    }

    // 3. Check whether the user already exists
    const existedUser = await User.findOne({
        $or: [
            { email: email.trim().toLowerCase() },
            { username: username.trim().toLowerCase() }
        ]
    });

    if (existedUser) {
        throw new ApiError(
            409,
            "User with this email or username already exists"
        );
    }

    // 4. Get uploaded file paths from Multer
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    console.log("Avatar local path:", avatarLocalPath);
    console.log("Cover image local path:", coverImageLocalPath);

    // 5. Avatar is mandatory
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // 6. Upload avatar to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar?.secure_url) {
        throw new ApiError(500, "Failed to upload avatar to Cloudinary");
    }

    // 7. Upload cover image if provided
    let coverImage = null;

    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!coverImage?.secure_url) {
            throw new ApiError(
                500,
                "Failed to upload cover image to Cloudinary"
            );
        }
    }

    console.log("Avatar URL:", avatar.secure_url);
    console.log("Cover image URL:", coverImage?.secure_url || "");

    // 8. Create the user in MongoDB
    const user = await User.create({
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        password,
        avatar: avatar.secure_url,
        coverImage: coverImage?.secure_url || ""
    });

    // 9. Fetch the created user without sensitive fields
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }

    // 10. Send the successful response
    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User registered successfully"
        )
    );
});

export { registerUser };
