import {db_name} from '../constants.js'
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const connectedInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${db_name}`)
         console.log("MongoDb connected successfully ON HOST : ", connectedInstance.connection.host );
         
    } catch (error) {
        console.error("MongoDB connecton failed : ", error);
        process.exit(1);
    }
}

export default connectDB;