import { Router } from "express";
import { User } from "../models/users.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

export const usersRouter = Router();

export const tokens = new Map();

usersRouter.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  const existingUser = await User.findOne({ where: { username } });
  if (existingUser) {
    return res.status(409).json({ error: "Username already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hashedPassword });
  return res.status(201).json({ id: user.id, username: user.username });
});

usersRouter.post("/signin", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  const user = await User.findOne({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = crypto.randomUUID();
  tokens.set(token, user.id);
  return res.json({ token });
});

usersRouter.post("/signout", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = auth.split(" ")[1];
  if (!tokens.has(token)) {
    return res.status(401).json({ error: "Invalid token" });
  }

  tokens.delete(token);
  return res.json({ message: "User signed out" });
});

usersRouter.get("/me", async (req, res) => {
  const userId = req.user.id;
  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ id: user.id, username: user.username });
});

// Get all users for gallery selection
usersRouter.get("/", async (req, res) => {
  const users = await User.findAll({
    attributes: ["id", "username"],
    order: [["username", "ASC"]],
  });
  return res.json(users);
});
