import app from "../app.js";
import { connectToDatabase } from "../config/db.js";

const MONGODB_URI_PATTERN = /\bmongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi;
const PASSWORD_PATTERN = /\b(password|passwd|pwd)\s*([=:])\s*("[^"]*"|'[^']*'|[^\s,;]+)/gi;
const NETWORK_ERROR_CODE_PATTERN =
  /^(?:EAI_AGAIN|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|EPIPE|EADDRNOTAVAIL|ESOCKETTIMEDOUT|ERR_TLS_[A-Z0-9_]+)$/;

function safeDiagnosticValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return typeof value === "string" && /^[A-Za-z0-9_.-]{1,80}$/.test(value)
    ? value
    : undefined;
}

function redactDiagnosticMessage(message) {
  if (typeof message !== "string") return undefined;
  return message
    .replace(MONGODB_URI_PATTERN, "[REDACTED_MONGODB_URI]")
    .replace(PASSWORD_PATTERN, "$1$2[REDACTED]")
    .slice(0, 2000);
}

function getMongoDiagnostic(error) {
  const networkErrorCodes = new Set();
  const visited = new Set();
  const visitError = (candidate, depth = 0) => {
    if (!candidate || typeof candidate !== "object" || visited.has(candidate) || depth > 5) return;
    visited.add(candidate);

    if (depth > 0) {
      const code = safeDiagnosticValue(candidate.code);
      if (typeof code === "string" && NETWORK_ERROR_CODE_PATTERN.test(code)) {
        networkErrorCodes.add(code);
      }
    }

    visitError(candidate.cause, depth + 1);
    for (const nestedError of candidate.errors ?? []) {
      visitError(nestedError, depth + 1);
    }
    for (const server of candidate.reason?.servers?.values?.() ?? []) {
      visitError(server.error, depth + 1);
    }
  };
  visitError(error);

  const serverErrors = [...(error?.reason?.servers?.values?.() ?? [])]
    .map(({ error: serverError }) => ({
      name: safeDiagnosticValue(serverError?.name),
      code: safeDiagnosticValue(serverError?.code),
      codeName: safeDiagnosticValue(serverError?.codeName),
      causeCode: safeDiagnosticValue(serverError?.cause?.code),
    }))
    .filter((details) => Object.values(details).some((value) => value !== undefined))
    .slice(0, 10);

  return {
    name: safeDiagnosticValue(error?.name) ?? "UnknownError",
    code: safeDiagnosticValue(error?.code),
    codeName: safeDiagnosticValue(error?.codeName),
    message: redactDiagnosticMessage(error?.message),
    networkErrorCodes: [...networkErrorCodes],
    serverErrors,
  };
}

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    return app(request, response);
  }

  try {
    await connectToDatabase();
  } catch (error) {
    const database = process.env.MONGODB_URI?.trim()
      ? "disconnected"
      : "not-configured";
    console.error("MongoDB connection unavailable.", {
      uriConfigured: database !== "not-configured",
      ...getMongoDiagnostic(error),
    });

    return response.status(503).json({
      status: "error",
      database,
      message: database === "not-configured"
        ? "The database is not configured."
        : "The database is temporarily unavailable.",
    });
  }

  return app(request, response);
}
