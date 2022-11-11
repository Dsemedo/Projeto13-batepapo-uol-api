import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";

const app = express();

dotenv.config();
app.use(cors());
app.use(express.json());
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

await mongoClient.connect();
db = mongoClient.db("batePapoUol");

const userSchema = joi.object({ name: joi.string().min(2).required() });

const messageSchema = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.required(),
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
    const errors = validation.error.details.map((e) => e.message);
    res.status(422).send(errors);
    return;
  }

  try {
    const participants = await db.collection("participants").find().toArray();

    if (participants.find((p) => p.name === name)) {
      res.sendStatus(409);
      return;
    }

    await db.collection("participants").insertOne({
      name,
      lastStatus: Date.now(),
    });

    await db.collection("messages").insertOne({
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: now,
    });
    res.status(201).send("Criado com sucesso");
  } catch (err) {
    console.log(err);
    res.status(400);
  }
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const { user } = req.headers;
  const now = dayjs().locale("pt-br").format("HH:mm:ss");

  console.log(req.headers);

  const validation = messageSchema.validate(req.body, {
    abortEarly: false,
  });

  if (validation.error) {
    const errors = validation.error.details.map((e) => e.message);
    res.status(422).send(errors);
    return;
  }

  if (type !== "private_message" && type !== "message") {
    res.sendStatus(422);
    return;
  }

  try {
    await db
      .collection("messages")
      .insertOne({ from: user, to, text, type, time: now });
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
});

app.listen(5000, () => {
  console.log("Server running in port: 5000");
});
