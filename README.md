# 🕹️ CodeBox: Level Up Your Coding Skills

**CodeBox** is a modern, gamified SaaS-based e-learning platform designed to turn the journey of learning programming into an immersive, retro-inspired adventure. With a unique pixel-art aesthetic, CodeBox engages users of all ages through interactive coding challenges, real-time feedback, and a rewarding progression system.

---

## 🎨 Project Overview

CodeBox moves away from traditional, static learning management systems. It uses **gamification mechanics**—including XP systems, rewards, and a "level-up" progression—to keep users motivated. Whether you are hunting for bugs in "HTML Detective" mode or building React components, CodeBox makes every line of code feel like a quest.

### 🔑 Key Features

* **Pixel-Style Game UI:** Animated landing screens and a retro-themed interface designed for high engagement and interactive learning.
* **Interactive Coding Lab:** An integrated in-browser code editor (**Monaco/CodeMirror**) that allows users to complete challenges and see real-time results.
* **Gamified Progress & Leaderboard:**
    * **XP System:** Earn experience points for every exercise completed.
    * **Total Rewards:** Track your achievements and see where you stand on the community leaderboard.
* **Course Management:** A structured syllabus featuring paths for **HTML, CSS, React, and Python**, organized into chapters and specific exercises.
* **Freemium SaaS Model:** * **Free Users:** Access initial chapters of every course.
    * **Pro Plan:** Integrated billing for premium access to advanced exercises and full course tracks.
* **Secure Authentication:** User sign-up/sign-in via Email or Gmail powered by **Clerk**.
* **Performance Optimized:** Built with smart caching and performance optimizations for a seamless user experience.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend Framework** | **Next.js 16** (App Router) + **React 19** |
| **Language** | **TypeScript** |
| **Styling** | **Tailwind CSS** + **shadcn/ui** |
| **Database** | **Neon (PostgreSQL)** |
| **ORM** | **Drizzle ORM** |
| **Authentication** | **Clerk** |
| **Billing & Payments** | **Clerk Billing / Stripe** |
| **Animations** | **Framer Motion** & CSS Keyframes |

---

## 📸 Screenshots

### 🖥️ Animated Dashboard
The central hub for tracking your XP, total rewards, and active learning streaks.
![Dashboard](https://github.com/user-attachments/assets/c1ab26.jpg)

### 📚 Course Syllabus & Pro Access
Clearly structured chapters with "Pro" badges indicating premium content.
![Curriculum](https://github.com/user-attachments/assets/c1ae49.png)

### 🔍 Interactive Coding Lab
The "HTML Detective" mode where users hunt down and fix errors to earn XP.
![Exercise Lab](https://github.com/user-attachments/assets/c1b1ae.png)

---

## 🚀 Installation & Setup

To get CodeBox running locally, follow these steps:

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/im-vansh/Codebox-Leaning_Platform.git
    cd codebox
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add the following:
    ```env
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
    CLERK_SECRET_KEY=your_clerk_secret
    
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

    NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
    
    DATABASE_URL=your_neon_db_url
    
    ```

4.  **Sync Database Schema:**
    ```bash
    npx drizzle-kit push
    ```

5.  **Run the application:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤝 Contributing

1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

**Developed with 💻 and ☕ by [Vansh Agrawal](https://github.com/im-vansh)**
