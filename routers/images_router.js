import { Router } from "express";
import { Image } from "../models/images.js";
import { Comment } from "../models/comments.js";
import { User } from "../models/users.js";
import multer from "multer";
import path from "path";

export const imagesRouter = Router();
const upload = multer({ dest: "uploads/" });

imagesRouter.post("/", upload.single("picture"), async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!req.file || !req.body.title) {
    return res.status(422).json({ error: "Missing input parameters." });
  }
  try {
    const user = await User.findByPk(req.user.id);
    const img = await Image.create({
      title: req.body.title,
      author: user.username,
      image: req.file,
      UserId: req.user.id,
    });
    return res.json({ id: img.id });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res.status(422).json({ error: "Invalid data provided." });
    } else {
      return res.status(400).json({ error: "Cannot save image." });
    }
  }
});

// get ids of all images, use this to control indexing in apiservice
imagesRouter.get("/", async (req, res) => {
  const { userId } = req.query;
  const whereClause = userId ? { UserId: parseInt(userId) } : {};

  const images = await Image.findAll({
    attributes: ["id"],
    where: whereClause,
    order: [["createdAt", "ASC"]],
  });
  return res.json(images.map((img) => img.id));
});

imagesRouter.get("/:imageId", async (req, res) => {
  const id = req.params.imageId;
  if (!id) {
    return res.status(400).json({ error: "Image ID is required." });
  }
  const img = await Image.findByPk(id);
  if (!img) {
    return res.status(404).json({ error: `Image(id=${id}) not found.` });
  }
  res.setHeader("Content-Type", img.image.mimetype);
  return res.sendFile(img.image.path, { root: path.resolve() });
});

imagesRouter.get("/:imageId/meta", async (req, res) => {
  const id = req.params.imageId;
  if (!id) {
    return res.status(400).json({ error: "Image ID is required." });
  }
  const img = await Image.findByPk(id);
  if (!img) {
    return res.status(404).json({ error: `Image(id=${id}) not found.` });
  }
  return res.json({
    id: img.id,
    title: img.title,
    author: img.author,
    UserId: img.UserId,
  });
});

imagesRouter.delete("/:imageId", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const img = await Image.findByPk(req.params.imageId);
  if (!img) {
    return res
      .status(404)
      .json({ error: `Image(id=${req.params.imageId}) not found.` });
  }
  if (img.UserId !== req.user.id) {
    return res.status(403).json({ error: "Not authorized to delete image." });
  }
  await img.destroy();
  return res.json(img);
});

// I think we don't want to expose all comments, but rather comments for a specific image.
imagesRouter.get("/:imageId/comments", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Input validation
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 0;
  if (Number.isNaN(page) || page < 0 || Number.isNaN(limit) || limit <= 0) {
    return res.status(400).json({ error: "Invalid page or limit parameter." });
  }
  const offset = page * limit;
  const imageId = req.params.imageId;
  const comments = await Comment.findAll({
    where: { imageId: imageId },
    offset,
    limit,
    order: [["createdAt", "DESC"]],
  });
  return res.json(comments);
});

// Get comments count for a specific image
imagesRouter.get("/:imageId/comments/count", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const imageId = req.params.imageId;
  if (!imageId) {
    return res.status(400).json({ error: "Image ID is required." });
  }
  const count = await Comment.count({ where: { imageId: imageId } });
  return res.json({ count });
});

// Delete all comments for a specific image
imagesRouter.delete("/:imageId/comments", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const imageId = req.params.imageId;
  const image = await Image.findByPk(imageId);
  if (!image) {
    return res.status(404).json({ error: `Image(id=${imageId}) not found.` });
  }
  if (image.UserId !== req.user.id) {
    return res
      .status(403)
      .json({ error: "Not authorized to delete comments." });
  }
  await Comment.destroy({ where: { imageId: imageId } });
  return res.json({
    message: `All comments for image(id=${imageId}) deleted.`,
  });
});

Image.belongsTo(User);
User.hasMany(Image);
