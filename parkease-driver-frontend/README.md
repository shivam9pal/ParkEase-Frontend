# ParkEase Driver Frontend

A modern React+Vite frontend application for the ParkEase driver management platform. This application enables drivers to find, book, and manage parking spaces with real-time notifications and payment integration.

## Features

- 🚗 **Smart Parking Search**: Find available parking spots near your location
- 📍 **Real-time Map Integration**: View parking lots with Leaflet maps
- 💳 **Secure Payments**: Integrated payment processing
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- 🔐 **Authentication**: Secure login with JWT tokens
- 📊 **Dashboard**: View booking history and vehicle management
- 🔔 **Notifications**: Real-time updates on bookings and payments

## Tech Stack

- **Frontend Framework**: React 19.2.4
- **Build Tool**: Vite 8.0
- **Routing**: React Router DOM 7.14
- **Styling**: Tailwind CSS 3.4 + PostCSS
- **State Management**: Zustand 5.0
- **Form Handling**: React Hook Form 7.72 + Zod 4.3
- **HTTP Client**: Axios 1.14
- **Maps**: React-Leaflet 5.0
- **UI Components**: Radix UI + Lucide Icons
- **Linting**: ESLint 9.39

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd parkease-driver-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your API endpoint
# VITE_API_BASE_URL=http://localhost:8080
```

### Development

```bash
# Start development server
npm run dev

# Server runs at http://localhost:5173
```

### Build

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview

# Output will be in dist/ directory
```

### Linting

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint -- --fix
```

## Project Structure

```
src/
├── api/                 # API integration files
│   ├── axiosInstance.js # Axios configuration with interceptors
│   ├── authApi.js      # Authentication endpoints
│   ├── bookingApi.js   # Booking operations
│   ├── paymentApi.js   # Payment processing
│   └── ...
├── components/         # Reusable React components
│   ├── common/         # Shared components (Navbar, Spinner, etc)
│   ├── booking/        # Booking-related components
│   └── payment/        # Payment components
├── hooks/              # Custom React hooks
│   ├── useAuth.js      # Authentication logic
│   └── useGeolocation.js # Geolocation utilities
├── pages/              # Page components
│   ├── public/         # Unauthenticated pages
│   └── driver/         # Driver dashboard pages
├── routes/             # Route configuration
├── store/              # Zustand state management
├── utils/              # Utility functions
├── App.jsx             # Root component
└── main.jsx            # Entry point
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8080

# For production:
# VITE_API_BASE_URL=https://api.parkease.com
```

See `.env.example` for all available options.

## Deployment

### Quick Deployment

**Vercel** (Recommended)
```bash
npm install -g vercel
vercel
```

**Netlify**
1. Connect your GitHub repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`

**Docker**
```bash
docker build -t parkease-driver .
docker run -p 3000:80 parkease-driver
```

For comprehensive deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## API Integration

The application connects to a ParkEase backend API. Ensure the API server is running before starting the frontend:

- Development: `http://localhost:8080`
- Production: Point to your production API URL

All API requests include JWT authentication tokens automatically.

## Authentication

- Login/Register: Secure authentication with JWT
- Token Management: Automatic token refresh and 401 error handling
- Protected Routes: Role-based access control for driver features

## Responsive Design

Built with mobile-first approach using Tailwind CSS:
- ✅ Mobile (320px+)
- ✅ Tablet (768px+)
- ✅ Desktop (1024px+)

## Performance Optimizations

- Code splitting for vendor bundles
- Minification and tree shaking
- Console logs removed in production
- CSS optimization via Tailwind

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Submit a Pull Request

## License

This project is proprietary software for ParkEase Inc.

## Support

For issues and suggestions:
1. Check existing issues on GitHub
2. Create a new issue with detailed description
3. Contact the development team

## Changelog

### v1.0.0 (Current)
- Initial release with core parking features
- Dashboard and booking management
- Payment integration
- Real-time notifications
- Responsive design
- Production-ready build configuration

---

**Last Updated**: April 2026
**Maintained by**: ParkEase Development Team

