import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { v2 as cloudinary } from "cloudinary";
import Event from "@/database/event.model";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();

    let event;

    try {
      event = Object.fromEntries(formData.entries());
    } catch (e) {
      return NextResponse.json(
        { message: "Invalid JSON data format" },
        { status: 400 }
      );
    }

    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { message: "Image file is required" },
        { status: 400 }
      );
    }

    let tags = JSON.parse(formData.get("tags") as string);
    let agenda = JSON.parse(formData.get("agenda") as string);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "dev-events" },
          (error, result) => {
            if (error) return reject(error);

            resolve(result);
          }
        )
        .end(buffer);
    });

    event.image = (uploadResult as { secure_url: string }).secure_url;

    const createdEvent = await Event.create({
      ...event,
      tags: tags,
      agenda: agenda,
    });

    return NextResponse.json(
      {
        message: "Event created successfully",
        event: createdEvent,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Event Creation Failed",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const events = await Event.find().sort({ createdAt: -1 });

    return NextResponse.json(
      { message: "Events fetched successfully", events },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { message: "Event fetching failed", error: e },
      { status: 500 }
    );
  }
}

// import { NextRequest, NextResponse } from "next/server";
// import connectDB from "@/lib/mongodb";
// import { v2 as cloudinary } from "cloudinary";
// import Event from "@/database/event.model";

// export async function POST(req: NextRequest) {
//   try {
//     await connectDB();

//     const formData = await req.formData();

//     // Extract and process form data
//     const eventData: Record<string, any> = {};

//     for (const [key, value] of formData.entries()) {
//       // Handle array fields (agenda and tags)
//       if (key === "agenda" || key === "tags") {
//         if (!eventData[key]) {
//           eventData[key] = [];
//         }
//         // Check if value is a JSON string
//         try {
//           const parsed = JSON.parse(value as string);
//           eventData[key] = Array.isArray(parsed) ? parsed : [value];
//         } catch {
//           // If not JSON, treat as individual item
//           eventData[key].push(value);
//         }
//       } else if (key !== "image") {
//         // Skip image, we'll handle it separately
//         eventData[key] = value;
//       }
//     }

//     // Handle image upload
//     const file = formData.get("image") as File;

//     if (!file) {
//       return NextResponse.json(
//         { message: "Image file is required" },
//         { status: 400 }
//       );
//     }

//     const arrayBuffer = await file.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);

//     const uploadResult = await new Promise((resolve, reject) => {
//       cloudinary.uploader
//         .upload_stream(
//           { resource_type: "image", folder: "dev-events" },
//           (error, result) => {
//             if (error) return reject(error);
//             resolve(result);
//           }
//         )
//         .end(buffer);
//     });

//     eventData.image = (uploadResult as { secure_url: string }).secure_url;

//     // Normalize mode to match schema enum
//     if (eventData.mode) {
//       const modeMap: Record<string, string> = {
//         "hybrid (in-person & online)": "hybrid",
//         hybrid: "hybrid",
//         online: "online",
//         offline: "offline",
//         "in-person": "offline",
//       };
//       eventData.mode = modeMap[eventData.mode.toLowerCase()] || eventData.mode;
//     }

//     const createdEvent = await Event.create(eventData);

//     return NextResponse.json(
//       {
//         message: "Event created successfully",
//         event: createdEvent,
//       },
//       { status: 201 }
//     );
//   } catch (error: any) {
//     console.error("Event creation error:", error);

//     // Handle Mongoose validation errors
//     if (error.name === "ValidationError") {
//       return NextResponse.json(
//         {
//           message: "Validation failed",
//           errors: Object.keys(error.errors).map((key) => ({
//             field: key,
//             message: error.errors[key].message,
//           })),
//         },
//         { status: 400 }
//       );
//     }

//     // Handle duplicate key errors (slug collision)
//     if (error.code === 11000) {
//       return NextResponse.json(
//         {
//           message: "Event with this title already exists",
//           field: Object.keys(error.keyPattern)[0],
//         },
//         { status: 409 }
//       );
//     }

//     // Handle cloudinary upload errors
//     if (error.http_code) {
//       return NextResponse.json(
//         {
//           message: "Image upload failed",
//           error: error.message,
//         },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json(
//       {
//         message: "Event creation failed",
//         error: error.message || "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }

// export async function GET(req: NextRequest) {
//   try {
//     await connectDB();

//     const { searchParams } = new URL(req.url);
//     const mode = searchParams.get("mode");
//     const tags = searchParams.get("tags");
//     const search = searchParams.get("search");

//     let query: Record<string, any> = {};

//     // Filter by mode
//     if (mode && ["online", "offline", "hybrid"].includes(mode)) {
//       query.mode = mode;
//     }

//     // Filter by tags
//     if (tags) {
//       query.tags = { $in: tags.split(",") };
//     }

//     // Search in title, description, or location
//     if (search) {
//       query.$or = [
//         { title: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//         { location: { $regex: search, $options: "i" } },
//       ];
//     }

//     const events = await Event.find(query).sort({ date: 1, createdAt: -1 });

//     return NextResponse.json(
//       {
//         message: "Events fetched successfully",
//         count: events.length,
//         events,
//       },
//       { status: 200 }
//     );
//   } catch (error: any) {
//     console.error("Event fetch error:", error);

//     return NextResponse.json(
//       {
//         message: "Event fetching failed",
//         error: error.message || "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }
