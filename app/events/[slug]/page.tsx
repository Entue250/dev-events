// import BookEvent from "@/components/BookEvent";
// import EventCard from "@/components/EventCard";
// import { IEvent } from "@/database/event.model";
// import { getSimilarEventsBySlug } from "@/lib/actions/event.actions";
// import Image from "next/image";
// import { notFound } from "next/navigation";

// const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// const EventDetailItem = ({
//   icon,
//   alt,
//   label,
// }: {
//   icon: string;
//   alt: string;
//   label: string;
// }) => (
//   <div className="flex-row-gap-2 items-center">
//     <Image src={icon} alt={alt} width={17} height={17} />
//     <p>{label}</p>
//   </div>
// );

// const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
//   <div className="agenda">
//     <h2>Agenda</h2>
//     <ul>
//       {agendaItems.map((item) => (
//         <li key={item}>{item}</li>
//       ))}
//     </ul>
//   </div>
// );

// const EventTags = ({ tags }: { tags: string[] }) => (
//   <div className="flex flex-row gap-1.5 flex-wrap">
//     {tags.map((tag) => (
//       <div className="pill" key={tag}>
//         {tag}
//       </div>
//     ))}
//   </div>
// );

// const EventDetailsPage = async ({
//   params,
// }: {
//   params: Promise<{ slug: string }>;
// }) => {
//   const { slug } = await params;

//   let event;
//   try {
//     const request = await fetch(`${BASE_URL}/api/events/${slug}`, {
//       next: { revalidate: 60 },
//     });

//     if (!request.ok) {
//       if (request.status === 404) {
//         return notFound();
//       }
//       throw new Error(`Failed to fetch event: ${request.statusText}`);
//     }
//     const response = await request.json();
//     event = response.event;

//     if (!event) {
//       return notFound();
//     }
//   } catch (error) {}

//   const {
//     event: {
//       description,
//       image,
//       overview,
//       date,
//       time,
//       location,
//       mode,
//       agenda,
//       audience,
//       tags,
//       organizer,
//     },
//   } = await request.json();

//   if (!description) return notFound();

//   const bookings = 10;

//   const similarEvents: IEvent[] = await getSimilarEventsBySlug(slug);

//   return (
//     <section id="event">
//       <div className="header">
//         <h1>Event Description</h1>
//         <p>{description}</p>
//       </div>

//       <div className="details">
//         {/* Left Side - Event Content */}
//         <div className="content">
//           <Image
//             src={image}
//             alt="Event Banner"
//             width={800}
//             height={800}
//             className="banner"
//           />

//           <section className="flex-col-gap-2">
//             <h2>Overview</h2>
//             <p>{overview}</p>
//           </section>

//           <section className="flex-col-gap-2">
//             <h2>Event Details</h2>

//             <EventDetailItem
//               icon="/icons/calendar.svg"
//               alt="calendar"
//               label={date}
//             />
//             <EventDetailItem icon="/icons/clock.svg" alt="clock" label={time} />
//             <EventDetailItem icon="/icons/pin.svg" alt="pin" label={location} />
//             <EventDetailItem icon="/icons/mode.svg" alt="mode" label={mode} />
//             <EventDetailItem
//               icon="/icons/audience.svg"
//               alt="audience"
//               label={audience}
//             />
//           </section>

//           <EventAgenda agendaItems={agenda} />

//           <section className="flex-col-gap-2">
//             <h2>About the Organizer</h2>
//             <p>{organizer}</p>
//           </section>

//           <EventTags tags={tags} />
//         </div>

//         {/* Right Side - Booking Form */}
//         <aside className="booking">
//           <div className="signup-card">
//             <h2>Book Your Spot</h2>
//             {bookings > 0 ? (
//               <p className="text-sm">
//                 Join {bookings} people who have already booked their spot!
//               </p>
//             ) : (
//               <p className="text-sm">Be the first to book your spot!</p>
//             )}

//             <BookEvent eventId={event._id} slug={event.slug} />
//           </div>
//         </aside>
//       </div>

//       <div className="flex w-full flex-col gap-4 pt-20">
//         <h2>Similar Events</h2>
//         <div className="events">
//           {similarEvents.length > 0 &&
//             similarEvents.map((similarEvent: IEvent) => (
//               <EventCard key={similarEvent.title} {...similarEvent} />
//             ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default EventDetailsPage;

