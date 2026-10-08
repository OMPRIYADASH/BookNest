"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type Shelf = {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
};

type Share = {
  id: number;
  shelf_id: number;
  user_id: number;
  role: string;
  created_at: string;
};

export default function ShelvesPage() {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [sharedShelves, setSharedShelves] = useState<Shelf[]>([]);
  const [shares, setShares] = useState<Record<number, Share[]>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [shelfName, setShelfName] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);

  const [shareEmail, setShareEmail] = useState<Record<number, string>>({});
  const [shareRole, setShareRole] = useState<Record<number, string>>({});
  const [sharingShelf, setSharingShelf] = useState<number | null>(null);

  const [loadingShares, setLoadingShares] = useState<number | null>(null);
  const [updatingShare, setUpdatingShare] = useState<number | null>(null);
  const [removingShare, setRemovingShare] = useState<number | null>(null);

  async function loadShelves() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(
        "/shelves",
        { method: "GET" },
        token
      );

      setShelves(data);

      const sharedData = await apiRequest(
        "/shelves/shared-with-me",
        { method: "GET" },
        token
      );

      setSharedShelves(sharedData);

      const sharesData: Record<number, Share[]> = {};

      await Promise.all(
        data.map(async (shelf: Shelf) => {
          try {
            const shelfShares = await apiRequest(
              `/shelves/${shelf.id}/shares`,
              { method: "GET" },
              token
            );

            sharesData[shelf.id] = shelfShares;
          } catch {
            sharesData[shelf.id] = [];
          }
        })
      );

      setShares(sharesData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load shelves."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadShelves();
  }, []);

  function openAddForm() {
    setEditingShelf(null);
    setShelfName("");
    setShowForm(true);
  }

  function openEditForm(shelf: Shelf) {
    setEditingShelf(shelf);
    setShelfName(shelf.name);
    setShowForm(true);
  }

  function closeForm() {
    setEditingShelf(null);
    setShelfName("");
    setShowForm(false);
  }

  async function handleSaveShelf(event: React.FormEvent) {
    event.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    if (!shelfName.trim()) {
      setError("Shelf name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingShelf) {
        await apiRequest(
          `/shelves/${editingShelf.id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              name: shelfName.trim(),
            }),
          },
          token
        );
      } else {
        await apiRequest(
          "/shelves",
          {
            method: "POST",
            body: JSON.stringify({
              name: shelfName.trim(),
            }),
          },
          token
        );
      }

      closeForm();
      await loadShelves();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save shelf."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteShelf(shelfId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this shelf?"
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
        `/shelves/${shelfId}`,
        {
          method: "DELETE",
        },
        token
      );

      await loadShelves();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete shelf."
      );
    }
  }

  async function handleShareShelf(shelfId: number) {
    const email = shareEmail[shelfId]?.trim();
    const role = shareRole[shelfId] || "viewer";

    if (!email) {
      setError("Please enter the collaborator's email.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setSharingShelf(shelfId);
    setError("");

    try {
      await apiRequest(
        `/shelves/${shelfId}/shares`,
        {
          method: "POST",
          body: JSON.stringify({
            email,
            role,
          }),
        },
        token
      );

      setShareEmail((current) => ({
        ...current,
        [shelfId]: "",
      }));

      setShareRole((current) => ({
        ...current,
        [shelfId]: "viewer",
      }));

      await loadShelves();

      alert("Shelf shared successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to share shelf."
      );
    } finally {
      setSharingShelf(null);
    }
  }

  async function loadShares(shelfId: number) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setLoadingShares(shelfId);
    setError("");

    try {
      const data = await apiRequest(
        `/shelves/${shelfId}/shares`,
        {
          method: "GET",
        },
        token
      );

      setShares((current) => ({
        ...current,
        [shelfId]: data,
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load collaborators."
      );
    } finally {
      setLoadingShares(null);
    }
  }

  async function handleRoleChange(
    shelfId: number,
    share: Share,
    newRole: string
  ) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setUpdatingShare(share.id);
    setError("");

    try {
      await apiRequest(
        `/shelves/${shelfId}/shares/${share.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            email: "",
            role: newRole,
          }),
        },
        token
      );

      setShares((current) => ({
        ...current,
        [shelfId]: (current[shelfId] ?? []).map((item) =>
          item.id === share.id
            ? {
                ...item,
                role: newRole,
              }
            : item
        ),
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update collaborator role."
      );
    } finally {
      setUpdatingShare(null);
    }
  }

  async function handleRemoveCollaborator(
    shelfId: number,
    shareId: number
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this collaborator?"
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setRemovingShare(shareId);
    setError("");

    try {
      await apiRequest(
        `/shelves/${shelfId}/shares/${shareId}`,
        {
          method: "DELETE",
        },
        token
      );

      setShares((current) => ({
        ...current,
        [shelfId]: (current[shelfId] ?? []).filter(
          (share) => share.id !== shareId
        ),
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove collaborator."
      );
    } finally {
      setRemovingShare(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Shelves
            </h1>

            <p className="mt-1 text-gray-600">
              Organize your books into custom shelves
            </p>
          </div>

          <button
            type="button"
            onClick={showForm ? closeForm : openAddForm}
            className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white"
          >
            {showForm ? "Cancel" : "Create Shelf"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSaveShelf}
            className="mb-8 rounded-2xl bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-gray-900">
              {editingShelf ? "Rename Shelf" : "Create Shelf"}
            </h2>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Shelf Name
              </label>

              <input
                type="text"
                value={shelfName}
                onChange={(event) => setShelfName(event.target.value)}
                required
                minLength={1}
                maxLength={100}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-black"
                placeholder="e.g. Favorites"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingShelf
                    ? "Save Changes"
                    : "Create Shelf"}
              </button>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm">
            Loading shelves...
          </div>
        ) : (
          <>
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                My Shelves
              </h2>

              {shelves.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm">
                  No shelves yet.
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {shelves.map((shelf) => (
                    <div
                      key={shelf.id}
                      className="rounded-2xl bg-white p-6 shadow-sm"
                    >
                      <h3 className="text-xl font-semibold text-gray-900">
                        {shelf.name}
                      </h3>

                      <p className="mt-2 text-sm text-gray-500">
                        Created{" "}
                        {new Date(
                          shelf.created_at
                        ).toLocaleDateString()}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            window.location.href = `/shelves/${shelf.id}`;
                          }}
                          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
                        >
                          View Shelf
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditForm(shelf)}
                          className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white"
                        >
                          Rename
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteShelf(shelf.id)}
                          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="mt-6 border-t border-gray-200 pt-5">
                        <h4 className="text-sm font-semibold text-gray-900">
                          Share Shelf
                        </h4>

                        <div className="mt-3 flex flex-col gap-3">
                          <input
                            type="email"
                            value={shareEmail[shelf.id] ?? ""}
                            onChange={(event) =>
                              setShareEmail((current) => ({
                                ...current,
                                [shelf.id]: event.target.value,
                              }))
                            }
                            placeholder="collaborator@test.com"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-black outline-none focus:border-black"
                          />

                          <div className="flex flex-wrap gap-3">
                            <select
                              value={shareRole[shelf.id] ?? "viewer"}
                              onChange={(event) =>
                                setShareRole((current) => ({
                                  ...current,
                                  [shelf.id]: event.target.value,
                                }))
                              }
                              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-black outline-none focus:border-black"
                            >
                              <option value="viewer">
                                Viewer
                              </option>

                              <option value="editor">
                                Editor
                              </option>
                            </select>

                            <button
                              type="button"
                              onClick={() =>
                                handleShareShelf(shelf.id)
                              }
                              disabled={
                                sharingShelf === shelf.id
                              }
                              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {sharingShelf === shelf.id
                                ? "Sharing..."
                                : "Share"}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 border-t border-gray-200 pt-5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900">
                            Manage Collaborators
                          </h4>

                          <button
                            type="button"
                            onClick={() => loadShares(shelf.id)}
                            disabled={
                              loadingShares === shelf.id
                            }
                            className="text-sm font-medium text-gray-700 hover:text-black disabled:opacity-50"
                          >
                            {loadingShares === shelf.id
                              ? "Loading..."
                              : "Refresh"}
                          </button>
                        </div>

                        {(shares[shelf.id] ?? []).length === 0 ? (
                          <p className="mt-3 text-sm text-gray-500">
                            No collaborators yet.
                          </p>
                        ) : (
                          <div className="mt-4 space-y-3">
                            {(shares[shelf.id] ?? []).map(
                              (share) => (
                                <div
                                  key={share.id}
                                  className="rounded-lg bg-gray-50 p-4"
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        Collaborator #{share.user_id}
                                      </p>

                                      <p className="mt-1 text-xs text-gray-500">
                                        Current role:{" "}
                                        {share.role === "editor"
                                          ? "Editor"
                                          : "Viewer"}
                                      </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      <select
                                        value={share.role}
                                        onChange={(event) =>
                                          handleRoleChange(
                                            shelf.id,
                                            share,
                                            event.target.value
                                          )
                                        }
                                        disabled={
                                          updatingShare ===
                                          share.id
                                        }
                                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black outline-none disabled:opacity-50"
                                      >
                                        <option value="viewer">
                                          Viewer
                                        </option>

                                        <option value="editor">
                                          Editor
                                        </option>
                                      </select>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveCollaborator(
                                            shelf.id,
                                            share.id
                                          )
                                        }
                                        disabled={
                                          removingShare ===
                                          share.id
                                        }
                                        className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {removingShare ===
                                        share.id
                                          ? "Removing..."
                                          : "Remove"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-10">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                Shared With Me
              </h2>

              {sharedShelves.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm">
                  No shelves have been shared with you.
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {sharedShelves.map((shelf) => (
                    <div
                      key={shelf.id}
                      className="rounded-2xl bg-white p-6 shadow-sm"
                    >
                      <h3 className="text-xl font-semibold text-gray-900">
                        {shelf.name}
                      </h3>

                      <p className="mt-2 text-sm text-gray-500">
                        Shared shelf
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = `/shelves/${shelf.id}`;
                        }}
                        className="mt-5 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
                      >
                        View Shelf
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}