"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type Book = {
  id: number;
  title: string;
  author: string;
  status: string;
  total_pages: number;
  rating: number | null;
  notes: string | null;
  added_at: string;
  finished_at: string | null;
};

type Shelf = {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
};

type Progress = {
  book_id: number;
  current_page: number;
  total_pages: number;
  percentage: number;
  status: string;
  updated_at: string;
};

type Lending = {
  id: number;
  book_id: number;
  owner_id: number;
  borrower_id: number;
  lent_at: string;
  returned_at: string | null;
  active: boolean;
};

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("added_at");
  const [page, setPage] = useState(1);

  const pageSize = 10;

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState("want_to_read");
  const [totalPages, setTotalPages] = useState("");
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");

  const [selectedShelf, setSelectedShelf] = useState<
    Record<number, string>
  >({});

  const [addingToShelf, setAddingToShelf] = useState<number | null>(
    null
  );

  const [progress, setProgress] = useState<
    Record<number, Progress>
  >({});

  const [progressPages, setProgressPages] = useState<
    Record<number, string>
  >({});

  const [updatingProgress, setUpdatingProgress] = useState<
    number | null
  >(null);

  const [borrowerEmails, setBorrowerEmails] = useState<
    Record<number, string>
  >({});

  const [lendings, setLendings] = useState<
    Record<number, Lending>
  >({});

  const [lendingBook, setLendingBook] = useState<number | null>(
    null
  );

  const [returningBook, setReturningBook] = useState<number | null>(
    null
  );

  async function loadBooks() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search) {
        params.set("search", search);
      }

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      params.set("sort_by", sortBy);
      params.set("sort_order", "desc");
      params.set("page", String(page));
      params.set("page_size", String(pageSize));

      const data = await apiRequest(
        `/books?${params.toString()}`,
        {
          method: "GET",
        },
        token
      );

      setBooks(data);

      await loadProgressForBooks(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load books."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadProgressForBooks(bookList: Book[]) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    const readingBooks = bookList.filter(
      (book) => book.status === "reading"
    );

    const progressResults: Record<number, Progress> = {};

    for (const book of readingBooks) {
      try {
        const data = await apiRequest(
          `/books/${book.id}/progress`,
          {
            method: "GET",
          },
          token
        );

        progressResults[book.id] = data;
      } catch {
        // Ignore individual progress errors.
      }
    }

    setProgress(progressResults);

    const pageValues: Record<number, string> = {};

    for (const book of readingBooks) {
      pageValues[book.id] = String(
        progressResults[book.id]?.current_page ?? 0
      );
    }

    setProgressPages(pageValues);
  }

  async function loadShelves() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const data = await apiRequest(
        "/shelves",
        {
          method: "GET",
        },
        token
      );

      setShelves(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load shelves."
      );
    }
  }

  useEffect(() => {
    loadBooks();
  }, [search, statusFilter, sortBy, page]);

  useEffect(() => {
    loadShelves();
  }, []);

  function resetForm() {
    setTitle("");
    setAuthor("");
    setStatus("want_to_read");
    setTotalPages("");
    setRating("");
    setNotes("");
    setEditingBook(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(book: Book) {
  setTitle(book.title);
  setAuthor(book.author);
  setStatus(book.status);
  setTotalPages(String(book.total_pages));
  setRating(
    book.rating !== null ? String(book.rating) : ""
  );
  setNotes(book.notes || "");
  setEditingBook(book);
  setShowForm(true);

  setTimeout(() => {
    document.getElementById("book-form")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, 100);
}

  function closeForm() {
    resetForm();
    setShowForm(false);
  }

  async function handleSaveBook(event: React.FormEvent) {
    event.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setSaving(true);
    setError("");

    try {
      const bookData = {
        title,
        author,
        status,
        total_pages: Number(totalPages),
        rating: rating ? Number(rating) : null,
        notes: notes || null,
      };

      if (editingBook) {
        await apiRequest(
          `/books/${editingBook.id}`,
          {
            method: "PUT",
            body: JSON.stringify(bookData),
          },
          token
        );
      } else {
        await apiRequest(
          "/books",
          {
            method: "POST",
            body: JSON.stringify(bookData),
          },
          token
        );
      }

      closeForm();
      await loadBooks();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save book."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddToShelf(bookId: number) {
    const shelfId = selectedShelf[bookId];

    if (!shelfId) {
      setError("Please select a shelf first.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setAddingToShelf(bookId);
    setError("");

    try {
      await apiRequest(
        `/shelves/${shelfId}/books/${bookId}`,
        {
          method: "POST",
        },
        token
      );

      setSelectedShelf((current) => ({
        ...current,
        [bookId]: "",
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add book to shelf."
      );
    } finally {
      setAddingToShelf(null);
    }
  }

  async function handleDeleteBook(bookId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this book?"
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setError("");

    try {
      await apiRequest(
        `/books/${bookId}`,
        {
          method: "DELETE",
        },
        token
      );

      await loadBooks();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete book."
      );
    }
  }

  async function handleUpdateProgress(book: Book) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    const currentPage = Number(progressPages[book.id]);

    if (
      !Number.isInteger(currentPage) ||
      currentPage < 0 ||
      currentPage > book.total_pages
    ) {
      setError(
        `Current page must be between 0 and ${book.total_pages}.`
      );
      return;
    }

    setUpdatingProgress(book.id);
    setError("");

    try {
      const data = await apiRequest(
        `/books/${book.id}/progress`,
        {
          method: "POST",
          body: JSON.stringify({
            current_page: currentPage,
          }),
        },
        token
      );

      setProgress((current) => ({
        ...current,
        [book.id]: data,
      }));

      setProgressPages((current) => ({
        ...current,
        [book.id]: String(data.current_page),
      }));

      if (data.status === "finished") {
        await loadBooks();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update reading progress."
      );
    } finally {
      setUpdatingProgress(null);
    }
  }

  async function handleLendBook(bookId: number) {
    const email = borrowerEmails[bookId]?.trim();

    if (!email) {
      setError("Please enter the borrower's email.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setLendingBook(bookId);
    setError("");

    try {
      const data = await apiRequest(
        `/books/${bookId}/lend`,
        {
          method: "POST",
          body: JSON.stringify({
            email,
          }),
        },
        token
      );

      setLendings((current) => ({
        ...current,
        [bookId]: data,
      }));

      setBorrowerEmails((current) => ({
        ...current,
        [bookId]: "",
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to lend book."
      );
    } finally {
      setLendingBook(null);
    }
  }

  async function handleReturnBook(bookId: number) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setReturningBook(bookId);
    setError("");

    try {
      const data = await apiRequest(
        `/books/${bookId}/return`,
        {
          method: "POST",
        },
        token
      );

      setLendings((current) => ({
        ...current,
        [bookId]: data,
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to return book."
      );
    } finally {
      setReturningBook(null);
    }
  }

  const filteredBooks = books;

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 px-6 py-8">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-emerald-950">
              My Books
            </h1>

            <p className="mt-1 text-emerald-800/70">
              Manage your reading collection
            </p>
          </div>

          <button
            type="button"
            onClick={showForm ? closeForm : openAddForm}
            className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            {showForm ? "Cancel" : "Add Book"}
          </button>
        </div>

        {/* Add / Edit Book */}
        {showForm && (
          <form
            id="book-form"
            onSubmit={handleSaveBook}
            className="mb-8 rounded-2xl border border-emerald-100 bg-white/95 p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-emerald-950">
              {editingBook ? "Edit Book" : "Add Book"}
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-emerald-900">
                  Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  required
                  className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-3 text-black outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Book title"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-emerald-900">
                  Author
                </label>

                <input
                  type="text"
                  value={author}
                  onChange={(event) =>
                    setAuthor(event.target.value)
                  }
                  required
                  className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-3 text-black outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Author name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-emerald-900">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                  className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-3 text-black outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="want_to_read">
                    Want to Read
                  </option>

                  <option value="reading">
                    Reading
                  </option>

                  <option value="finished">
                    Finished
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-emerald-900">
                  Total Pages
                </label>

                <input
                  type="number"
                  value={totalPages}
                  onChange={(event) =>
                    setTotalPages(event.target.value)
                  }
                  required
                  min="1"
                  className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-3 text-black outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. 320"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-emerald-900">
                  Rating
                </label>

                <select
                  value={rating}
                  onChange={(event) =>
                    setRating(event.target.value)
                  }
                  className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-3 text-black outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">No rating</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-emerald-900">
                  Notes
                </label>

                <input
                  type="text"
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-3 text-black outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingBook
                    ? "Save Changes"
                    : "Add Book"}
              </button>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-emerald-200 bg-white px-5 py-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Search and Filters */}
        <div className="mb-6 rounded-2xl border border-emerald-100 bg-white/95 p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-emerald-900">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-3 text-black outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Search title or author"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-emerald-900">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-3 text-black outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All statuses</option>
                <option value="want_to_read">
                  Want to Read
                </option>
                <option value="reading">Reading</option>
                <option value="finished">Finished</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-emerald-900">
                Sort By
              </label>

              <select
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-3 text-black outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="added_at">Date Added</option>
                <option value="title">Title</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center text-emerald-700 shadow-sm">
            Loading books...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Books */}
            <div className="grid gap-4 md:grid-cols-2">
              {books.length === 0 ? (
                <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center text-emerald-700 shadow-sm">
                  No books found.
                </div>
              ) : (
                filteredBooks.map((book) => {
                  const bookProgress = progress[book.id];
                  const activeLending = lendings[book.id]?.active;

                  return (
                    <div
                      key={book.id}
                      className="rounded-2xl border border-emerald-100 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                    >
                      {/* Book Header */}
                      <div className="flex items-start justify-between gap-6">
                        <div>
                          <h2 className="text-xl font-semibold text-emerald-950">
                            {book.title}
                          </h2>

                          <p className="mt-1 text-emerald-800/70">
                            by {book.author}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            book.status === "want_to_read"
                              ? "bg-amber-100 text-amber-700"
                              : book.status === "reading"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {book.status === "want_to_read"
                            ? "Want to Read"
                            : book.status === "reading"
                              ? "Reading"
                              : "Finished"}
                        </span>
                      </div>

                      {/* Book Information */}
                      <div className="mt-5 grid gap-4 text-sm text-emerald-800/70 md:grid-cols-3">
                        <div>
                          <span className="font-medium text-emerald-950">
                            Pages:
                          </span>{" "}
                          {book.total_pages}
                        </div>

                        <div>
                          <span className="font-medium text-emerald-950">
                            Rating:
                          </span>{" "}
                          {book.rating ?? "Not rated"}
                        </div>

                        <div>
                          <span className="font-medium text-emerald-950">
                            Added:
                          </span>{" "}
                          {new Date(
                            book.added_at
                          ).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Notes */}
                      {book.notes && (
                        <p className="mt-4 text-sm text-emerald-800/70">
                          <span className="font-medium text-emerald-950">
                            Notes:
                          </span>{" "}
                          {book.notes}
                        </p>
                      )}

                      {/* Reading Progress */}
                      {book.status === "reading" && (
                        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 p-5">
                          <h3 className="font-semibold text-emerald-950">
                            Reading Progress
                          </h3>

                          <div className="mt-3 flex items-center gap-3">
                            <input
                              type="number"
                              min="0"
                              max={book.total_pages}
                              value={
                                progressPages[book.id] ?? "0"
                              }
                              onChange={(event) =>
                                setProgressPages((current) => ({
                                  ...current,
                                  [book.id]: event.target.value,
                                }))
                              }
                              className="w-32 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-black outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />

                            <span className="text-sm text-emerald-800/70">
                              / {book.total_pages} pages
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateProgress(book)
                              }
                              disabled={
                                updatingProgress === book.id
                              }
                              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {updatingProgress === book.id
                                ? "Updating..."
                                : "Update Progress"}
                            </button>
                          </div>

                          <div className="mt-4">
                            <div className="mb-2 flex justify-between text-sm text-emerald-800/70">
                              <span>Progress</span>

                              <span>
                                {bookProgress?.percentage ?? 0}%
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                              <div
                                className="h-full rounded-full bg-emerald-600 transition-all"
                                style={{
                                  width: `${bookProgress?.percentage ?? 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Lending */}
                      <div className="mt-5 rounded-xl border border-lime-200 bg-lime-50/70 p-5">
                        <h3 className="font-semibold text-emerald-950">
                          Lending
                        </h3>

                        {activeLending ? (
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <span className="text-sm text-emerald-800/70">
                              Currently lent out
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleReturnBook(book.id)
                              }
                              disabled={
                                returningBook === book.id
                              }
                              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {returningBook === book.id
                                ? "Returning..."
                                : "Return Book"}
                            </button>
                          </div>
                        ) : (
                          <div className="mt-3 flex flex-wrap gap-3">
                            <input
                              type="email"
                              value={
                                borrowerEmails[book.id] ?? ""
                              }
                              onChange={(event) =>
                                setBorrowerEmails((current) => ({
                                  ...current,
                                  [book.id]: event.target.value,
                                }))
                              }
                              placeholder="Borrower's email"
                              className="w-full max-w-sm rounded-lg border border-emerald-200 bg-white px-4 py-2 text-black outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                handleLendBook(book.id)
                              }
                              disabled={
                                lendingBook === book.id
                              }
                              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {lendingBook === book.id
                                ? "Lending..."
                                : "Lend Book"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openEditForm(book)}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700"
                        >
                          Edit
                        </button>

                        <select
                          value={selectedShelf[book.id] ?? ""}
                          onChange={(event) =>
                            setSelectedShelf((current) => ({
                              ...current,
                              [book.id]: event.target.value,
                            }))
                          }
                          className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm text-black outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="">Select shelf</option>

                          {shelves.map((shelf) => (
                            <option
                              key={shelf.id}
                              value={shelf.id}
                            >
                              {shelf.name}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            handleAddToShelf(book.id)
                          }
                          disabled={
                            !selectedShelf[book.id] ||
                            addingToShelf === book.id
                          }
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {addingToShelf === book.id
                            ? "Adding..."
                            : "Add to Shelf"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteBook(book.id)
                          }
                          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setPage((currentPage) =>
                    Math.max(1, currentPage - 1)
                  )
                }
                disabled={page === 1 || loading}
                className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm font-medium text-emerald-800">
                Page {page}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((currentPage) => currentPage + 1)
                }
                disabled={
                  books.length < pageSize || loading
                }
                className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}