import BookEvent from "@/components/BookEvent";
import EventCard from "@/components/EventCard";
import { IEvent } from "@/database/event.model";
import { getSimilarEventsBySlug } from "@/lib/actions/event.actions";
import Image from "next/image";
import { notFound } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const EventDetailItem = ({
  icon,
  alt,
  label,
}: {
  icon: string;
  alt: string;
  label: string;
}) => (
  <div className="flex-row-gap-2 items-center">
    <Image src={icon} alt={alt} width={17} height={17} />
    <p>{label}</p>
  </div>
);

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
  <div className="agenda">
    <h2>Agenda</h2>
    <ul>
      {agendaItems.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  </div>
);

const EventTags = ({ tags }: { tags: string[] }) => (
  <div className="flex flex-row gap-1.5 flex-wrap">
    {tags.map((tag, index) => (
      <div className="pill" key={`${tag}-${index}`}>
        {tag}
      </div>
    ))}
  </div>
);

interface EventDetailsPageProps {
  params: Promise<{ slug: string }>;
}

const EventDetailsPage = async ({ params }: EventDetailsPageProps) => {
  const { slug } = await params;

  // Fetch event data
  let event: IEvent;

  try {
    const response = await fetch(`${BASE_URL}/api/events/${slug}`, {
      next: { revalidate: 60 },
      cache: "force-cache",
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch event: ${response.status} ${response.statusText}`
      );
      return notFound();
    }

    const data = await response.json();

    if (!data.success || !data.event) {
      return notFound();
    }

    event = data.event;
  } catch (error) {
    console.error("Error fetching event:", error);
    return notFound();
  }

  // Now we can safely destructure because event is guaranteed to exist
  const {
    _id,
    title,
    description,
    image,
    overview,
    date,
    time,
    location,
    mode,
    agenda,
    audience,
    tags,
    organizer,
    slug: eventSlug,
  } = event;

  // Fetch similar events
  const similarEvents = await getSimilarEventsBySlug(slug);

  // Mock bookings count (replace with actual database query later)
  const bookings = 10;

  return (
    <section id="event">
      <div className="header">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className="details">
        {/* Left Side - Event Content */}
        <div className="content">
          <Image
            src={image}
            alt={`${title} Banner`}
            width={800}
            height={800}
            className="banner"
            priority
          />

          <section className="flex-col-gap-2">
            <h2>Overview</h2>
            <p>{overview}</p>
          </section>

          <section className="flex-col-gap-2">
            <h2>Event Details</h2>

            <EventDetailItem
              icon="/icons/calendar.svg"
              alt="calendar"
              label={new Date(date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
            <EventDetailItem icon="/icons/clock.svg" alt="clock" label={time} />
            <EventDetailItem icon="/icons/pin.svg" alt="pin" label={location} />
            <EventDetailItem
              icon="/icons/mode.svg"
              alt="mode"
              label={mode.charAt(0).toUpperCase() + mode.slice(1)}
            />
            <EventDetailItem
              icon="/icons/audience.svg"
              alt="audience"
              label={audience}
            />
          </section>

          <EventAgenda agendaItems={agenda} />

          <section className="flex-col-gap-2">
            <h2>About the Organizer</h2>
            <p>{organizer}</p>
          </section>

          <EventTags tags={tags} />
        </div>

        {/* Right Side - Booking Form */}
        <aside className="booking">
          <div className="signup-card">
            <h2>Book Your Spot</h2>
            {bookings > 0 ? (
              <p className="text-sm">
                Join {bookings} people who have already booked their spot!
              </p>
            ) : (
              <p className="text-sm">Be the first to book your spot!</p>
            )}

            <BookEvent eventId={String(_id)} slug={eventSlug} />
          </div>
        </aside>
      </div>

      {/* Similar Events Section */}
      {similarEvents.length > 0 && (
        <div className="flex w-full flex-col gap-4 pt-20">
          <h2>Similar Events</h2>
          <div className="events">
            {similarEvents.map((similarEvent) => (
              <EventCard key={String(similarEvent._id)} {...similarEvent} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default EventDetailsPage;
