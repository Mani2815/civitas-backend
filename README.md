# CIVITAS - Smart City Complaint Management & Analytics System (Backend API)

Welcome to the backend API of **CIVITAS**, a comprehensive Smart City Complaint Management & Analytics System. CIVITAS enables citizens to file, upvote, and track municipal complaints, while empowering municipal administrators and staff to organize, assign, prioritize, resolve, and analyze issues dynamically using an automated priority engine and AI-driven insights.

> [!IMPORTANT]
> **Repository Scope & Frontend Reference**
> This repository contains **only the Backend API** for CIVITAS.
> The corresponding frontend application (React / Vite) is located in the companion repository:
> 👉 **[civitas-frontend Repository](https://github.com/Mani2815/civitas-frontend)**

---

## 🚀 Key Features

- **Role-Based Access Control (RBAC):**
  - **Citizen:** Can register, login, view/file/upvote complaints, view personal activities, add comments, and consult the AI chatbot.
  - **Staff:** Assigned to departments, can update complaint status (e.g., Pending ➜ In Progress ➜ Resolved), and add comments.
  - **Admin:** Has full control to manage users, create departments, assign staff, delete complaints, and access comprehensive city-wide analytics dashboards.
- **Dynamic Priority Scoring Engine:**
  - Automatically calculates priority levels (`Low`, `Medium`, `High`, `Critical`) using a weighted formula:
    $$\text{Priority Score} = (\text{Category Weight} \times 0.4) + (\text{Time Pending} \times 0.3) + (\text{Hotspot Density} \times 0.3) + \text{Upvotes}$$
  - A scheduled hourly cron job recalculates all active priorities to handle escalating urgencies.
- **CIVITAS AI Assistant (Gemini integration):**
  - Uses the Google Generative AI SDK (`gemini-2.0-flash`, `gemini-2.5-flash`) to process and answer citizens' municipal inquiries.
  - Embedded regex rule-based pre-filtering to handle common tasks (e.g., how to submit complaints, tracking status, showing categories) immediately.
- **SLA & Deadline Monitoring:**
  - Automated tracking of Service Level Agreement (SLA) deadlines based on the category of the issue (e.g., electricity, water, sanitation).
- **Location-Based Hotspot Analysis:**
  - Compares latitude and longitude coordinates of active complaints to calculate regional issue densities within a 1 km radius.
- **File & Photo Uploads:**
  - Supports uploading up to 5 photos per complaint using Multer, storing them either locally or remotely using Cloudinary CDN integration.

---

## 🛠️ Tech Stack

- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose ODM](https://mongoosejs.com/)
- **AI Integration:** [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Google Gemini API)
- **Task Scheduling:** [Node-Cron](https://www.npmjs.com/package/node-cron)
- **File Upload & Storage:** [Multer](https://github.com/expressjs/multer) & [Cloudinary](https://cloudinary.com/) (Optional)
- **Security:** [Helmet](https://helmetjs.github.io/), CORS, Bcrypt.js (Password Hashing)
- **Session & Auth:** JWT (JSON Web Tokens) & Cookie-Parser

---

## 📂 Project Structure

```
civitas-backend/
├── src/
│   ├── config/            # Database and Cloudinary configurations
│   │   ├── db.js
│   │   └── cloudinary.js
│   ├── controllers/       # Request handlers & logic mapping
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   ├── chatbotController.js
│   │   ├── commentController.js
│   │   ├── complaintController.js
│   │   ├── departmentController.js
│   │   └── userController.js
│   ├── middleware/        # Authentication, RBAC, file upload, error handling
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   ├── roleMiddleware.js
│   │   └── upload.js
│   ├── models/            # Mongoose schemas for collections
│   │   ├── Admin.js
│   │   ├── Citizen.js
│   │   ├── Comment.js
│   │   ├── Complaint.js
│   │   ├── Department.js
│   │   ├── Staff.js
│   │   └── StatusTimeline.js
│   ├── routes/            # Express endpoint mappings
│   │   ├── analyticsRoutes.js
│   │   ├── authRoutes.js
│   │   ├── chatbotRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── complaintRoutes.js
│   │   ├── departmentRoutes.js
│   │   └── userRoutes.js
│   ├── scripts/           # Migration and testing utility scripts
│   │   ├── migrateUsers.js
│   │   └── testUpvote.js
│   ├── services/          # Business logic separation layer
│   │   ├── analyticsService.js
│   │   └── complaintService.js
│   ├── utils/             # Helper classes, validators, and equations
│   │   ├── asyncWrapper.js
│   │   ├── priorityCalculator.js
│   │   └── validators.js
│   ├── app.js             # Express application initialization
│   └── server.js          # Main entrypoint, cron configuration & DB connection
├── .env.example           # Reference configuration variables file
├── package.json           # Project dependencies & scripts
└── README.md              # Project documentation
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
NODE_ENV=development
PORT=5000

# Database Connection (MongoDB)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smart_city_cms

# Authentication Security
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Google Gemini API Key (Required for Chatbot AI fallback)
GEMINI_API_KEY=your_gemini_api_key_here

# Cloudinary Credentials (Optional - Set USE_CLOUDINARY=true to enable)
USE_CLOUDINARY=false
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS Configuration (Client App Domain)
CLIENT_URL=http://localhost:5173
```

---

## ⚡ API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /register` - Register a new citizen account
- `POST /login` - Log in to get authentication token/cookie
- `POST /logout` - Log out and clear cookies
- `GET /me` - Get logged-in user profile details
- `GET /users` - Get all users (Admin only)
- `POST /create-staff` - Create new municipal staff members (Admin only)

### Complaints (`/api/complaints`)
- `POST /` - File a complaint with up to 5 photos (Citizen only)
- `GET /` - Fetch all complaints (Supports search, filter, sorting, pagination)
- `GET /:id` - Get details of a specific complaint (including logs/timeline)
- `POST /:id/upvote` - Upvote a complaint (Citizen only)
- `PATCH /:id/status` - Update complaint status (Staff/Admin only)
- `PATCH /:id/assign` - Assign a complaint to staff/department (Admin only)
- `DELETE /:id` - Delete a complaint (Admin only)
- `POST /:id/comments` - Add a comment to a complaint
- `GET /:id/comments` - List all comments on a complaint

### Analytics (`/api/analytics`)
- `GET /citizen/stats` - Personal activity statistics (Citizen only)
- `GET /city-stats` - Basic city-wide overview statistics
- `GET /impact-stats` - Public impact data (unauthenticated)
- `GET /overview` - System-wide admin dashboard numbers (Admin only)
- `GET /category-distribution` - Complaint categories breakdown (Admin only)
- `GET /status-distribution` - Complaint status distributions (Admin only)
- `GET /trends` - Time-series trends of complaints (Admin only)
- `GET /departments` - Department response & resolution analytics (Admin only)
- `GET /heatmap` - Geographic heatmap coordinate feed (Admin only)

### Departments (`/api/departments`)
- `GET /` - View all departments
- `GET /:id` - View department details
- `POST /` - Create a department (Admin only)
- `PUT /:id` - Update department details (Admin only)
- `PATCH /:id/assign-staff` - Assign staff members to a department (Admin only)

### Users (`/api/users`)
- `GET /profile` - Retrieve profile information
- `PUT /profile` - Update profile information

### Chatbot (`/api/chatbot`)
- `POST /message` - Post a query to CIVITAS AI Assistant (with fallback to Gemini API)

---

## ⚙️ Setup and Installation

### 1. Clone & Navigate
```bash
git clone https://github.com/Mani2815/civitas-backend.git
cd civitas-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the template variables file and fill out the configurations:
```bash
cp .env.example .env
```

### 4. Database User Migration (If applicable)
If you are transitioning data from an older single-collection `users` structure to the separate `citizens`/`staffs`/`admins` collection scheme, execute:
```bash
node src/scripts/migrateUsers.js
```

### 5. Running the Application
- **Development Mode (with Nodemon):**
  ```bash
  npm run dev
  ```
- **Production Mode:**
  ```bash
  npm start
  ```

---

## 🤝 Contributing & Support
For any questions regarding API functionality, database schemas, or service layers, please contact the repository administrator. 
For frontend issues and styling changes, refer to the [civitas-frontend](https://github.com/Mani2815/civitas-frontend) repository.
