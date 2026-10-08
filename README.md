# BookNest

BookNest is a full-stack reading tracker application that helps users manage their personal book collection, organize books into custom shelves, track reading progress, share shelves with other users, and lend books.

## Features

### Authentication & Security
- User signup with name, email, and password validation
- Password strength validation
- Passwords securely hashed using bcrypt
- JWT-based authentication
- Short-lived access tokens
- Refresh tokens for maintaining authenticated sessions
- Protected backend endpoints
- Backend authorization ensures users can access only their own books and resources unless sharing permissions allow access
- Unauthenticated and invalid/expired token requests return HTTP 401

### Book Management
- Add books with title, author, page count, status, rating, and notes
- Edit book details
- Delete books
- Search books
- Filter books by reading status
- Sort books by date added, title, or rating
- Pagination
- Reading statuses:
  - Want to Read
  - Reading
  - Finished

### Reading Progress
- Track the current page of a book
- Automatically calculate reading percentage
- Prevent progress from exceeding the total page count
- Automatically mark a book as Finished when the final page is reached

### Custom Shelves
- Create custom shelves
- View shelf details
- Add books to shelves
- Remove books from shelves
- Delete shelves

### Shared Shelves
- Share shelves with other registered users
- Viewer permission for read-only access
- Editor permission for modifying shared shelf contents
- Change collaborator permissions
- Remove collaborators
- Backend authorization enforces shelf permissions

### Book Lending
- Lend books to registered users using their email address
- Prevent lending a book to yourself
- Prevent lending a book that is already actively lent
- View active borrowed books
- Return lent books
- Lending and return actions are recorded in the system

### Dashboard
The dashboard provides reading statistics including:
- Total books
- Want to Read count
- Currently Reading count
- Finished books
- Books finished this year
- Average rating
- Currently lent books
- Shared shelves
- Shelf with the most books

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- FastAPI
- Python
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
│   ├── .env
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── app/
│   │   ├── books/
│   │   ├── dashboard/
│   │   ├── shelves/
│   │   └── signup/
│   ├── lib/
│   └── ...
│
├── .gitignore
└── README.md
```

## Authentication Flow

BookNest uses JWT authentication with access and refresh tokens.

### Access Token
The access token is short-lived and is used to authenticate API requests.

Default expiration:

```text
15 minutes
```

### Refresh Token
The refresh token has a longer lifetime and can be used to obtain a new access token after the access token expires.

Default expiration:

```text
7 days
```

### Password Security

User passwords are never stored as plain text. Passwords are hashed using bcrypt before being stored in the database.

### Authorization

Authentication is enforced at the backend level. Protected endpoints require a valid access token.

The backend also checks resource ownership and sharing permissions before allowing operations.

For example:
- Users can manage their own books.
- Shelf owners can manage their shelves.
- Shared shelf viewers have read-only access.
- Shared shelf editors can modify shared shelf contents.
- Users cannot access another user's private books.

## API Overview

### Authentication

```text
POST /auth/signup
POST /auth/login
POST /auth/refresh
```

### Books

```text
POST   /books
GET    /books
PUT    /books/{book_id}
DELETE /books/{book_id}
```

### Reading Progress

```text
POST /books/{book_id}/progress
GET  /books/{book_id}/progress
```

### Lending

```text
POST /books/{book_id}/lend
POST /books/{book_id}/return
GET  /books/borrowed
```

### Shelves

```text
POST   /shelves
GET    /shelves
GET    /shelves/{shelf_id}
PUT    /shelves/{shelf_id}
DELETE /shelves/{shelf_id}
```

Additional endpoints are available for adding/removing books and managing shared shelf collaborators.

## Environment Variables

Create a `.env` file inside the `backend` directory.

Example:

```env
DATABASE_URL=postgresql+psycopg://username:password@localhost:5432/booknest
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

Use a strong secret key for production deployments.

## Backend Setup

From the project root:

```powershell
cd D:\Booknest\backend
```

Create and activate the virtual environment:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Start the backend:

```powershell
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://localhost:8000
```

FastAPI interactive documentation:

```text
http://localhost:8000/docs
```

## Frontend Setup

Open another terminal:

```powershell
cd D:\Booknest\frontend
```

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

The frontend will be available at:

```text
http://localhost:3000
```

## Testing Completed

The following functionality has been tested during development:

- User signup and login
- Protected API endpoints
- Unauthenticated request returning HTTP 401
- Invalid/expired access token returning HTTP 401
- Book creation and management
- Book search, filtering, sorting, and pagination
- Custom shelf creation
- Adding books to shelves
- Shared shelves
- Viewer and Editor permissions
- Collaborator removal
- Reading progress updates
- Automatic completion when reaching the final page
- Lending books to another registered user
- Preventing self-lending
- Preventing duplicate active lending
- Returning lent books
- Viewing borrowed books

## Example Reading Progress

A book with 100 pages can be updated from:

```text
50 / 100 pages → 50%
```

to:

```text
75 / 100 pages → 75%
```

When the reader reaches:

```text
100 / 100 pages → 100%
```

the book is automatically marked as:

```text
Finished
```

## Project Goal

BookNest demonstrates a complete full-stack application with authentication, authorization, CRUD operations, relational database design, reading tracking, collaboration, and lending functionality.

The project focuses on building a practical and secure reading management experience while keeping the interface simple and easy to use.