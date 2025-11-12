"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export default function CreateEvent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    overview: "",
    date: "",
    time: "",
    venue: "",
    location: "",
    mode: "",
    audience: "",
    organizer: "",
    tags: "",
    agenda: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth`);
      const data = await response.json();

      if (!data.success) {
        router.push("/admin/signin");
      }
    } catch (err) {
      router.push("/admin/signin");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!imageFile) {
        setError("Please upload an event image");
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "tags" || key === "agenda") {
          // Convert comma-separated strings to arrays
          const array = value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
          formDataToSend.append(key, JSON.stringify(array));
        } else {
          formDataToSend.append(key, value);
        }
      });

      // Add image
      formDataToSend.append("image", imageFile);

      const response = await fetch(`${BASE_URL}/api/events`, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/admin/dashboard");
      } else {
        setError(data.message || "Failed to create event");
      }
    } catch (err) {
      setError("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
              className="text-primary transition-colors"
            >
              Create Event
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto container sm:px-10 px-5 py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-5xl mb-10 text-center">Create an Event</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Event Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full bg-dark-200 rounded-md px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter event title"
              />
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Event Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full bg-dark-200 rounded-md px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Event Time */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Event Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="w-full bg-dark-200 rounded-md px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Venue */}
            <div>
              <label className="block text-sm font-medium mb-2">Venue</label>
              <div className="relative">
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  required
                  className="w-full bg-dark-200 rounded-md px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter venue or online link"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full bg-dark-200 rounded-md px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="City, Country"
              />
            </div>

            {/* Event Type (Mode) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Event Type
              </label>
              <select
                name="mode"
                value={formData.mode}
                onChange={handleChange}
                required
                className="w-full bg-dark-200 rounded-md px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select event type</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {/* Audience */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Expected Audience
              </label>
              <input
                type="text"
                name="audience"
                value={formData.audience}
                onChange={handleChange}
                required
                className="w-full bg-dark-200 rounded-md px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 500"
              />
            </div>

            {/* Organizer */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Organizer
              </label>
              <input
                type="text"
                name="organizer"
                value={formData.organizer}
                onChange={handleChange}
                required
                className="w-full bg-dark-200 rounded-md px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Organizer name"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Event Image / Banner
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dark-200 border-dashed rounded-md cursor-pointer bg-dark-100 hover:bg-dark-200 transition-colors">
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-10 h-10 mb-3 text-light-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-light-200">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-light-200">
                        PNG, JPG or WEBP (MAX. 5MB)
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                required
                className="w-full bg-dark-200 rounded-md px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Add tags such as react, next, js"
              />
              <p className="text-xs text-light-200 mt-1">
                Separate tags with commas
              </p>
            </div>

            {/* Overview */}
            <div>
              <label className="block text-sm font-medium mb-2">Overview</label>
              <textarea
                name="overview"
                value={formData.overview}
                onChange={handleChange}
                required
                rows={3}
                className="w-full bg-dark-200 rounded-md px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Brief overview of the event"
              />
            </div>

            {/* Event Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Event Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                className="w-full bg-dark-200 rounded-md px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Briefly describe the event"
              />
            </div>

            {/* Agenda */}
            <div>
              <label className="block text-sm font-medium mb-2">Agenda</label>
              <textarea
                name="agenda"
                value={formData.agenda}
                onChange={handleChange}
                required
                rows={4}
                className="w-full bg-dark-200 rounded-md px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Enter agenda items, separated by commas"
              />
              <p className="text-xs text-light-200 mt-1">
                Separate agenda items with commas
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-4 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? "Creating Event..." : "Save Event"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
