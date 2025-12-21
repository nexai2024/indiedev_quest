# 🕹️ CodeBox: Level Up Your Coding Skills

**CodeBox** is a modern, gamified SaaS-based e-learning platform that turns the journey of learning programming into an immersive experience. Built with a unique pixel-art aesthetic, CodeBox allows users to master development languages through hands-on, interactive exercises.

---

## 🎨 Project Overview

CodeBox moves away from traditional, boring learning management systems. It uses a **pixel-art aesthetic** and **gamification mechanics** to keep users motivated and engaged throughout their learning journey.

### 🔑 Key Features

* **Interactive Coding Lab:** Solve real-world tasks (like the "HTML Detective") directly in the browser with instant feedback.
* **Gamified Progress:** Track your growth with an animated dashboard featuring XP bars, total rewards, and learning streaks.
* **Freemium SaaS Model:**
    * **Free Users:** Access the first 3 chapters of every course to get a taste of the curriculum.
    * **Pro Plan:** A 3-day trial or full subscription unlocks all chapters, advanced exercises, and premium tracks.
* **Curated Learning Paths:** Structured courses for **HTML Beginner, React, Python, and CSS**.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Authentication** | [Clerk](https://clerk.com/) |
| **Database** | [Neon (PostgreSQL)](https://neon.tech/) |
| **Animations** | Framer Motion & CSS Keyframes |

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

1.  **Clone the repo:**
    ```bash
    git clone [https://github.com/yourusername/codebox.git](https://github.com/yourusername/codebox.git)
    cd codebox
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file and add the following:
    ```env
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
    CLERK_SECRET_KEY=your_clerk_secret
    DATABASE_URL=your_neon_db_url
    ```

4.  **Run the app:**
    ```bash
    npm run dev
    ```

---


## 🤝 Contributing
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Developed with 💻 and ☕ by [Vansh Agrawal](https://github.com/your-github-username)**
