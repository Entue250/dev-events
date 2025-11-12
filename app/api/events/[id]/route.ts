import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * DELETE /api/events/[id]
 * Deletes an event by its ID
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    await connectDB();

    const { id } = await params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Event ID is required" },
        { status: 400 }
      );
    }

    // Find event
    const event = await Event.findById(id);

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    // Delete image from Cloudinary if exists
    if (event.image) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = event.image.split("/");
        const fileName = urlParts[urlParts.length - 1];
        const publicId = `dev-events/${fileName.split(".")[0]}`;

        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error(
          "Failed to delete image from Cloudinary:",
          cloudinaryError
        );
        // Continue with event deletion even if image deletion fails
      }
    }

    // Delete event
    await Event.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Event deleted successfully",
      },
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

/**
 * PUT /api/events/[id]
 * Updates an event by its ID
 */
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    await connectDB();

    const { id } = await params;
    const formData = await req.formData();

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Event ID is required" },
        { status: 400 }
      );
    }

    // Find existing event
    const existingEvent = await Event.findById(id);

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    // Parse form data
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

    // Handle image upload if new image provided
    const file = formData.get("image") as File;

    if (file && file.size > 0) {
      // Delete old image from Cloudinary
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

      // Upload new image
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

    // Update event
    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, {
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
