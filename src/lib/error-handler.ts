import { NextResponse } from "next/server";

/**
 * Wrap an API route handler with structured error handling.
 * Converts Prisma connection errors → 503, validation → 400, otherwise 500.
 *
 * Usage:
 *   export const POST = withErrorHandler(async (req) => { ... });
 *   export const GET = withErrorHandler(async (req, ctx) => { ... });
 */
export function withErrorHandler<TArgs extends any[]>(
  handler: (...args: TArgs) => Promise<NextResponse | Response>
) {
  return async (...args: TArgs): Promise<NextResponse | Response> => {
    try {
      return await handler(...args);
    } catch (e: any) {
      const msg = e?.message || String(e);
      const code = e?.code || "";

      // Prisma connection errors
      if (
        code === "P1001" || // Can't reach database
        code === "P1002" || // Timed out
        code === "P1008" || // Operations timed out
        code === "P1017" || // Server closed the connection
        /ECONNREFUSED|ECONNRESET|ENOTFOUND|ETIMEDOUT/i.test(msg)
      ) {
        console.error("[api] DB connection error:", code, msg);
        return NextResponse.json(
          { error: "Pangkalan data tidak boleh dihubungi. Sila cuba lagi sebentar." },
          { status: 503 }
        );
      }

      // Prisma validation errors
      if (code === "P2002") {
        // Unique constraint failed
        return NextResponse.json(
          { error: "Rekod dengan nilai ini sudah wujud." },
          { status: 409 }
        );
      }
      if (code === "P2025") {
        // Record not found
        return NextResponse.json(
          { error: "Rekod tidak dijumpai." },
          { status: 404 }
        );
      }

      // Generic Prisma error (Pxxxx)
      if (/^P\d{4}$/.test(code)) {
        console.error("[api] Prisma error:", code, msg);
        return NextResponse.json(
          { error: "Ralat pangkalan data. Sila semak input anda." },
          { status: 400 }
        );
      }

      // Unknown error
      console.error("[api] Unhandled error:", msg, e?.stack);
      return NextResponse.json(
        { error: "Ralat pelayan. Sila cuba lagi sebentar." },
        { status: 500 }
      );
    }
  };
}
