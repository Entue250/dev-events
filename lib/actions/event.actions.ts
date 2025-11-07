// "use server";

// import Event from "@/database/event.model";
// import connectDB from "../mongodb";

// export const getSimilarEventsBySlug = async (slug: string) => {
//   try {
//     await connectDB();
//     const event = await Event.findOne({ slug });

//     return await Event.find({
//       _id: { $ne: event._id },
//       tags: { $in: event.tags },
//     }).lean();
//   } catch {
//     return [];
//   }
// };

"use server";

import Event, { IEvent } from "@/database/event.model";
import connectDB from "../mongodb";
import { Types } from "mongoose";

// Type for MongoDB lean document
interface LeanEventDocument {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export const getSimilarEventsBySlug = async (
  slug: string
): Promise<IEvent[]> => {
  try {
    await connectDB();

    const event = await Event.findOne({ slug }).lean<LeanEventDocument>();

    if (!event) {
      return [];
    }

    const similarEvents = await Event.find({
      _id: { $ne: event._id },
      tags: { $in: event.tags },
    })
      .limit(3) // Limit to 3 similar events
      .sort({ date: 1 }) // Sort by upcoming events
      .lean<LeanEventDocument[]>();

    // Convert MongoDB documents to plain objects with string IDs
    return similarEvents.map((doc) => ({
      _id: doc._id.toString(),
      title: doc.title,
      slug: doc.slug,
      description: doc.description,
      overview: doc.overview,
      image: doc.image,
      venue: doc.venue,
      location: doc.location,
      date: doc.date,
      time: doc.time,
      mode: doc.mode,
      audience: doc.audience,
      agenda: doc.agenda,
      organizer: doc.organizer,
      tags: doc.tags,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    })) as IEvent[];
  } catch (error) {
    console.error("Error fetching similar events:", error);
    return [];
  }
};
