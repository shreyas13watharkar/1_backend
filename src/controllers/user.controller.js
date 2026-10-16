
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

 const generateAccessAndRefreshTokens = async (userId) => {
        try {
            const currUser = await User.findById(userId);

            const accessToken = currUser.generateAccessToken();
            const refreshToken = currUser.generateRefreshToken();

            currUser.refreshToken = refreshToken;
            await currUser.save({ validateBeforeSave: false });

            return { accessToken, refreshToken };
        } catch (error) {
            throw new ApiError(
                500,
                "Something went wrong while generating tokens"
            );
        }
    };

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, fullName, password } = req.body;

    if ([username, email, fullName, password].some(
        (field) => !field?.trim()
    )) {
        throw new ApiError(400, "All fields are required");
    }

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

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    console.log("Avatar local path:", avatarLocalPath);
    console.log("Cover image local path:", coverImageLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar?.secure_url) {
        throw new ApiError(500, "Failed to upload avatar to Cloudinary");
    }

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

    const user = await User.create({
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        password,
        avatar: avatar.secure_url,
        coverImage: coverImage?.secure_url || ""
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User registered successfully"
        )
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if ((!username?.trim() && !email?.trim()) || !password?.trim()) {
        throw new ApiError(
            400,
            "Username or email and password are required"
        );
    }

    const user = await User.findOne({
        $or: [
            ...(username?.trim()
                ? [{ username: username.trim().toLowerCase() }]
                : []),
            ...(email?.trim()
                ? [{ email: email.trim().toLowerCase() }]
                : [])
        ]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect password");
    }

   

    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    const loggedUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"   
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { user: loggedUser },
                "User logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    console.log("Authenticated user ID:", req.user?._id);

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 }
        },
        {
            new: true
        }
    );

    if (!updatedUser) {
        throw new ApiError(404, "User not found in database");
    }

    console.log("User ID updated:", updatedUser._id);
    console.log(
        "Refresh token after logout:",
        updatedUser.refreshToken
    );

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    };

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"
            )
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
      const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
         
        if(!incomingRefreshToken){
            throw new ApiError(401, "unautharized req");     
        }
        
       const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

       if(!decodedToken)
{
    throw new ApiError(401 ,"Not Valid User");
    
}
       const user = await User.findById(decodedToken?._id)

       if(!user){
        throw new ApiError(401, "invalid user");
        
       }



       if(incomingRefreshToken!==user?.refreshToken){
        throw new ApiError("Expired token");
        
       }

       const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    };

      const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

      return res.status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("newRefreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(
            200, 
            {accessToken, refreshToken: refreshToken},
              "Token refreshed Successfully"
        )
      )

        
})    

const updateAccountDetails = asyncHandler(async (req, res) => {
      const {fullName, email}  =  req.body

      if(!fullName || !email){
        throw new ApiError(401, "all fields are required");
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase()
        },
        {
            new: true
        }

      ).select("-password -refreshToken")

      if(!user){
        throw new ApiError(401, "user not found");
      }

      res.status(200).json(
        new ApiResponse(
            200, user, "Account details updated successfully"
        )
      )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user?._id

    res.status(200).
    json(
        new ApiResponse(
            200, user, "Current user fetched successfully"
        )
    )
})

const updatePassword = asyncHandler(async (req, res) => {
    const {currentPassword, newPassword} = req.body

    if(!currentPassword || !newPassword){
        throw new ApiError(400, "Both current and new passwords are required");
    }

    const user = await User.findById(req.user._id)

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid= await user.isPasswordCorrect(currentPassword)
    
    if(!isPasswordValid){
        throw new ApiError(401, "Current password is incorrect");
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    res.status(200).json(
        new ApiResponse(
            200, {}, "Password updated successfully"
        )
    )
})


const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar?.secure_url) {
        throw new ApiError(
            500,
            "Failed to upload avatar to Cloudinary"
        );
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.secure_url
            }
        },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            { user },
            "Avatar updated successfully"
        )
    );
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is required");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage?.secure_url) {
        throw new ApiError(
            500,
            "Failed to upload cover image to Cloudinary"
        );
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.secure_url
            }
        },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            { user },
            "Cover image updated successfully"
        )
    );
});


export { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, updatePassword, updateAccountDetails, updateUserAvatar, updateUserCoverImage };
