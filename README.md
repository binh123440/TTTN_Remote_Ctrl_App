#  TEAM JOKE OF THE DAY

# Wi-Fi Hub Management System 

This project is a comprehensive Wi-Fi Hub Management System featuring a FastAPI backend and a React (Vite + Material UI) frontend. It allows for device management, SSH command execution (via HTTP and a real-time WebSocket terminal), user role management (operator, supervisor, admin, team_lead), session tracking, command logging, and network scanning capabilities.

## Project Structure

```
wifi-hub-scan-docker/
├── docker_linux_machine/       # Docker setup for test Linux SSH environments
│   ├── docker-compose.yml      # Defines services like ubuntu1, ubuntu2, alpine1
│   └── Dockerfile              # Dockerfile for Ubuntu SSH server image
│
├── Frontend/                   # React Frontend Application (Vite based)
│   ├── .env                    # Environment variables (local, gitignored)
│   ├── .env copy FE            # Example environment variables for Frontend
│   ├── .github/                # GitHub specific files (workflows, issue templates)
│   ├── .gitignore              # Frontend specific gitignore
│   ├── package.json            # Frontend dependencies and scripts
│   ├── vite.config.mjs         # Vite configuration
│   └── src/                    # Frontend source code
│       ├── App.jsx             # Main application component with routing
│       ├── api/                # API interaction services
│       ├── components/         # Reusable UI components
│       ├── menu-items/         # Definitions for navigation menus
│       ├── pages/              # Page components
│       │   ├── admin/
│       │   ├── auth/
│       │   ├── operator/
│       │   ├── supervisor/
│       │   └── teamlead/
│       └── routes/             # Route configurations
│
├── myenv/                      # Python virtual environment (gitignored)
│
├── src/                        # Backend FastAPI Application
│   ├── .env                    # Environment variables (local, gitignored)
│   ├── .gitignore              # Backend specific gitignore
│   ├── api/                    # API logic
│   │   ├── crud.py             # CRUD operations for database models
│   │   ├── database.py         # Database connection setup (SQLAlchemy)
│   │   ├── models.py           # SQLAlchemy ORM models
│   │   ├── schemas.py          # Pydantic schemas
│   │   └── utils.py            # Utility functions (auth, hashing)
│   ├── network/                # Network utilities
│   │   ├── ssh_client.py       # SSH client for command execution
│   │   └── scanner.py          # Network scanning functions
│   ├── main.py                 # FastAPI application entry point
│   ├── requirements.txt        # Backend Python dependencies
│   └── app.py                  # (Potentially an older/alternative entry point)
│
├── .gitignore                  # Root gitignore file for the project
└── README.md                   # This file

```

## Features

*   **User Authentication & Authorization:**
    *   Secure login with JWT.
    *   Role-based access control: Admin, Supervisor, Team Lead, Operator.
    *   Password reset functionality.
*   **Device Management:**
    *   Add, view, edit, and delete network devices.
    *   Group devices.
    *   Scan local network, Windows hotspot, and Docker containers for devices.
*   **SSH Command Execution:**
    *   **HTTP Interface:** Execute commands via HTTP. Includes basic file editing simulation for `nano`, `vi`.
    *   **WebSocket Terminal:** Real-time interactive SSH terminal. Supports raw mode.
*   **Session Management:**
    *   Track active user sessions.
    *   Supervisors can view and terminate active operator sessions.
    *   Automatic session termination on logout for operators.
*   **Command Logging & History:**
    *   Log all commands executed by operators.
    *   Supervisors can view command log history with filtering and sorting.
*   **Profile Management (Team Lead):**
    *   Create command profiles (allowed/denied commands).
    *   Assign profiles to operators.
*   **User Management (Admin):**
    *   Create, view, edit, and delete users.
    *   Assign roles to users.
*   **Responsive Frontend:** Built with React, Vite, and Material UI.
*   **Docker Support:**
    *   Includes Docker configuration for test Linux SSH environments.

## Prerequisites

*   Python 3.8+
*   Node.js 16+
*   Yarn (or npm)
*   Docker and Docker Compose
*   A PostgreSQL database

## Setup and Installation

### 1. Backend (FastAPI)

   a. **Navigate to the backend directory:**
      ```bash
      cd src
      ```

   b. **Create and activate a Python virtual environment:**
      ```bash
      python -m venv myenv
      # On Windows: myenv\Scripts\activate
      # On macOS/Linux: source myenv/bin/activate
      ```

   c. **Install Python dependencies:**
      ```bash
      pip install -r requirements.txt
      ```

   d. **Set up Environment Variables:**
      *   Create a `.env` file in the [src](http://_vscodecontentref_/2) directory.
      *   Configure at least:
          ```env
          DATABASE_URL=postgresql://user:password@host:port/database_name
          SECRET_KEY=your_very_secret_key_for_jwt
          ALGORITHM=HS256
          ACCESS_TOKEN_EXPIRE_MINUTES=30
          ```

   e. **Database Setup:**
      *   Ensure your PostgreSQL server is running.
      *   The application may use Alembic for migrations or create tables via SQLAlchemy.
      *   An initial admin user (e.g., `admin1`/`123456`) might be available or creatable via a script/endpoint.

   f. **Run the Backend Server:**
      ```bash
      uvicorn main:app --reload --host 0.0.0.0 --port 8000
      ```
      API will be at `http://localhost:8000`.

### 2. Frontend (React)

   a. **Navigate to the frontend directory:**
      ```bash
      cd Frontend
      ```

   b. **Install Node.js dependencies:**
      ```bash
      yarn install
      # Or: npm install
      ```

   c. **Set up Environment Variables:**
      *   Create a `.env` file in the [Frontend](http://_vscodecontentref_/3) directory (copy from `Frontend/.env copy FE`).
      *   Set `VITE_API_BASE_URL=http://localhost:8000`.

   d. **Run the Frontend Development Server:**
      ```bash
      yarn dev
      # Or: npm run dev
      ```
      Frontend will be at `http://localhost:5173` (or similar).

### 3. Docker Test Environment (Optional)

   a. **Navigate to the Docker directory:**
      ```bash
      cd docker_linux_machine
      ```
   b. **Build and run the containers:**
      ```bash
      docker-compose up -d --build
      ```
      This starts test SSH servers on ports `2201`, `2202`, `2203`.

## Usage

1.  Access the frontend URL (e.g., `http://localhost:5173`).
2.  Login with appropriate credentials.
3.  Utilize features based on your user role.

## API Endpoints (Key Examples)

*   `POST /token`: User login.
*   `GET /users/me`: Get current user.
*   `POST /ssh`: Execute SSH command (HTTP).
*   `GET /devices`: List devices.
*   `GET /logs/commands`: Get command log history.
*   `WS /ws/ssh`: WebSocket for interactive SSH.

Refer to [main.py](http://_vscodecontentref_/4) for all API routes.

## Contributing

Contributions are welcome!
1.  Fork the repository.
2.  Create your feature branch.
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](http://_vscodecontentref_/5) file for more details (assuming the main license file is there or create one at the root).
