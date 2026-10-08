const API_BASE_URL = "http://localhost:8000";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string
) {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && accessToken) {
    const refreshResponse = await fetch(
      `${API_BASE_URL}/auth/refresh`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();

      localStorage.setItem(
        "access_token",
        refreshData.access_token
      );

      const retryHeaders = new Headers(options.headers);

      if (options.body && !retryHeaders.has("Content-Type")) {
        retryHeaders.set("Content-Type", "application/json");
      }

      retryHeaders.set(
        "Authorization",
        `Bearer ${refreshData.access_token}`
      );

      const retryResponse = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
          ...options,
          headers: retryHeaders,
          credentials: "include",
        }
      );

      if (!retryResponse.ok) {
        let message = "Something went wrong.";

        try {
          const data = await retryResponse.json();
          message = data.detail || message;
        } catch {
          // Keep default message.
        }

        throw new Error(message);
      }

      if (retryResponse.status === 204) {
        return null;
      }

      return retryResponse.json();
    }

    localStorage.removeItem("access_token");
    window.location.href = "/";
    return;
  }

  if (!response.ok) {
    let message = "Something went wrong.";

    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // Keep default message if response is not JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function loginUser(
  email: string,
  password: string
) {
  return apiRequest(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
      credentials: "include",
    }
  );
}

export async function signupUser(
  name: string,
  email: string,
  password: string
) {
  return apiRequest(
    "/auth/signup",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
      }),
      credentials: "include",
    }
  );
}