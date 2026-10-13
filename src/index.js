
import 'dotenv/config'
import { app } from './app.js'
import connectDB from './db/index.js'


connectDB()
.then(()=>{
   app.listen(process.env.PORT|| 8000, ()=>{
    console.log("SUCCESSFULL on port :", process.env.PORT);
    
   })       
})
.catch((err)=>{
  console.error("MongoDB error");
  
})
app.get("/", (req, res) => {
    res.send("Backend is working!");
});

// import mongoose from 'mongoose'
// import {db_name} from './constants.js'

// import express from 'express'
// const app = express();
// (async ()=>{
// try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${db_name}`)
//     app.on("error", (error)=>{
//         console.error("Error; ", error);
//         throw error;
//     })

//     app.listen(process.env.PORT, ()=>{
//         console.log("server is on port: ", process.env.PORT);
        
//     })
// } catch (error) {
//     console.error("error", error)
// }
// })()