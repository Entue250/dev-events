// import { NextRequest, NextResponse } from "next/server";
// import connectDB from "@/lib/mongodb";
// import Event from "@/database/event.model";
// import { Error as MongooseError } from "mongoose";

// // Type for route params
// interface RouteParams {
//   params: Promise<{
//     slug: string;
//   }>;
// }

// /**
//  * GET /api/events/[slug]
//  * Fetches a single event by its slug
//  */
// export async function GET(
//   req: NextRequest,
//   { params }: RouteParams
// ): Promise<NextResponse> {
//   try {
//     // Connect to database
//     await connectDB();

//     // Await params (Next.js 15+ requirement)
//     const { slug } = await params;

//     // Validate slug parameter exists
//     if (!slug || typeof slug !== "string" || slug.trim() === "") {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Slug parameter is required",
//         },
//         { status: 400 }
//       );
//     }

//     // Sanitize slug (trim and lowercase)
//     const sanitizedSlug = slug.trim().toLowerCase();

//     // Basic format validation (allow alphanumeric and hyphens)
//     const slugRegex = /^[a-z0-9-]+$/;
//     if (!slugRegex.test(sanitizedSlug)) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Invalid slug format",
//         },
//         { status: 400 }
//       );
//     }

//     // Query event by slug (use sanitized slug)
//     const event = await Event.findOne({ slug: sanitizedSlug }).lean();

//     // Handle event not found
//     if (!event) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: `Event with slug "${sanitizedSlug}" not found`,
//         },
//         { status: 404 }
//       );
//     }

//     // Return successful response
//     return NextResponse.json(
//       {
//         success: true,
//         message: "Event fetched successfully",
//         event,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Event fetch error:", error);

//     // Handle Mongoose CastError (invalid ObjectId format if querying by _id accidentally)
//     if (error instanceof MongooseError.CastError) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Invalid slug format",
//         },
//         { status: 400 }
//       );
//     }

//     // Handle database connection errors
//     if (error instanceof Error && error.message.includes("connection")) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Database connection failed",
//         },
//         { status: 503 }
//       );
//     }

//     // Handle unexpected errors
//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to fetch event",
//         error: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import { Error as MongooseError } from "mongoose";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "ds6xtngxs",
  api_key: process.env.CLOUDINARY_API_KEY || "335841151396400",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "sXT91kihCxiV2QK59Cqus3XO9S8",
});

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
    await connectDB();
    const { slug } = await params;

    if (!slug || typeof slug !== "string" || slug.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Slug parameter is required" },
        { status: 400 }
      );
    }

    const sanitizedSlug = slug.trim().toLowerCase();
    const slugRegex = /^[a-z0-9-]+$/;

    if (!slugRegex.test(sanitizedSlug)) {
      return NextResponse.json(
        { success: false, message: "Invalid slug format" },
        { status: 400 }
      );
    }

    const event = await Event.findOne({ slug: sanitizedSlug }).lean();

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: `Event with slug "${sanitizedSlug}" not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Event fetched successfully", event },
      { status: 200 }
    );
  } catch (error) {
    console.error("Event fetch error:", error);

    if (error instanceof MongooseError.CastError) {
      return NextResponse.json(
        { success: false, message: "Invalid slug format" },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("connection")) {
      return NextResponse.json(
        { success: false, message: "Database connection failed" },
        { status: 503 }
      );
    }

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

/**
 * PUT /api/events/[slug]
 * Updates an event by its slug
 */
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    await connectDB();
    const { slug } = await params;
    const formData = await req.formData();

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Slug is required" },
        { status: 400 }
      );
    }

    const existingEvent = await Event.findOne({ slug });

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, any> = {};

    for (const [key, value] of formData.entries()) {
      if (key === "tags" || key === "agenda") {
        try {
          updateData[key] = JSON.parse(value as string);
        } catch {
          updateData[key] = (value as string)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        }
      } else if (key !== "image") {
        updateData[key] = value;
      }
    }

    const file = formData.get("image") as File;

    if (file && file.size > 0) {
      if (existingEvent.image) {
        try {
          const urlParts = existingEvent.image.split("/");
          const fileName = urlParts[urlParts.length - 1];
          const publicId = `dev-events/${fileName.split(".")[0]}`;
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error("Failed to delete old image:", err);
        }
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResult = await new Promise<{ secure_url: string }>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { resource_type: "image", folder: "dev-events" },
              (error, result) => {
                if (error) return reject(error);
                resolve(result as { secure_url: string });
              }
            )
            .end(buffer);
        }
      );

      updateData.image = uploadResult.secure_url;
    }

    const updatedEvent = await Event.findOneAndUpdate({ slug }, updateData, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event updated successfully",
        event: updatedEvent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Event update error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update event",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[slug]
 * Deletes an event by its slug
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    await connectDB();
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Slug is required" },
        { status: 400 }
      );
    }

    const event = await Event.findOne({ slug });

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    if (event.image) {
      try {
        const urlParts = event.image.split("/");
        const fileName = urlParts[urlParts.length - 1];
        const publicId = `dev-events/${fileName.split(".")[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error(
          "Failed to delete image from Cloudinary:",
          cloudinaryError
        );
      }
    }

    await Event.findOneAndDelete({ slug });

    return NextResponse.json(
      { success: true, message: "Event deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Event deletion error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete event",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
