# 🚀 GATE CS 2027 Command Center & Study Tracker

A high-performance, dark-theme tracking web application designed specifically for **GATE CS 2027** preparation (25 Oct 2026 to 5 Feb 2027, 104 Days), derived directly from your study schedule spreadsheet.

---

## ⚡ Quick Start

1. **Option A: Direct In Browser (Offline)**
   - Simply double click [`index.html`](file:///c:/Users/ISSAK%20RAJ/OneDrive/Desktop/gateprep/index.html) to open it in Chrome, Edge, or Brave.
   - It works 100% offline with zero dependencies!

2. **Option B: Local Dev Server**
   - Active on: **`http://localhost:8092/index.html`**
   - Or run `python -m http.server 8092` in this folder.

---

## 🌟 Key Features

1. **Live Exam Countdown**: Real-time ticker counting down to GATE CS Exam Day (Feb 6, 2027).
2. **Top KPI Dashboard**:
   - **Plan Completed %** (Calculated from Done & Partial days).
   - **Hours Studied** vs **660 Planned Hours**.
   - **Total PYQs Solved** counter.
   - **Daily Aptitude Habit Streak** (30-60m daily).
   - **Mock Exam Average & Benchmark** (Aim 60+ for Top 1000).
3. **104-Day Master Tracker**:
   - Grouped and filterable by **Phase 1 to 6** (Start, Exams, Learn, Practice, Mocks, Final).
   - Filter by **Subject** or **Status** (Done, Partial, Missed, Pending).
   - Instant search across daily tasks, topics, and notes.
   - One-click **"Day 1 (Today)"** jump.
   - Inline status toggle, aptitude checkbox, actual hours input, and PYQ counter.
   - Notes modal for jotting observations and revision reminders.
4. **Subject Mastery & Confidence**:
   - 11 Core GATE CS subjects with progress bars.
   - Clickable **1-5 Star Confidence Rating**.
   - Direct filter button to jump straight to that subject's days in the tracker.
5. **15-Week Study Trajectory**:
   - Weekly planned vs actual study hours chart.
   - Week-by-week cards tracking days completed and PYQs.
6. **Mock Test Performance**:
   - Score progression log with benchmark against top IIT threshold (60+).
   - Leakage breakdown: Concept gap vs Silly mistake vs Time pressure.
   - Modal to log new mock tests.
7. **Mistake Notebook (Error Log)**:
   - Categorized by Subject and Mistake Type (Concept, Silly, Calculation, Formula).
   - What went wrong vs Correct idea/formula.
   - 30-minute daily revision tracker toggle ("Revised" vs "Needs Revision").
8. **IIT Madras 2027 Syllabus Updates**:
   - Clear cards detailing what was **REMOVED** (e.g. OSI, ARP, UDP, SMTP in CN) and what was **ADDED** (ALU & control unit design, Quine-McCluskey tabular method).
9. **Focus Pomodoro Timer**:
   - 25m Focus / 50m Deep Session intervals with audio chime.
   - One-click button to log completed sessions directly to today's study hours!
10. **Data Backup & Reset**:
    - Automatic persistent storage in `localStorage`.
    - One-click Export to JSON or CSV (Excel compatible).
    - Import backup and Reset to Excel defaults anytime.
