import "dotenv/config";
import express from 'express';
import cors from  'cors';
import chatRoutes from "./routes/chat.routes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/chat', chatRoutes);
app.use('/health', (req, res) => {
    res.json({ status: "ok" });
});

const server = app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default server;