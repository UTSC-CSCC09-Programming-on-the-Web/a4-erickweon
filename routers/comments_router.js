import { Router } from "express";
import { Comment } from "../models/comments.js";
import { Image } from "../models/images.js";
import { User } from "../models/users.js";

export const commentsRouter = Router();

commentsRouter.post("/", async (req, res) => {
  const { date, content, imageId } = req.body;
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!date || !content || !imageId) {
    return res
      .status(422)
      .json({ error: "Date, content, and imageId are required." });
  }
  try {
    const user = await User.findByPk(req.user.id);
    const img = await Image.findByPk(imageId);
    if (!img) {
      return res.status(422).json({ error: `Image(id=${imageId}) not found.` });
    }
    const comment = await Comment.create({
      author: user.username,
      date: date,
      content: content,
      ImageId: img.id,
      UserId: req.user.id,
    });
    return res.json(comment);
  } catch (e) {
    if (e.name === "SequelizeForeignKeyConstraintError") {
      return res.status(422).json({ error: `Image(id=${imageId}) not found.` });
    } else if (e.name === "SequelizeValidationError") {
      return res.status(422).json({ error: "Invalid input parameters." });
    } else {
      return res.status(400).json({ error: "Cannot create comment." });
    }
  }
});

commentsRouter.delete("/:commentId", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const commentId = req.params.commentId;
  if (!commentId) {
    return res.status(400).json({ error: "Comment ID is required." });
  }
  const comment = await Comment.findByPk(commentId);
  if (!comment) {
    return res
      .status(404)
      .json({ error: `Comment(id=${commentId}) not found.` });
  }
  // Check if authorized to delete the comment (owns the comment or owns the image)
  const image = await Image.findByPk(comment.ImageId);
  if (!image)
    return res
      .status(404)
      .json({ error: `Image(id=${comment.ImageId}) not found.` });
  if (comment.UserId === req.user.id || image.UserId === req.user.id) {
    await comment.destroy();
    return res.json(comment);
  }
  return res.status(403).json({ error: "Not authorized to delete comment" });
});
