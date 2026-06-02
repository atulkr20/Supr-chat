import express from 'express';
import cors from  'cors';
import dotenv from  'dotenv';
import chatRoutes from "./routes/chat.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/chat', chatRoutes);
app.use('/health', (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
})