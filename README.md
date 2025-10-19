# 🏆 Streak Wars - The Most Chaotic Habit Tracker Ever Built

**Turn discipline into a game of sabotage, streaks, and social chaos — powered by AI, Convex, and caffeine.**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://your-vercel-deployment-link.com)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Powered by Convex](https://img.shields.io/badge/Powered%20by-Convex-black?style=for-the-badge&logo=convex)](https://convex.dev/)

---

## 🚀 Live Demo

**Access the app**: [https://streakwars.vercel.app](https://streakwars.vercel.app)

---

## 📱 Features Overview

### 🎯 Core Features
- **Habit Tracking**: Create, manage, and track daily habits with streak counting
- **Challenge System**: Create group challenges with friends and compete for points
- **AI-Powered Verification**: Verify habits using Groq AI (photo upload or reading summaries)
- **Smart Habit Discovery**: AI-generated habit ideas powered by Exa research
- **Real-time Updates**: Live updates when friends complete habits or challenges
- **Points & Rewards**: Earn coins for habit completion and compete on leaderboards, use these to sabotage your friends in challenges

### 🤖 AI Features
- **Smart Autocomplete**: Groq-powered habit name suggestions as you type
- **Auto-Generated Descriptions**: Exa-powered actionable habit descriptions
- **Habit Discovery Feed**: Research-based habit ideas from Exa
- **AI Verification**: Photo verification and reading comprehension checks
- **Knowledge Quests**: Weekly AI-generated research challenges

### 🏅 Gamification
- **Streak Tracking**: Visual streak counters with color-coded backgrounds
- **Coin System**: Earn coins for habit completion
- **Haptic Feedback**: Mobile-optimized touch feedback
- **Leaderboards**: Challenge rankings and friend comparisons

---

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **Tailwind CSS** - Utility-first styling
- **TypeScript** - Type-safe development

### **Backend & Database**
- **Convex** - Real-time reactive database
  - TypeScript server functions
  - Built-in authentication
  - Scheduled functions & cron jobs
  - Real-time subscriptions

### **Authentication**
- **Clerk** - User authentication and management
  - Social login (Google, GitHub, etc.)
  - User profiles and sessions

### **AI Services**
- **Groq** - AI-powered features
  - `llama-3.1-8b-instant` for text processing
  - `meta-llama/llama-4-scout-17b-16e-instruct` for multimodal (image + text)
  - Habit verification

- **Exa** - Research and content generation
  - Web search for habit ideas
  - Research-based habit descriptions
  - Knowledge quest generation

### **Deployment**
- **Vercel** - Frontend hosting
- **Convex Cloud** - Backend hosting

---

## 🎮 How to Use

### 1. **Getting Started**
1. Visit the deployed app
2. Sign up using Clerk authentication
3. Complete your profile setup
4. Start creating habits!

### 2. **Creating Habits**
- Click **"+ Add"** in the Habits tab
- Use **Smart Autocomplete** for AI-powered suggestions
- Click **"✨ Generate Ideas"** for research-based habits
- Auto-generated descriptions appear when you tab out of the name field

### 3. **Completing Habits**
- Click **"Complete"** button for any active habit
- Enjoy coin rewards
- Optional: Click **"Verify with AI"** for photo or reading verification

### 4. **Creating Challenges**
- Go to **Challenges** tab
- Click **"Create Challenge"**
- Add friends and select habits
- Customize challenge settings

### 5. **AI Verification**
- **Photo Verification**: Upload a photo showing you doing the habit
- **Reading Verification**: Provide book name, page range, and summary
- AI analyzes and returns confidence score

### 6. **Exploring New Habits**
- Visit **Explore** tab
- Browse AI-generated habit ideas
- Click **"✨ Auto-Generate"** for fresh suggestions
- Add interesting habits to your list

---

## 🔧 API Services Explained

### **Groq Integration**
```typescript
// Smart autocomplete suggestions
getHabitSuggestions(query: string) → string[]

// Habit verification
verifyHabitWithPhoto(image: string, habitName: string) → VerificationResult
verifyHabitWithReading(bookName: string, pages: string, summary: string) → VerificationResult
```

**Use Cases:**
- Real-time habit name suggestions as you type
- Photo verification for visual habits (exercise, cooking, etc.)
- Reading comprehension verification for learning habits

### **Exa Integration**
```typescript
// Habit discovery
getHabitIdeas() → HabitIdea[]

// Description generation
generateHabitDescription(habitName: string) → string

// Knowledge quests
generateChallenge(topic?: string) → KnowledgeQuest
```

**Use Cases:**
- Research-based habit suggestions
- Auto-generated actionable descriptions
- Weekly knowledge quest challenges

### **Convex Backend**
```typescript
// Real-time queries
useQuery(api.habits.getUserHabitsWithChallenges, { userId })
useQuery(api.challenges.getUserChallenges, { userId })

// Mutations
useMutation(api.habits.completeHabit)
useMutation(api.challenges.joinChallenge)

// Actions (for AI calls)
useAction(api.groqVerificationActions.verifyHabitWithGroqAction)
useAction(api.exaActions.getHabitIdeasAction)
```

**Use Cases:**
- Real-time habit tracking
- Live challenge updates
- Scheduled streak checks
- Monthly settlements

---

## 📊 Database Schema

### **Core Tables**
- **users**: User profiles and stats
- **habits**: Individual habit definitions
- **habitCompletions**: Daily completion records with verification
- **challenges**: Group challenge definitions
- **challengeParticipants**: User participation in challenges
- **habitChallenges**: Audit challenges for verification

### **Key Features**
- Real-time reactivity
- Automatic indexing
- Type-safe queries
- Built-in authentication

---

## 🎨 UI/UX Features

### **Mobile-First Design**
- Responsive layout optimized for mobile
- Touch-friendly buttons and interactions
- Haptic feedback for iOS/Android
- Smooth animations and transitions

### **Visual Feedback**
- **Streak Colors**: Gray → Green → Gold → Red (danger zone)
- **Coin Rewards**: Visual coin counter
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages

### **Accessibility**
- High contrast text (black text throughout)
- Keyboard navigation support
- Screen reader friendly
- Focus indicators

---

## 🔐 Security & Privacy

### **Authentication**
- Secure Clerk integration
- Social login options
- Session management
- User profile protection

### **Data Protection**
- Type-safe database operations
- Input validation and sanitization
- API key protection
- Secure image upload handling

---

## 🚀 Deployment

### **Frontend (Vercel)**
```bash
# Build and deploy
npm run build
npm run start
```

### **Backend (Convex)**
```bash
# Deploy to Convex Cloud
npx convex deploy
```

### **Environment Variables**
```env
# Required for AI features
GROQ_API_KEY=your_groq_api_key
EXA_API_KEY=your_exa_api_key

# Clerk authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Convex
CONVEX_DEPLOYMENT=your_convex_deployment
```

---

## 📈 Performance

### **Optimizations**
- **Real-time Updates**: Instant UI updates via Convex reactivity
- **Image Compression**: Client-side compression for photo uploads
- **Debounced API Calls**: 300ms debounce for autocomplete
- **Caching**: In-memory caching for AI responses
- **Lazy Loading**: Component-level code splitting

### **Metrics**
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 2s
- **Real-time Latency**: < 100ms
- **AI Response Time**: < 2s

---

## 🤝 Contributing

### **Development Setup**
```bash
# Clone repository
git clone https://github.com/your-username/streakwars.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### **Code Structure**
