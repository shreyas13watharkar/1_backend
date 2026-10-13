import mongoose, {Schema} from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userschema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true, 
        trim: true,
        index: true  //useful for searching
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true, 
        trim: true, 
    },
    fullName:{
        type:String,
        required:true, 
        trim: true, 
        index: true
    },
    avatar:{
        type:String,
    },
    coverImage:{
        type:String,
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type: String,
        required: [true, 'Password is req']
    },
    refreshToken:{
        type:String
    }
},{timestamps: true})


userschema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});


userschema.methods.isPasswordCorrect= async function(password) {
     return await bcrypt.compare(password, this.password)
}

userschema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)
}
userschema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User = mongoose.model("User", userschema)