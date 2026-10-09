# BookNest — Reading Tracker

BookNest is a full-stack reading tracker application that helps users manage their personal book collections, organize books into custom shelves, track reading progress, share shelves with other users, and lend books to other readers. It combines book management, collaboration, and reading analytics in a single application.

## Demo Video

**[Watch the BookNest Demo on Loom](https://www.loom.com/share/2d9aa76feae54bbd8e7f72977bf0ab60)**

The demo provides a walkthrough of the application's interface and key features.

## Features

### Authentication and Security
- User registration with name, email, and password validation.
- Password strength validation.
- Secure password hashing using bcrypt.
- JWT-based authentication with access and refresh tokens.
- Protected backend endpoints.
- Backend authorization for user-owned resources and shared resources.
- HTTP 401 responses for unauthenticated or invalid authentication requests.

### Book Management
- Add, view, edit, and delete books.
- Store book details, including title, author, page count, reading status, rating, and notes.
- Search books by title or author.
- Filter books by reading status.
- Sort books by title, rating, or date added.
- Paginate book listings.
- Track books using three reading statuses:
  - Want to Read
  - Reading
  - Finished

### Reading Progress
- Record the current page of a book.
- Calculate reading progress as a percentage.
- Validate page numbers against the total page count.
- Automatically mark a book as Finished when the final page is reached.

### Custom Shelves
- Create and manage custom shelves.
- Add books to and remove books from shelves.
- View books belonging to a shelf.
- Organize books across multiple shelves.
- Delete shelves without deleting the books they contain.

### Shared Shelves and Permissions
- Share shelves with registered users.
- Assign Viewer or Editor permissions.
- Allow viewers to access shared shelf contents without modifying them.
- Allow editors to modify shared shelf contents.
- Manage collaborators and their permissions.
- Enforce shelf ownership and role-based permissions on the backend.

### Book Lending
- Lend books to registered users using their email addresses.
- Prevent lending books to yourself.
- Prevent a book from being lent again while it is already actively lent.
- View borrowed books.
- Record book returns and lending activity.

### Dashboard and Reading Statistics
- View total books and reading-status counts.
- Track books finished during the current year.
- View average book ratings.
- Monitor currently lent books.
- View shared shelves.
- Identify the shelf containing the most books.

## Technology Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- JWT authentication
- bcrypt password hashing

### Database
- PostgreSQL
- SQLAlchemy ORM

## Project Structure

```text
Booknest/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── app/
│   │   ├── books/
│   │   ├── dashboard/
│   │   ├── shelves/
│   │   └── signup/
│   ├── lib/
│   └── ...
├── .gitignore
└── README.md
```

## Authentication and Security

### JWT Authentication

BookNest uses JSON Web Tokens (JWT) to authenticate users and protect API endpoints.

- **Access token:** Used to authenticate API requests and configured with a short expiration period.
- **Refresh token:** Used to obtain a new access token after the current access token expires, subject to server-side validation.

The configured token lifetimes are:

| Token | Configured Lifetime |
|---|---|
| Access token | 15 minutes |
| Refresh token | 7 days |

These values should match the backend configuration.

### Password Security

Passwords are hashed using bcrypt before being stored in the database. Plaintext passwords should never be stored.

### Authorization

Authorization is enforced by the backend to protect user data and shared resources.

- Users can manage their own private books.
- Shelf owners control their shelves and collaborators.
- Viewers have read-only access to shared shelves.
- Editors can modify shared shelf contents within their permissions.
- Unauthorized users cannot perform restricted operations on another user's resources.

### Token Storage and Refresh

The frontend and backend should follow the token storage and refresh strategy implemented in the application. When an access token expires, the client should refresh it and retry the original request if that behavior is implemented.

## API Overview

The following routes illustrate the main API areas. Refer to the actual backend routes for the complete endpoint list and supported methods.

### Authentication

```http
POST /auth/signup
POST /auth/login
POST /auth/refresh
```

### Books

```http
POST   /books
GET    /books
PUT    /books/{book_id}
DELETE /books/{book_id}
```

### Reading Progress

```http
POST /books/{book_id}/progress
GET  /books/{book_id}/progress
```

### Lending

```http
POST /books/{book_id}/lend
POST /books/{book_id}/return
GET  /books/borrowed
```

### Shelves

```http
POST   /shelves
GET    /shelves
GET    /shelves/{shelf_id}
PUT    /shelves/{shelf_id}
DELETE /shelves/{shelf_id}
```

Additional routes may be available for managing shelf contents, collaborators, shared shelves, and lending records.

For the exact routes and request schemas, use the FastAPI interactive documentation after starting the backend.

## Environment Configuration

Create a `.env` file inside the `backend` directory and configure the database connection and authentication settings.

Example:

```env
DATABASE_URL=postgresql+psycopg://username:password@localhost:5432/booknest
JWT_SECRET_KEY=replace-with-a-strong-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

**Important:** These are example values. Use the environment variable names expected by your application, a valid database connection, and a strong secret key. Never commit real credentials or secret keys to GitHub.

## Getting Started

### Prerequisites

Install the following before running the application:

- Python 3.12
- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the Repository

```powershell
git clone https://github.com/OMPRIYADASH/BookNest.git
cd BookNest
```

### 2. Configure the Backend

Open a terminal in the project root and run:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create and configure the backend `.env` file with your PostgreSQL connection details and authentication settings.

Make sure PostgreSQL is running and the configured database exists. Apply the project's database migrations or initialization procedure, if required.

### 3. Start the Backend

From the `backend` directory, run:

```powershell
uvicorn app.main:app --reload
```

The backend will typically be available at:

http://localhost:8000

FastAPI interactive API documentation:

http://localhost:8000/docs

### 4. Configure and Start the Frontend

Open a separate terminal and run:

```powershell
cd frontend
npm install
npm run dev
```

The frontend will typically be available at:

http://localhost:3000

Ensure the frontend's API base URL points to the running backend.

## Testing and Validation

The application is designed to support validation of the following areas:

- User registration and authentication.
- Protected API access and token validation.
- Book creation and management.
- Search, filtering, sorting, and pagination.
- Custom shelf management.
- Shared shelf access and permissions.
- Reading progress validation and completion.
- Lending, borrowing, and book returns.
- Backend authorization and resource ownership.

The actual results depend on the implemented functionality and tests executed against the current version.

## Example Reading Progress

For a book containing 100 pages:

| Current Page | Total Pages | Progress |
|---:|---:|---:|
| 50 | 100 | 50% |
| 75 | 100 | 75% |
| 100 | 100 | 100% |

When the final page is reached, the book can be marked as Finished according to the application's reading-progress logic.

## Project Objective

BookNest demonstrates full-stack application development through authentication, REST API design, relational data modeling, CRUD operations, role-based access control, reading-progress tracking, and collaboration.

The goal is to provide a practical and user-friendly platform for organizing personal reading activities while protecting user data and managing shared resources securely.

## Repository

**GitHub:** [OMPRIYADASH/BookNest](https://github.com/OMPRIYADASH/BookNest)

**Demo:** [Watch BookNest on Loom](https://www.loom.com/share/2d9aa76feae54bbd8e7f72977bf0ab60)