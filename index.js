import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";

const app = express();

const now = dayjs().locale("pt-br").format("HH:mm:ss");
console.log(now);

dotenv.config();

app.use(cors());
app.use(express.json());
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

await mongoClient.connect();
db = mongoClient.db("batePapoUol");

const userSchema = joi.string().min(2).required();

const messageSchema = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.alternatives().try("private_message", "message"),
  from: joi.string().email().required(),
});

app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    res.send(participants);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.get("/messages", async (req, res) => {
  try {
    const messages = await db.collection("messages").find().toArray();
    console.log(messages);
    res.send(messages);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/participants", async (req, res) => {
  const { name } = req.body;

  const validation = userSchema.validate(name);
  if (validation.error) {
    console.log(validation.error.details);
  }

  try {
    await db.collection("participants").insertOne({
      name,
      lastStatus: Date.now(),
    });
    res.status(201).send("Criado com sucesso");
  } catch (err) {
    console.log(err);
    res.status(400);
  }
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.params;

  const validation = messageSchema.validate((to, text, type), {
    abortEarly: true,
  });

  if (validation.error) {
    res.sendStatus(422);
    return;
  }

  try {
    await db.collection("messages").insertOne({ to, text, type, time: now });
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
});

app.listen(5000, () => {
  console.log("Server running in port: 5000");
});
