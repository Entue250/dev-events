"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

interface Event {
  _id: string;
  title: string;
  image: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  slug: string;
}

interface Admin {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;

  useEffect(() => {
    checkAuth();
    fetchEvents();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth`);
      const data = await response.json();

      if (!data.success) {
        router.push("/admin/signin");
      } else {
        setAdmin(data.admin);
      }
    } catch (err) {
      router.push("/admin/signin");
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/events`);
      const data = await response.json();

      if (data.success || data.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch(`${BASE_URL}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signout" }),
      });
      router.push("/admin/signin");
    } catch (err) {
      console.error("Sign out failed");
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`${BASE_URL}/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEvents(events.filter((e) => e._id !== eventId));
      }
    } catch (err) {
      alert("Failed to delete event");
    }
  };

  // Pagination
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(events.length / eventsPerPage);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <nav className="flex flex-row justify-between mx-auto container sm:px-10 px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icons/logo.png" alt="logo" width={24} height={24} />
            <p className="text-xl font-bold italic max-sm:hidden">DevSphere</p>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/" className="hover:text-primary transition-colors">
              Events
            </Link>
            <Link
              href="/admin/create-event"
              className="hover:text-primary transition-colors"
            >
              Create Event
            </Link>
            <button
              onClick={handleSignOut}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto container sm:px-10 px-5 py-10">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl mb-4">Event Management</h1>
            <p className="text-light-200">
              Welcome back, {admin?.name || "Admin"}
            </p>
          </div>

          <Link
            href="/admin/create-event"
            className="bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-3 rounded-md transition-colors"
          >
            Add New Event
          </Link>
        </div>

        {/* Events Table */}
        <div className="glass rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-200/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-light-100">
                    Events
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-light-100">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-light-100">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-light-100">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-light-100">
                    Booked spot
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-light-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-200">
                {currentEvents.map((event) => (
                  <tr
                    key={event._id}
                    className="hover:bg-dark-200/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={event.image}
                          alt={event.title}
                          width={48}
                          height={48}
                          className="rounded-md object-cover"
                        />
                        <span className="font-medium">{event.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-light-200">
                      {event.location}
                    </td>
                    <td className="px-6 py-4 text-light-200">
                      {formatDate(event.date)}
                    </td>
                    <td className="px-6 py-4 text-light-200">{event.time}</td>
                    <td className="px-6 py-4 text-light-200">
                      {event.audience || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/edit-event/${event.slug}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(event._id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 bg-dark-200/30">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-6 py-2 bg-dark-100 hover:bg-dark-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="text-light-200">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-6 py-2 bg-dark-100 hover:bg-dark-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {events.length === 0 && (
          <div className="text-center py-20">
            <p className="text-light-200 text-lg mb-4">No events yet</p>
            <Link
              href="/admin/create-event"
              className="inline-block bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-3 rounded-md transition-colors"
            >
              Create Your First Event
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
