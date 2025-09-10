# Cornell Lifted

Welcome!  This is a web app for the Lifted event at Cornell University, where students, faculty, and staff send and receive appreciation messages. The web app allows users to send, view, and download personalized messages, and provides an admin interface for managing the event.

## Background

**Lifted** is a tradition at Cornell that encourages the community to share gratitude and positive messages. Cornellians can send messages to anyone with a NetID (such as friends, faculty, and staff), which are then delivered on the last day of classes physically or digitally. It's a beautiful way to foster a culture of appreciation and connection across campus, and thousands of Cornellians participate each year!

## Project Structure

The repository is organized into two main parts:

### 1. `frontend/` (Next.js + React)
- **Tech Stack:** Next.js (React), TypeScript, Tailwind CSS, AG Grid
- **Purpose:** User-facing web app for sending, viewing, and managing Lifted messages
- **Key Features:**
	- Message sending, viewing, editing, and deleting
	- Admin dashboard for message management
- **Entry Point:** `frontend/src/app/`

### 2. `backend/` (Flask + SQLite)
- **Tech Stack:** Python, Flask, Flask-Login, Flask-OIDC, SQLite, Waitress (prod server)
- **Purpose:** API and admin backend for authentication, user-facing endpoints, and admin tools
- **Key Features:**
	- User authentication (OIDC/Cornell SSO)
	- User-facing and admin APIs
	- PDF/PPTX generation for cards
	- LDAP querying
    - Email sending
- **Entry Point:** `backend/app.py`

## Setup & Running the Project

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.10+
- (Recommended) Create a Python virtual environment for backend

### 1. Backend Setup (Flask)

```sh
cd backend
pip install -r requirements.txt

# Set up environment variables and get db file (ask Reid)
# Make sure you have the correct client_secrets.json and lifted_config.json

# Run the backend server (switch from dev to prod mode in app.py):
python app.py
```

The backend will start on `http://127.0.0.1:5000` (or as configured).

### 2. Frontend Setup (Next.js)

```sh
cd frontend
npm install

# Start the frontend (dev mode):
npm run dev

# Or for production:
npm run build
npm start
```

The frontend will start on `http://localhost:3000` by default.

## Development Notes
- The frontend and backend run independently; API calls from the frontend are proxied to the backend.
- Update `frontend/next.config.ts` if you need to change API proxy settings.
- For OIDC authentication, ensure your environment and secrets are set up as required by Cornell SSO.
- Admin features are protected and require admin status in the backend database.
- If you're running this, you are likely part of Lifted and can just ask Reid for all the details

## Contact
Created and maintained by Reid Fleishman '25, CP XXI (Lifted Lead and Secretary FA24/SP25)

For questions or issues, email [lifted@cornell.edu](mailto:lifted@cornell.edu) or [rf377@cornell.edu](mailto:rf377@cornell.edu) (I'll get emails for both!)