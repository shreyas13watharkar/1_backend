import {Router} from 'express'
import { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, updatePassword, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from '../controllers/user.controller.js'
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router()

router.route("/register").post(
      upload.fields([
           {
               name: "avatar",
               maxCount:1
           },
           {
              name:"coverImage",
              maxCount:1
           }
      ]),    
    registerUser
);

router.route("/login").post(loginUser)


router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refreshAccessToken").post(refreshAccessToken)

router.route("/profile").get(verifyJWT, getCurrentUser)


router.route("/updatePassword").post(verifyJWT, updatePassword)
router.route("/updateAccountDetails").post(verifyJWT, updateAccountDetails)
router.route("/updateAvatar").post(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/updateCoverImage").post(verifyJWT, upload.single("coverImage"), updateUserCoverImage)



export default router 