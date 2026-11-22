import jwt from "jsonwebtoken";

export function requireAuth(request, response, next) {
  const authorization = request.get("authorization") || "";
  const [scheme, token, extra] = authorization.split(" ");

  if (scheme !== "Bearer" || !token || extra) {
    response.status(401).json({ error: "A valid Bearer token is required." });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload !== "object" || typeof payload.sub !== "string") {
      response.status(401).json({ error: "The authentication token is invalid." });
      return;
    }

    request.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    response.status(401).json({ error: "The authentication token is invalid or expired." });
  }
}

export function requireAdmin(request, response, next) {
  if (request.auth?.role !== "admin") {
    response.status(403).json({ error: "Administrator access is required." });
    return;
  }
  next();
}
