"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type DashboardData = {
  total_books: number;
  books_by_status: {
    want_to_read: number;
    reading: number;
    finished: number;
  };
  finished_this_year: number;
  average_rating: number | null;
  shelf_with_most_books: {
    id: number;
    name: string;
    book_count: number;
  } | null;
  currently_lent_out: number;
  shared_shelves: number;
};

export default function Dashboard() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          router.push("/");
          return;
        }

        const result = await apiRequest(
          "/dashboard",
          { method: "GET" },
          token
        );

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("access_token");
    router.push("/");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-gray-900"
          >
            BookNest
          </Link>

          <div className="flex items-center gap-6 text-sm font-medium">
            <Link
              href="/dashboard"
              className="text-gray-900 hover:text-blue-600"
            >
              Dashboard
            </Link>

            <Link
              href="/books"
              className="text-gray-600 hover:text-blue-600"
            >
              Books
            </Link>

            <Link
              href="/shelves"
              className="text-gray-600 hover:text-blue-600"
            >
              Shelves
            </Link>

            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Dashboard */}
      <div className="mx-auto max-w-6xl p-8">
        <h1 className="text-3xl font-bold text-gray-900">
          BookNest Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Track your reading progress and library.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Total Books</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.total_books}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Want to Read</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.books_by_status.want_to_read}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Reading</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.books_by_status.reading}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Finished</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.books_by_status.finished}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">
              Finished This Year
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {data.finished_this_year}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">
              Average Rating
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {data.average_rating ?? "—"}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">
              Currently Lent Out
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {data.currently_lent_out}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">
              Shared Shelves
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {data.shared_shelves}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Shelf With Most Books
          </p>

          <p className="mt-2 text-xl font-semibold text-gray-900">
            {data.shelf_with_most_books
              ? `${data.shelf_with_most_books.name} (${data.shelf_with_most_books.book_count} books)`
              : "No shelves yet"}
          </p>
        </div>
      </div>
    </main>
  );
}