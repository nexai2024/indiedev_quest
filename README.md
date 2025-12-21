# 🕹️ CodeBox: SaaS E-Learning Platform

**CodeBox** is a gamified, SaaS-based e-learning platform designed to make learning to code as engaging as playing an RPG. Users can sign up, master languages like **Java, Python, HTML, and React**, and earn rewards for their progress through hands-on, interactive exercises.

---

## 🎨 Project Essence

CodeBox moves away from traditional, boring learning management systems. It uses a **pixel-art aesthetic** and **gamification mechanics** to keep users motivated. 

### 🌟 Key Features
* **XP & Reward System:** Every exercise completed grants **XP (Experience Points)**, which is tracked on a global dashboard.
* **Daily Streaks:** Stay consistent with an animated streak tracker to encourage daily learning.
* **Interactive Exercises:** Perform tasks directly in the browser—fix broken code, build layouts, and solve challenges.
* **Progression Tracking:** Visual progress bars for every course and chapter.
* **SaaS Membership:** * **Free Tier:** Access to the first 3 chapters of every course.
    * **Pro Plan:** A 3-day full access pass to unlock all chapters, premium exercises, and advanced features.

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

### 🖥️ Student Dashboard
The central hub for tracking XP, Badges, and enrolled courses.
![Dashboard](https://github.com/user-attachments/assets/c1ab26.jpg)

### 📚 Course Curriculum
Structured learning with "Pro" indicators for advanced content.
![Curriculum](https://github.com/user-attachments/assets/c1ae49.png)

### 🔍 Interactive Coding Lab
The "HTML Detective" exercise where users hunt down and fix errors.
![Exercise](https://github.com/user-attachments/assets/c1b1ae.png)

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

## 🛣️ Roadmap
- [ ] **Leaderboard:** Compete with other students globally.
- [ ] **AI Mentor:** Get real-time hints when you're stuck on an exercise.
- [ ] **Custom Projects:** A sandbox mode to build and share your own pixel-art sites.
- [ ] **Certificate Minting:** Earn a verified certificate upon course completion.

---

## 🤝 Contributing
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Developed with 💻 and ☕ by [Vansh Agrawal](https://github.com/your-github-username)**
