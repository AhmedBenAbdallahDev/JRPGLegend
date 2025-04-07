# JRPGLegend - Retro Gaming Platform

A powerful retro gaming platform built with Next.js, offering seamless emulation and game discovery. Perfect for both casual players and hardcore retro enthusiasts.

## 🌟 Features

- 🎮 Multi-platform emulation (NES, SNES, N64, GBA)
- 🖼️ Multi-source cover image system with automatic fallbacks
- 🔍 Advanced search with fuzzy matching
- 📱 Responsive design for all devices
- 🔒 Secure authentication system
- 🗄️ Flexible storage (local/cloud)
- 🎯 Intelligent game categorization
- 💾 Performance-optimized caching

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- API keys for:
  - ScreenScraper (https://www.screenscraper.fr/)
  - TheGamesDB (https://thegamesdb.net/)
  - Wikimedia API
  - Cloudinary account
  - Neon database

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/AhmedBenAbdallahDev/JRPGLegend.git
cd JRPGLegend
```

2. Create a `.env` file with these required variables:
```env
# Database Connection (PostgreSQL, for example Neon)
DATABASE_URL="your_neon_database_url"
DIRECT_URL="your_neon_direct_url"

# Website URL
NEXT_WEBSITE_URL=your_website_url

# Authentication
AUTH_SECRET=your_auth_secret

# Cloudinary Configuration
NEXT_AWS_S3_BUCKET_NAME=your_cloudinary_cloud_name
NEXT_AWS_S3_KEY_ID=your_cloudinary_api_key
NEXT_AWS_S3_SECRET_ACCESS_KEY=your_cloudinary_api_secret
NEXT_AWS_S3_REGION=not_needed_for_cloudinary

# Image Source
NEXT_PUBLIC_IMAGE_SOURCE=your_cloudinary_url

# ScreenScraper API (https://www.screenscraper.fr/)
SCREENSCRAPER_DEV_ID=your_dev_id (just use your account name)
SCREENSCRAPER_DEV_PASSWORD=your_dev_password (find it in the dev dashboard when you are approved for api access)
SCREENSCRAPER_USER=your_username (just use your account name)
SCREENSCRAPER_PASSWORD=your_password (your account password)
SCREENSCRAPER_SOFTNAME=your_app_name (use any name, this is to log what app is using the api)

# TheGamesDB API (https://thegamesdb.net/)
TGDB_API_KEY=your_tgdb_api_key

# Wikimedia API (not mandatory, you can query the API as a guest)
WIKIMEDIA_CLIENT_ID=your_wikimedia_client_id
WIKIMEDIA_AUTH_TOKEN=your_wikimedia_auth_token
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AhmedBenAbdallahDev/JRPGLegend.git
cd JRPGLegend
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database:
```bash
npx prisma migrate dev
npx prisma db seed (apparently broken ignore it)
```

4. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the platform.

### API Keys Setup

1. **ScreenScraper**:
   - Register at https://www.screenscraper.fr/
   - Get your dev ID and password
   - Create a user account for ssid and sspassword

2. **TheGamesDB**:
   - Register at https://thegamesdb.net/
   - Generate an API key

3. **Wikimedia**:
   - Create an account at https://www.mediawiki.org/
   - Generate API credentials

4. **Cloudinary**:
   - Sign up at https://cloudinary.com/
   - Get your cloud name and API credentials

5. **Neon Database**:
   - Create an account at https://neon.tech
   - Create a new project
   - Get your database connection strings

## 🏗️ Architecture

### Core Components

- **GameCard**: Game information display with dynamic cover images
- **EnhancedGameCover**: Multi-source image handling with fallback system
- **GameEmulator**: Core emulation engine
- **WikiImageFetcher**: Wikimedia integration for cover images

### Storage Architecture

#### Local Development
- SQLite database (kinda broken right now, please ignore)
- Local file system for assets

#### Production Deployment (ignore if just using cloudinary)
Configure your storage with the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

## 🔧 Development


### Database Management

- `npx prisma migrate dev`: Database migrations
- `npx prisma db seed`: Seed data
- `npx prisma studio`: Database management UI

## 📝 Important Notes

- Game ROMs are not included (duhhhhhh)
- Ensure proper licensing for game content
- Follow local emulation laws

## 🤝 Contributing

Contributions are not welcome. Please do not submit Pull Requests with clear descriptions.

## 📄 License

CNS License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Next.js team
- Prisma team
- Project contributors
- My mom