# Tours-Backend
This is the backend for a tour management platform that allows users to sign up, login, view active tours, post and read reviews, and book tours. The project includes features such as email notifications for new user signups and password reset, JWT-based authentication, and admin functionalities to manage tours and users.

## Features

### User Features
- **User Authentication**: JWT-based authentication for secure login/signup.
- **Tour Management**: Users can view active tours and book a tour.
- **Reviews**: Users can post reviews for tours they have attended and read reviews from others.
- **Pagination & Sorting**: API endpoints to paginate and sort tours and reviews.
- **File Upload**: Multer used for image upload (e.g., profile pictures and tour images).

### Admin Features
- **Tour Management**: Admins can add, edit, and delete tours.
- **Review Moderation**: Admins can delete reviews.
- **User Management**: Admins can view user details and manage permissions.

### Other Features
- **Email Notifications**: 
  - New user signup triggers a welcome email.
  - Password reset functionality sends reset tokens via email.
- **Aggregation Pipelines**: 
    - Implemented MongoDB aggregation pipelines for statistics, sorting, filtering, and pre/post-processing operations.
  
## Tech Stack

- **Node.js** with **Express.js**: Server-side JavaScript runtime and web framework.
- **MongoDB**: NoSQL database for storing data about users, tours, and reviews.
- **JWT**: JSON Web Tokens for authentication.
- **Multer**: Middleware for handling file uploads (e.g., images).
- **Nodemailer**: Used for sending emails (e.g., password reset and sign-up notifications).
- **Mongoose**: MongoDB object modeling library to interact with the database.
- **Aggregation Pipelines**: For advanced data queries like sorting, filtering, and statistics.

### Prerequisites
- Node.js
  
## Setup & Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/priyanshubisht10/tours-backend.git
   ```
   ```bash
   cd tours-backend
   ```
2. Install the dependencies: 
    ```bash
   npm install
   ```
3. Set up environment variables:
Create a config.env file in the root directory and define the following variables
    ```env
    NODE_ENV=development
    PORT=8000
    DATABASE=
    DATABASE_PASSWORD=
    JWT_SECRET=
    JWT_EXPIRES_IN=90d
    JWT_COOKIE_EXPIRES_IN=90
    EMAIL_PASSWORD=
    EMAIL_USERNAME= 
    EMAIL_FROM=Tours 
    EMAIL_HOST=sandbox.smtp.mailtrap.io
    EMAIL_PORT=25
    SENDGRID_USERNAME=
    SENDGRID_PASSWORD=
    ```
4. Start the development server:
    ```bash
   nodemon server.js
   ```

### Additional Resources
I have also documented this on Medium, Check it out:
https://priyanshubisht10.medium.com/

