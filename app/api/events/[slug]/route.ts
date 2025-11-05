import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import { Error as MongooseError } from "mongoose";

// Type for route params
interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * GET /api/events/[slug]
 * Fetches a single event by its slug
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // Connect to database
    await connectDB();

    // Await params (Next.js 15+ requirement)
    const { slug } = await params;

    // Validate slug parameter exists
    if (!slug || typeof slug !== "string" || slug.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Slug parameter is required",
        },
        { status: 400 }
      );
    }

    // Sanitize slug (trim and lowercase)
    const sanitizedSlug = slug.trim().toLowerCase();

    // Basic format validation (allow alphanumeric and hyphens)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(sanitizedSlug)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid slug format",
        },
        { status: 400 }
      );
    }

    // Query event by slug (use sanitized slug)
    const event = await Event.findOne({ slug: sanitizedSlug }).lean();

    // Handle event not found
    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: `Event with slug "${sanitizedSlug}" not found`,
        },
        { status: 404 }
      );
    }

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        message: "Event fetched successfully",
        event,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Event fetch error:", error);

    // Handle Mongoose CastError (invalid ObjectId format if querying by _id accidentally)
    if (error instanceof MongooseError.CastError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid slug format",
        },
        { status: 400 }
      );
    }

    // Handle database connection errors
    if (error instanceof Error && error.message.includes("connection")) {
      return NextResponse.json(
        {
          success: false,
          message: "Database connection failed",
        },
        { status: 503 }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch event",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
