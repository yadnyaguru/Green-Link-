# 🌿 GreenLink — React + Spring Boot + MongoDB

GreenLink is a full-stack plant provider and discovery platform. This version replaces the original Node.js/Express backend with **Spring Boot + Java 25** while keeping the React frontend and MongoDB data model/API contract.

## Tech Stack
- Java 25 (latest LTS)
- Spring Boot 3.5
- Spring Web / REST APIs
- Spring Data MongoDB
- Spring Security
- JWT authentication (JJWT)
- BCrypt password hashing
- React + Vite
- MongoDB
- Cloudinary (optional cloud image storage; local fallback included)

## Features
- JWT registration/login/current-user authentication
- BCrypt password hashing
- Complete plant CRUD with image replacement/deletion
- Plant search by name/scientific name/description
- Plant image upload
- Cloudinary integration with local upload fallback
- Provider profile image
- Provider profile update
- Plant listings CRUD
- MongoDB GeoJSON Point + 2dsphere index
- Nearby listing search by latitude/longitude/radius
- Request creation and incoming/sent request views
- Accept/reject/complete request workflow
- REST messaging with 3-second frontend polling
- Provider ratings with one-rating-per-request protection
- Dashboard statistics and 7-day request activity aggregation
- Responsive React UI
- CORS configuration
- Global Spring exception handling
- Environment-variable configuration

## Run Backend
Prerequisites: Java 25+, Maven 3.9+, MongoDB.

```bash
cd backend
# copy .env.example to .env and set values as needed
mvn spring-boot:run
```

Backend: `http://localhost:5000`
Health/root endpoint: `GET http://localhost:5000/`

## Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend: `http://localhost:3000`

`frontend/.env` can contain:
```env
VITE_API_URL=http://localhost:5000/api
```

## Cloudinary
Set all three values in `backend/.env`:
```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```
When configured, plant/profile images are stored in Cloudinary and their secure URLs are saved in MongoDB. When not configured, images are stored under `backend/uploads/` and served by Spring Boot.

## API Contract
The main routes are intentionally compatible with the existing React frontend:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/plants`
- `GET /api/plants/:id`
- `POST /api/plants` (multipart `image`)
- `PUT /api/plants/:id` (multipart `image` optional)
- `DELETE /api/plants/:id`
- `GET /api/listings`
- `GET /api/listings/nearby?lat=&lng=&radius=`
- `GET /api/listings/mine`
- `POST /api/listings`
- `PUT /api/listings/:id`
- `DELETE /api/listings/:id`
- `POST /api/requests`
- `GET /api/requests/mine`
- `GET /api/requests/incoming`
- `PUT /api/requests/:id/status`
- `POST /api/messages`
- `GET /api/messages/:requestId`
- `POST /api/ratings`
- `GET /api/ratings/provider/:providerId`
- `POST /api/users/profile-image`
- `PUT /api/users/profile`
- `GET /api/users/:id`
- `GET /api/dashboard/stats`
- `GET /api/dashboard/provider-stats`

## Architecture
```text
React/Vite
   ↓ Axios REST
Spring Boot Controllers
   ↓
Services / Business Logic
   ↓
Spring Data MongoDB Repositories + MongoTemplate
   ↓
MongoDB
```

Security:
```text
Login → BCrypt password check → JWT
Protected request → JwtAuthenticationFilter → Controller
```

## Notes
The original frontend used Socket.IO for real-time chat. Spring Boot does not provide Socket.IO compatibility out of the box, so this Java version uses REST messaging with a 3-second polling refresh. The messaging data model and REST endpoints remain the same.
