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
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50">
        <p className="text-emerald-800">Loading dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50">
      {/* Navigation */}
      <nav className="border-b border-emerald-100 bg-white/95">
        <div className="flex w-full items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-emerald-950"
          >
            BookNest
          </Link>

          <div className="flex items-center gap-6 text-sm font-medium">
            <Link
              href="/dashboard"
              className="text-emerald-900 hover:text-emerald-600"
            >
              Dashboard
            </Link>

            <Link
              href="/books"
              className="text-emerald-800/70 transition hover:text-emerald-600"
            >
              Books
            </Link>

            <Link
              href="/shelves"
              className="text-emerald-800/70 transition hover:text-emerald-600"
            >
              Shelves
            </Link>

            <button
              onClick={handleLogout}
              className="text-emerald-800/70 transition hover:text-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Dashboard */}
      <div className="w-full p-8">
        <h1 className="text-3xl font-bold text-emerald-950">
          BookNest Dashboard
        </h1>

        <p className="mt-2 text-emerald-800/70">
          Track your reading progress and library.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-emerald-100 bg-white/95 p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
            <p className="text-sm text-emerald-800/70">
              Total Books
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-950">
              {data.total_books}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white/95 p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
            <p className="text-sm text-emerald-800/70">
              Want to Read
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-600">
              {data.books_by_status.want_to_read}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white/95 p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
            <p className="text-sm text-emerald-800/70">
              Reading
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {data.books_by_status.reading}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white/95 p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
            <p className="text-sm text-emerald-800/70">
              Finished
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {data.books_by_status.finished}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-emerald-100 bg-white/95 p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
            <p className="text-sm text-emerald-800/70">
              Finished This Year
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-950">
              {data.finished_this_year}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white/95 p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
            <p className="text-sm text-emerald-800/70">
              Average Rating
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-950">
              {data.average_rating ?? "—"}
            </p>
          </div>

          <div className="rounded-xl border border-lime-200 bg-lime-50/70 p-5 shadow-sm transition hover:border-lime-300 hover:shadow-md">
            <p className="text-sm text-emerald-800/70">
              Currently Lent Out
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-950">
              {data.currently_lent_out}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white/95 p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
            <p className="text-sm text-emerald-800/70">
              Shared Shelves
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-950">
              {data.shared_shelves}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-emerald-100 bg-white/95 p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
          <p className="text-sm text-emerald-800/70">
            Shelf With Most Books
          </p>

          <p className="mt-2 text-xl font-semibold text-emerald-950">
            {data.shelf_with_most_books
              ? `${data.shelf_with_most_books.name} (${data.shelf_with_most_books.book_count} books)`
              : "No shelves yet"}
          </p>
        </div>
      </div>
    </main>
  );
}