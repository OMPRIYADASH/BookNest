"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type Shelf = {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
};

type Book = {
  id: number;
  title: string;
  author: string;
  status: string;
  total_pages: number;
  rating: number | null;
  notes: string | null;
};

export default function ShelfDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [shelfId, setShelfId] = useState<string | null>(null);
  const [shelf, setShelf] = useState<Shelf | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    params.then((value) => {
      setShelfId(value.id);
    });
  }, [params]);

  async function loadShelf() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    if (!shelfId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const shelfData = await apiRequest(
        `/shelves/${shelfId}`,
        { method: "GET" },
        token
      );

      const booksData = await apiRequest(
        `/shelves/${shelfId}/books`,
        { method: "GET" },
        token
      );

      setShelf(shelfData);
        setBooks(booksData);
        setRole(shelfData.role ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load shelf."
      );
    } finally {
      setLoading(false);
    }
  }


  async function removeBook(bookId: number) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      await apiRequest(
        `/shelves/${shelfId}/books/${bookId}`,
        {
          method: "DELETE",
        },
        token
      );

      setBooks((currentBooks) =>
        currentBooks.filter((book) => book.id !== bookId)
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to remove book."
      );
    }
  }

  useEffect(() => {
    loadShelf();
  }, [shelfId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-8">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm">
          Loading shelf...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/shelves";
            }}
            className="mb-6 text-sm font-medium text-gray-700 hover:underline"
          >
            ← Back to Shelves
          </button>

          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => {
            window.location.href = "/shelves";
          }}
          className="mb-6 text-sm font-medium text-gray-700 hover:underline"
        >
          ← Back to Shelves
        </button>

        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {shelf?.name}
              </h1>

              <p className="mt-1 text-gray-600">
                Books in this shelf
              </p>
            </div>

            {role && (
              <span className="rounded-full bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
                {role === "owner"
                  ? "Owner"
                  : role === "editor"
                  ? "Editor"
                  : "Viewer"}
              </span>
            )}
          </div>
        </div>

        {books.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm">
            No books in this shelf yet.
          </div>
        ) : (
          <div className="space-y-4">
            {books.map((book) => (
              <div
                key={book.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {book.title}
                    </h2>

                    <p className="mt-1 text-gray-600">
                      by {book.author}
                    </p>
                  </div>

                  {(role === "owner" || role === "editor") && (
                    <button
                      type="button"
                      onClick={() => removeBook(book.id)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="mt-4 grid gap-4 text-sm text-gray-600 md:grid-cols-3">
                  <div>
                    <span className="font-medium text-gray-900">
                      Status:
                    </span>{" "}
                    {book.status}
                  </div>

                  <div>
                    <span className="font-medium text-gray-900">
                      Pages:
                    </span>{" "}
                    {book.total_pages}
                  </div>

                  <div>
                    <span className="font-medium text-gray-900">
                      Rating:
                    </span>{" "}
                    {book.rating ?? "Not rated"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}