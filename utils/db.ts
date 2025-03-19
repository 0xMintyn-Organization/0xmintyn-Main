import mongoose, { set } from 'mongoose';
require('dotenv').config();

const dbURL: string = process.env.DB_URI || '';

const connectDB = async () => {
    try {
        await mongoose.connect(dbURL).then((data:any) => {
            console.log(`MongoDB connected with ${data.connection.host} `);

        }
        );
    } catch (err:any) {
        console.error(err.message);
        setTimeout(connectDB, 5000);
    }
    }
    export { connectDB };