import { tokens } from "../routers/users_router.js";

const publicImageRoutes = [
  /^\/api\/images\/\d+$/, // /api/images/1
  /^\/api\/images\/\d+\/meta$/, // /api/images/1/meta
];

const openPaths = ["/api/users/signup", "/api/users/signin", "/api/users"];
const openPrefixes = ["/static", "/uploads"];

export function authenticate(req, res, next) {
  // Idea for checking open paths given by Copilot
  // Exact code wasn't written by Copilot but the prompt was:
  // "How should I handle exposing certain endpoints to unauthorized users"
  const isOpenPath =
    (req.path === "/api/images" && req.method === "GET") ||
    openPaths.includes(req.path) ||
    openPrefixes.some(
      (prefix) => req.path.startsWith(prefix) && req.method === "GET",
    ) ||
    (req.method === "GET" &&
      publicImageRoutes.some((regex) => regex.test(req.path)));

  if (isOpenPath) return next();
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }
  const token = auth.split(" ")[1];
  const userId = tokens.get(token);
  if (!userId) return res.status(401).json({ error: "Invalid token" });
  req.user = { id: userId };
  next();
}
