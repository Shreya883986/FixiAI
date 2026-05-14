# FixiAI ✨

![React](https://img.shields.io/badge/React-000000?style=for-the-badge\&logo=react\&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-000000?style=for-the-badge\&logo=typescript\&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-000000?style=for-the-badge\&logo=supabase\&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-000000?style=for-the-badge\&logo=tailwindcss\&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-000000?style=for-the-badge\&logo=razorpay\&logoColor=white)

> AI-powered background removal platform built for creators, developers, freelancers, and e-commerce sellers.

---

## Table of Contents

* [The Problem](#the-problem)
* [How FixiAI Works](#how-fixiai-works)
* [Features](#features)
* [Getting Started](#getting-started)
* [Environment Variables](#environment-variables)
* [Project Structure](#project-structure)
* [Tech Stack](#tech-stack)
* [API Example](#api-example)
* [Future Improvements](#future-improvements)

---

## The Problem

Removing image backgrounds manually takes time, requires expensive software, and often produces inconsistent results.

Content creators, online sellers, and developers need a faster workflow that can generate clean transparent images instantly without complicated editing tools.

FixiAI solves this by using AI-powered background segmentation to remove backgrounds automatically in seconds.

---

## How FixiAI Works

### Step 1 — Upload an Image

Users upload JPG, PNG, or WEBP images through the web interface.

```txt
Upload → AI Processing → Transparent PNG Output
```

---

### Step 2 — AI Removes the Background

The AI segmentation engine detects the foreground subject and removes the background automatically.

* Handles portraits
* Product images
* Social media assets
* E-commerce product shots

---

### Step 3 — Download the Result

The processed image is returned as a transparent PNG ready for:

* E-commerce listings
* Graphic design
* Social media posts
* Professional editing workflows

---

## Features

| Feature                | Details                                            |
| ---------------------- | -------------------------------------------------- |
| AI Background Removal  | Automatically removes image backgrounds in seconds |
| Transparent PNG Export | High-quality transparent image output              |
| Authentication         | Secure login & signup with Supabase                |
| Razorpay Payments      | Integrated payment gateway support                 |
| User Dashboard         | Access uploaded images and download history        |
| Responsive UI          | Mobile-friendly clean modern interface             |
| REST API Support       | Easily integrate with external applications        |
| Cloud Ready            | Deployable on modern cloud platforms               |

---

## Getting Started

Clone the repository:

```bash
git clone https://github.com/your-username/fixiai.git
cd fixiai
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

## Environment Variables

Create a `.env` file in the root directory.

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

Add any additional API keys required for your AI background removal provider.

---

## Project Structure

```bash
src/
├── actions/            # Server actions & API integrations
├── components/         # Shared reusable UI components
├── hooks/              # Custom React hooks
├── integrations/       # Supabase configuration
├── lib/                # Utility functions
├── routes/             # App routes/pages
└── assets/             # Static assets
```

---

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* TanStack Router
* shadcn/ui

### Backend & Services

* Supabase
* Razorpay
* AI Background Removal API

---

## API Example

```bash
curl -X POST https://your-api-endpoint.com/remove-background \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "image=@photo.jpg"
```

---

## Screenshots

Add screenshots of:

* Homepage
![Homepage](https://github.com/Shreya883986/FixiAI/blob/5cef37eff1ce8b9e28f0d8ee069d3aae00458162/2026-05-14%20(3).png)

* Features page
![Features](https://github.com/Shreya883986/FixiAI/blob/5cef37eff1ce8b9e28f0d8ee069d3aae00458162/2026-05-14%20(32).png)

* Sign-in page
![Sign in](https://github.com/Shreya883986/FixiAI/blob/5cef37eff1ce8b9e28f0d8ee069d3aae00458162/2026-05-14%20(14).png)

* Login page
![Login](https://github.com/Shreya883986/FixiAI/blob/5cef37eff1ce8b9e28f0d8ee069d3aae00458162/2026-05-14%20(35).png)

* Dashboard 
![Dashboard](https://github.com/Shreya883986/FixiAI/blob/5cef37eff1ce8b9e28f0d8ee069d3aae00458162/2026-05-14%20(36).png)

* Upload page
![Upload page](https://github.com/Shreya883986/FixiAI/blob/5cef37eff1ce8b9e28f0d8ee069d3aae00458162/2026-05-14%20(37).png)

* Processing screen
 ![Processing screen](https://github.com/Shreya883986/FixiAI/blob/5cef37eff1ce8b9e28f0d8ee069d3aae00458162/2026-05-14%20(39).png)

* History 
 ![History](https://github.com/Shreya883986/FixiAI/blob/5cef37eff1ce8b9e28f0d8ee069d3aae00458162/2026-05-14%20(40).png)

* Pricing Page
 ![Pricing](https://github.com/Shreya883986/FixiAI/blob/5cef37eff1ce8b9e28f0d8ee069d3aae00458162/2026-05-14%20(41).png)

* Setting page
 ![Settings](https://github.com/Shreya883986/FixiAI/blob/5cef37eff1ce8b9e28f0d8ee069d3aae00458162/2026-05-14%20(42).png)

---

## Future Improvements

* Batch image processing
* AI image enhancement
* Background replacement
* Drag-and-drop uploads
* Real-time processing progress
* Browser extension support
* Public API documentation

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Built by Shreya Gupta
