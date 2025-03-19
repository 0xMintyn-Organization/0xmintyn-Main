import { app } from "./app";
import { connectDB } from "./utils/db";
require ('dotenv').config();
import http from 'http';
const server = http.createServer(app);

// create server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
  connectDB();
});