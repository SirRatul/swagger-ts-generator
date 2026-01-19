# 🚀 Swagger TypeScript Generator

A full-stack TypeScript application that extracts Swagger/OpenAPI specifications from HTML URLs and generates clean, type-safe TypeScript interfaces for your API endpoints.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

- 📝 **HTML URL Support** - Enter Swagger UI URLs directly (not just JSON URLs)
- 🔍 **Smart JSON Detection** - Automatically extracts the JSON spec from HTML pages
- ✅ **Selective Generation** - Choose which endpoints to generate types for
- 🎨 **Beautiful UI** - Modern, responsive interface with TailwindCSS
- 📦 **Request/Response Types** - Generates both request and response interfaces
- ⚖️ **TypeScript Comparator** - Validates your manually written interfaces against the Swagger spec
- 🔄 **Recursive Comparison** - Detailed diffing for nested objects to catch deep discrepancies
- 📅 **Smart Type Matching** - Supports `Date` for date-time and flexible `integer`/`number` matching
- 💾 **Download & Copy** - Export generated code as `.ts` files or copy to clipboard
- 🎯 **Syntax Highlighting** - Beautiful code viewer with TypeScript highlighting

## 🏗️ Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **TypeScript** - Type-safe backend code
- **Axios** - HTTP client for fetching Swagger specs
- **Cheerio** - HTML parsing to extract JSON URLs

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe frontend code
- **TailwindCSS** - Utility-first CSS framework
- **Monaco Editor** - VS Code-like editor for viewing and editing code

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Clone or Setup
```bash
# Navigate to your project directory
cd swagger-ts-generator
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server
npm run dev
```

The backend server will start on **http://localhost:5000**

### Frontend Setup

Open a **new terminal** and run:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on **http://localhost:3000**

## 🚀 Usage

### Step 1: Enter Swagger URL
1. Open http://localhost:3000 in your browser
2. Enter your Swagger UI URL (e.g., `https://petstore.swagger.io/`)
3. Click "🚀 Fetch Endpoints"

### Step 2: Select Endpoints
- Review all detected API endpoints
- Use checkboxes to select endpoints you want to generate types for
- Or click "Select All" to choose all endpoints
- Click "✨ Generate TypeScript"

### Step 3: Export Code
- View the generated TypeScript interfaces
- Click "📋 Copy" to copy to clipboard
- Or click "💾 Download .ts" to save as a file

### Step 4: Check Interface Compliance (Optional)
- Use the **TypeScript Interface Generator** section below the generator
- Select an endpoint and choose **Request** or **Response** comparison mode
- Paste your manually written TypeScript interface
- Click **Compare Interfaces**
- View detailed report of **Missing**, **Extra**, and **Mismatch** fields (supports recursive object checking)

## 📋 Example

### Input
Swagger URL: `https://petstore.swagger.io/`

### Output
```typescript
// ============================================================
// GET /pet/{petId}
// ============================================================

export interface GetPetByPetIdRequest {
  // No request body schema defined
}

export interface GetPetByPetIdResponse {
  id?: number;
  name: string;
  category?: {
    id?: number;
    name?: string;
  };
  photoUrls: string[];
  tags?: {
    id?: number;
    name?: string;
  }[];
  status?: 'available' | 'pending' | 'sold';
}

// ============================================================
// POST /pet
// ============================================================

export interface PostPetRequest {
  id?: number;
  name: string;
  category?: {
    id?: number;
    name?: string;
  };
  photoUrls: string[];
  tags?: {
    id?: number;
    name?: string;
  }[];
  status?: 'available' | 'pending' | 'sold';
}

export interface PostPetResponse {
  id?: number;
  name: string;
  category?: {
    id?: number;
    name?: string;
  };
  photoUrls: string[];
  tags?: {
    id?: number;
    name?: string;
  }[];
  status?: 'available' | 'pending' | 'sold';
}
```

## 🔧 Configuration

### Backend Port
Edit `backend/src/server.ts`:
```typescript
const PORT = process.env.PORT || 5000;
```

### Frontend API URL
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 📁 Project Structure

```
swagger-ts-generator/
├── backend/
│   ├── src/
│   │   ├── server.ts               # Express server with API routes
│   │   ├── fetchSwagger.ts         # HTML parsing & JSON extraction
│   │   ├── parser.ts               # Swagger Endpoint parsing
│   │   ├── generator.ts            # TypeScript code generation (with Date support)
│   │   ├── tsParser.ts             # TypeScript AST parser
│   │   ├── schemaComparator.ts     # Recursive Schema vs Interface diffing
│   │   ├── compareResponse.ts      # JSON Response comparison logic
│   │   └── types.ts                # Shared typings
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                # Main application page
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Global styles
│   ├── components/
│   │   ├── UrlInput.tsx            # URL input component
│   │   ├── EndpointSelector.tsx    # Endpoint selection UI
│   │   ├── InterfaceComparator.tsx # New: TS Interface Comparison UI
│   │   ├── OutputViewer.tsx        # Code viewer with syntax highlighting
│   │   ├── LoadingOverlay.tsx      # Loading state component
│   │   ├── ThemeProvider.tsx       # Dark/Light mode provider
│   │   └── ThemeToggle.tsx         # Theme switch button
│   ├── lib/
│   │   └── api.ts                  # API client (Axios wrapper)
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
│
└── README.md
```

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev  # Auto-restart on file changes
```

### Frontend Development
```bash
cd frontend
npm run dev  # Hot reload enabled
```

### Production Build

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm start
```

## 🐛 Troubleshooting

### CORS Errors
Make sure the backend server is running on port 5000 and has CORS enabled (already configured).

### Swagger URL Not Working
- Ensure the URL points to a Swagger UI page (HTML), not the JSON directly
- Check if the Swagger page is publicly accessible
- Try with a known working URL like `https://petstore.swagger.io/`

### Failed to Extract JSON URL
The tool tries multiple patterns to find the JSON spec. If it fails:
- Check if the Swagger UI page uses a custom configuration
- Verify the page actually contains `swagger.json` or `openapi.json` references
- Check browser console for detailed error messages

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## ⭐ Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Powered by [Express](https://expressjs.com/)
- Parsing with [Cheerio](https://cheerio.js.org/)

---

**Made with ❤️ and TypeScript**
