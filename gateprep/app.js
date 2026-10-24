/**
 * GATE CS 2027 Command Center
 * Ultra-Modern Study Tracker & Analytics Engine
 */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // 1. STATE INITIALIZATION & LOCAL STORAGE
  // -------------------------------------------------------------------------
  const STORAGE_KEY = 'gate_cs_2027_study_tracker_v1';
  let appState = null;

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        appState = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
    }

    if (!appState) {
      // Deep clone INITIAL_DATA from data.js
      appState = JSON.parse(JSON.stringify(INITIAL_DATA));
    }

    // Ensure state integrity
    if (!appState.tracker) appState.tracker = [];
    if (!appState.mocks) appState.mocks = [];
    if (!appState.mistakes) appState.mistakes = [];
    if (!appState.subject_progress) appState.subject_progress = [];
  }

  function saveState(notify = false, msg = 'Progress saved') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
      updateGlobalStats();
      if (notify) showToast(msg);
    } catch (e) {
      console.error('Error saving state to localStorage:', e);
    }
  }

  function resetState() {
    if (confirm('Are you sure you want to reset all data back to the original Excel plan? Any unsaved edits will be lost.')) {
      localStorage.removeItem(STORAGE_KEY);
      appState = JSON.parse(JSON.stringify(INITIAL_DATA));
      saveState();
      renderAll();
      showToast('Reset to original Excel defaults!');
    }
  }

  // -------------------------------------------------------------------------
  // 2. EXAM COUNTDOWN ENGINE (Exam: Feb 6, 2027)
  // -------------------------------------------------------------------------
  function initExamCountdown() {
    const examDate = new Date('2027-02-06T09:00:00+05:30').getTime();

    function updateClock() {
      const now = new Date().getTime();
      const diff = examDate - now;

      if (diff <= 0) {
        document.getElementById('examCountdown').innerHTML =
          '<span class="unit-val" style="color:#10b981">EXAM DAY HAS ARRIVED! ALL THE BEST!</span>';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const dEl = document.getElementById('cdDays');
      const hEl = document.getElementById('cdHours');
      const mEl = document.getElementById('cdMins');
      const sEl = document.getElementById('cdSecs');

      if (dEl) dEl.textContent = String(days).padStart(2, '0');
      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(mins).padStart(2, '0');
      if (sEl) sEl.textContent = String(secs).padStart(2, '0');
    }

    updateClock();
    setInterval(updateClock, 1000);
  }

  // -------------------------------------------------------------------------
  // 3. GLOBAL KPI STATS COMPUTATION
  // -------------------------------------------------------------------------
  function updateGlobalStats() {
    const rows = appState.tracker;
    const totalDays = rows.length || 104;

    let daysDone = 0;
    let daysPartly = 0;
    let actualHours = 0;
    let plannedHours = 0;
    let pyqsSolved = 0;
    let aptitudeDone = 0;

    rows.forEach(r => {
      const st = r['Status'];
      if (st === 'Done') daysDone++;
      else if (st === 'Partly done') daysPartly++;

      const actH = parseFloat(r['Actual Hrs']);
      if (!isNaN(actH)) actualHours += actH;

      const planH = parseFloat(r['Planned Hrs']);
      if (!isNaN(planH)) plannedHours += planH;

      const pyq = parseInt(r['PYQs Solved']);
      if (!isNaN(pyq)) pyqsSolved += pyq;

      const apt = String(r['Aptitude done?'] || '').toLowerCase();
      if (apt === 'yes' || apt === 'true' || apt === 'done') aptitudeDone++;
    });

    const completionPercent = ((daysDone + daysPartly * 0.5) / totalDays * 100).toFixed(1);

    // Update KPI UI
    const planPctEl = document.getElementById('statPlanPercent');
    const barPlanEl = document.getElementById('barPlanPercent');
    const daysDoneEl = document.getElementById('statDaysDone');
    if (planPctEl) planPctEl.textContent = `${completionPercent}%`;
    if (barPlanEl) barPlanEl.style.width = `${Math.min(100, completionPercent)}%`;
    if (daysDoneEl) daysDoneEl.textContent = `${daysDone} Done • ${daysPartly} Partial`;

    const actHoursEl = document.getElementById('statActualHours');
    const planHoursEl = document.getElementById('statPlannedHours');
    const barHoursEl = document.getElementById('barHoursPercent');
    if (actHoursEl) actHoursEl.textContent = actualHours.toFixed(1);
    if (planHoursEl) planHoursEl.textContent = plannedHours > 0 ? plannedHours.toFixed(0) : '660';
    if (barHoursEl && plannedHours > 0) {
      const hrsPct = Math.min(100, (actualHours / plannedHours * 100)).toFixed(1);
      barHoursEl.style.width = `${hrsPct}%`;
    }

    const pyqsEl = document.getElementById('statPyqsSolved');
    if (pyqsEl) pyqsEl.textContent = pyqsSolved.toLocaleString();

    const aptEl = document.getElementById('statAptitudeDone');
    if (aptEl) aptEl.textContent = aptitudeDone;

    // Mock stats
    const mocks = appState.mocks || [];
    let avgMock = 0;
    if (mocks.length > 0) {
      const sum = mocks.reduce((acc, m) => acc + (parseFloat(m['Score (/100)']) || 0), 0);
      avgMock = (sum / mocks.length).toFixed(1);
    }
    const mockAvgEl = document.getElementById('statMockAvg');
    const mockCurAvgEl = document.getElementById('mockCurrentAvg');
    const mockCountDescEl = document.getElementById('mockCountDesc');
    const mockTabCount = document.getElementById('mockTabCount');

    if (mockAvgEl) mockAvgEl.textContent = mocks.length > 0 ? avgMock : '--';
    if (mockCurAvgEl) mockCurAvgEl.textContent = mocks.length > 0 ? avgMock : '--';
    if (mockCountDescEl) mockCountDescEl.textContent = `${mocks.length} mock${mocks.length === 1 ? '' : 's'} recorded`;
    if (mockTabCount) mockTabCount.textContent = mocks.length;

    const mistakeTabCount = document.getElementById('mistakeTabCount');
    if (mistakeTabCount) mistakeTabCount.textContent = (appState.mistakes || []).length;
  }

  // -------------------------------------------------------------------------
  // 4. TAB NAVIGATION
  // -------------------------------------------------------------------------
  function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');

        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.add('active');

        // Trigger rerenders if necessary
        if (targetId === 'subjectsTab') renderSubjectCards();
        if (targetId === 'weeklyTab') renderWeeklySection();
        if (targetId === 'mocksTab') renderMocksTable();
        if (targetId === 'mistakesTab') renderMistakes();
        if (targetId === 'syllabusTab') renderSyllabus();
      });
    });

    // Quick Pomodoro button in header switches to Pomodoro tab
    const btnQuickPomodoro = document.getElementById('btnQuickPomodoro');
    if (btnQuickPomodoro) {
      btnQuickPomodoro.addEventListener('click', () => {
        const pBtn = document.querySelector('[data-tab="pomodoroTab"]');
        if (pBtn) pBtn.click();
      });
    }

    // Today scroll button
    const btnJumpToday = document.getElementById('btnJumpToday');
    const btnScrollToToday = document.getElementById('btnScrollToToday');
    [btnJumpToday, btnScrollToToday].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          const tBtn = document.querySelector('[data-tab="trackerTab"]');
          if (tBtn) tBtn.click();

          setTimeout(() => {
            const todayRow = document.querySelector('.row-today');
            if (todayRow) {
              todayRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
              todayRow.style.transition = 'box-shadow 0.5s ease';
              todayRow.style.boxShadow = '0 0 25px rgba(0, 240, 255, 0.6)';
              setTimeout(() => {
                todayRow.style.boxShadow = '';
              }, 2000);
            }
          }, 100);
        });
      }
    });
  }

  // -------------------------------------------------------------------------
  // 5. TAB 1: 104-DAY TRACKER RENDERING & FILTERING
  // -------------------------------------------------------------------------
  let activePhaseFilter = 'all';
  let activeSubjectFilter = 'all';
  let activeStatusFilter = 'all';
  let searchQuery = '';
  let viewMode = 'table'; // 'table' or 'cards'

  function getPhaseClass(phase) {
    if (!phase) return 'phase-1';
    if (phase.includes('1:')) return 'phase-1';
    if (phase.includes('2:')) return 'phase-2';
    if (phase.includes('3:')) return 'phase-3';
    if (phase.includes('4:')) return 'phase-4';
    if (phase.includes('5:')) return 'phase-5';
    if (phase.includes('6:')) return 'phase-6';
    return 'phase-1';
  }

  function populateSubjectDropdown() {
    const sel = document.getElementById('subjectSelectFilter');
    if (!sel) return;

    const subjects = new Set();
    appState.tracker.forEach(r => {
      if (r['Subject / Focus']) subjects.add(r['Subject / Focus']);
    });

    const currentVal = sel.value;
    sel.innerHTML = '<option value="all">All Subjects (17 categories)</option>';

    Array.from(subjects).sort().forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub;
      opt.textContent = sub;
      sel.appendChild(opt);
    });

    sel.value = currentVal;
  }

  function renderTracker() {
    const tbody = document.getElementById('trackerTableBody');
    const cardsWrapper = document.getElementById('trackerCardsWrapper');
    if (!tbody || !cardsWrapper) return;

    tbody.innerHTML = '';
    cardsWrapper.innerHTML = '';

    const query = searchQuery.trim().toLowerCase();

    const filteredRows = appState.tracker.filter(row => {
      // Phase filter
      if (activePhaseFilter !== 'all' && row['Phase'] !== activePhaseFilter) {
        return false;
      }
      // Subject filter
      if (activeSubjectFilter !== 'all' && row['Subject / Focus'] !== activeSubjectFilter) {
        return false;
      }
      // Status filter
      const st = row['Status'] || 'Pending';
      if (activeStatusFilter !== 'all') {
        if (activeStatusFilter === 'Pending' && row['Status'] !== null && row['Status'] !== '') return false;
        if (activeStatusFilter !== 'Pending' && row['Status'] !== activeStatusFilter) return false;
      }
      // Search query
      if (query) {
        const taskText = (row["Today's Tasks"] || '').toLowerCase();
        const subjectText = (row['Subject / Focus'] || '').toLowerCase();
        const notesText = (row['Notes'] || '').toLowerCase();
        if (!taskText.includes(query) && !subjectText.includes(query) && !notesText.includes(query)) {
          return false;
        }
      }
      return true;
    });

    const trackerCountEl = document.getElementById('trackerTotalCount');
    if (trackerCountEl) trackerCountEl.textContent = `${filteredRows.length} / ${appState.tracker.length}`;

    if (filteredRows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">
        No study days match your active filters. Try clearing search or selecting "All Phases".
      </td></tr>`;
      cardsWrapper.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 2.5rem; color: var(--text-muted);">
        No study days match your active filters.
      </div>`;
      return;
    }

    filteredRows.forEach(row => {
      const dayNum = row['Day'];
      const isToday = (dayNum === 1); // Day 1 = Oct 25, 2026
      const status = row['Status'] || '';
      const aptDone = (String(row['Aptitude done?']).toLowerCase() === 'yes');
      const phaseClass = getPhaseClass(row['Phase']);

      // Row status class
      let rowStatusClass = '';
      if (status === 'Done') rowStatusClass = 'row-done';
      else if (status === 'Partly done') rowStatusClass = 'row-partly';
      else if (status === 'Missed') rowStatusClass = 'row-missed';
      if (isToday) rowStatusClass += ' row-today';

      // Status button styling
      let statusBtnClass = 'status-select-btn';
      let statusBtnText = 'Pending';
      if (status === 'Done') {
        statusBtnClass += ' is-done';
        statusBtnText = '✓ Done';
      } else if (status === 'Partly done') {
        statusBtnClass += ' is-partial';
        statusBtnText = '◐ Partial';
      } else if (status === 'Missed') {
        statusBtnClass += ' is-missed';
        statusBtnText = '✗ Missed';
      }

      // --- TABLE ROW ---
      const tr = document.createElement('tr');
      tr.className = rowStatusClass;
      tr.id = `tracker-row-${dayNum}`;

      tr.innerHTML = `
        <td class="cell-day">
          Day ${dayNum}
          ${isToday ? '<span class="today-pill-tag">TODAY</span>' : ''}
        </td>
        <td class="cell-date">
          <div>${row['Date'] || ''}</div>
          <div class="cell-weekday">${row['Weekday'] || ''}</div>
        </td>
        <td>
          <span class="badge-phase ${phaseClass}">${row['Phase'] || ''}</span>
        </td>
        <td>
          <span class="badge-subject">${row['Subject / Focus'] || ''}</span>
        </td>
        <td>
          <div class="cell-task-text">${formatTaskText(row["Today's Tasks"] || '')}</div>
        </td>
        <td style="font-family:var(--font-mono); font-weight:600; color:#94a3b8; text-align:center;">
          ${row['Planned Hrs'] || 0}h
        </td>
        <td>
          <button class="${statusBtnClass}" data-day="${dayNum}" title="Click to cycle: Pending → Done → Partial → Missed">
            ${statusBtnText}
          </button>
        </td>
        <td style="text-align:center;">
          <button class="aptitude-toggle ${aptDone ? 'checked' : ''}" data-day="${dayNum}" title="Did 30-60m General Aptitude?">
            ✓
          </button>
        </td>
        <td style="text-align:center;">
          <input type="number" step="0.5" min="0" max="24" class="inline-input-num input-actual-hrs" 
            data-day="${dayNum}" value="${row['Actual Hrs'] !== null && row['Actual Hrs'] !== undefined ? row['Actual Hrs'] : ''}" 
            placeholder="0.0">
        </td>
        <td style="text-align:center;">
          <input type="number" min="0" max="200" class="inline-input-num input-pyqs" 
            data-day="${dayNum}" value="${row['PYQs Solved'] !== null && row['PYQs Solved'] !== undefined ? row['PYQs Solved'] : ''}" 
            placeholder="0">
        </td>
        <td style="text-align:center;">
          <button class="btn-note-icon ${row['Notes'] ? 'has-note' : ''}" data-day="${dayNum}" title="${row['Notes'] || 'Add note for this day'}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
        </td>
      `;
      tbody.appendChild(tr);

      // --- CARD VIEW ITEM ---
      const card = document.createElement('div');
      card.className = `day-card ${isToday ? 'card-today' : ''} ${rowStatusClass}`;
      card.innerHTML = `
        <div class="day-card-header">
          <div>
            <span class="day-card-day">Day ${dayNum}</span>
            ${isToday ? '<span class="today-pill-tag">TODAY</span>' : ''}
            <div class="day-card-date">${row['Date']} (${row['Weekday']})</div>
          </div>
          <span class="badge-phase ${phaseClass}">${row['Phase']}</span>
        </div>
        <div class="day-card-subject">${row['Subject / Focus']}</div>
        <div class="day-card-task">${formatTaskText(row["Today's Tasks"] || '')}</div>
        <div class="day-card-footer">
          <button class="${statusBtnClass}" data-day="${dayNum}">
            ${statusBtnText}
          </button>
          <div style="display:flex; align-items:center; gap: 0.5rem;">
            <button class="aptitude-toggle ${aptDone ? 'checked' : ''}" data-day="${dayNum}" title="Aptitude Done?">✓</button>
            <span style="font-size:0.75rem; color:var(--text-muted);">Apt</span>
          </div>
          <div style="display:flex; align-items:center; gap: 0.35rem;">
            <input type="number" step="0.5" min="0" class="inline-input-num input-actual-hrs" data-day="${dayNum}" 
              value="${row['Actual Hrs'] !== null && row['Actual Hrs'] !== undefined ? row['Actual Hrs'] : ''}" placeholder="0.0" style="width:50px">
            <span style="font-size:0.75rem; color:var(--text-muted);">Hrs</span>
          </div>
          <button class="btn-note-icon ${row['Notes'] ? 'has-note' : ''}" data-day="${dayNum}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
        </div>
      `;
      cardsWrapper.appendChild(card);
    });

    bindTrackerRowEvents();
  }

  function formatTaskText(text) {
    if (!text) return '';
    // Format "Learn/solve:" or "Weekly test:" or "Mid exams:" with bold styling
    return text.replace(/(Learn\/solve:|Weekly test:|Mid exams:|Full mock:|Analyse Saturday's mock:|Rest\.)/gi,
      '<strong style="color:#e2e8f0;">$1</strong>');
  }

  function bindTrackerRowEvents() {
    // 1. Status Cycle Click
    document.querySelectorAll('.status-select-btn').forEach(btn => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const day = parseInt(this.getAttribute('data-day'));
        const row = appState.tracker.find(r => r['Day'] === day);
        if (!row) return;

        // Cycle: Pending -> Done -> Partly done -> Missed -> null
        const current = row['Status'];
        if (!current) row['Status'] = 'Done';
        else if (current === 'Done') row['Status'] = 'Partly done';
        else if (current === 'Partly done') row['Status'] = 'Missed';
        else row['Status'] = null;

        // If marked Done and Actual Hrs is empty, auto-populate with Planned Hrs
        if (row['Status'] === 'Done' && (!row['Actual Hrs'] || row['Actual Hrs'] === 0)) {
          row['Actual Hrs'] = row['Planned Hrs'];
        }

        saveState(false);
        renderTracker();
      };
    });

    // 2. Aptitude Toggle Click
    document.querySelectorAll('.aptitude-toggle').forEach(btn => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const day = parseInt(this.getAttribute('data-day'));
        const row = appState.tracker.find(r => r['Day'] === day);
        if (!row) return;

        const isYes = String(row['Aptitude done?']).toLowerCase() === 'yes';
        row['Aptitude done?'] = isYes ? 'No' : 'Yes';

        saveState(false);
        renderTracker();
      };
    });

    // 3. Actual Hours Input
    document.querySelectorAll('.input-actual-hrs').forEach(inp => {
      const handleHrs = function () {
        const day = parseInt(this.getAttribute('data-day'));
        const row = appState.tracker.find(r => r['Day'] === day);
        if (!row) return;

        const val = this.value === '' ? null : parseFloat(this.value);
        row['Actual Hrs'] = isNaN(val) ? null : val;
        saveState(false);
      };
      inp.onchange = handleHrs;
      inp.oninput = handleHrs;
    });

    // 4. PYQs Solved Input
    document.querySelectorAll('.input-pyqs').forEach(inp => {
      const handlePyqs = function () {
        const day = parseInt(this.getAttribute('data-day'));
        const row = appState.tracker.find(r => r['Day'] === day);
        if (!row) return;

        const val = this.value === '' ? null : parseInt(this.value);
        row['PYQs Solved'] = isNaN(val) ? null : val;
        saveState(false);
      };
      inp.onchange = handlePyqs;
      inp.oninput = handlePyqs;
    });

    // 5. Notes Modal Trigger
    document.querySelectorAll('.btn-note-icon').forEach(btn => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const day = parseInt(this.getAttribute('data-day'));
        openNotesModal(day);
      };
    });
  }

  // -------------------------------------------------------------------------
  // 6. NOTES MODAL
  // -------------------------------------------------------------------------
  let activeNoteDay = null;

  function openNotesModal(day) {
    activeNoteDay = day;
    const row = appState.tracker.find(r => r['Day'] === day);
    if (!row) return;

    document.getElementById('notesModalTitle').textContent = `Day ${day} Notes • ${row['Date']} (${row['Subject / Focus']})`;
    const txt = document.getElementById('notesModalTextarea');
    txt.value = row['Notes'] || '';

    const modal = document.getElementById('modalEditNotes');
    modal.classList.add('show');
    txt.focus();
  }

  function closeNotesModal() {
    document.getElementById('modalEditNotes').classList.remove('show');
    activeNoteDay = null;
  }

  function initNotesModal() {
    document.getElementById('btnCloseEditNotes').onclick = closeNotesModal;
    document.getElementById('btnCancelNotes').onclick = closeNotesModal;
    document.getElementById('btnSaveNotes').onclick = () => {
      if (activeNoteDay !== null) {
        const row = appState.tracker.find(r => r['Day'] === activeNoteDay);
        if (row) {
          row['Notes'] = document.getElementById('notesModalTextarea').value.trim() || null;
          saveState(true, `Note saved for Day ${activeNoteDay}`);
          renderTracker();
        }
      }
      closeNotesModal();
    };
  }

  // -------------------------------------------------------------------------
  // 7. TAB 2: SUBJECT MASTERY & CONFIDENCE
  // -------------------------------------------------------------------------
  function renderSubjectCards() {
    const grid = document.getElementById('subjectCardsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const subjects = appState.subject_progress || [];

    // Recalculate dynamic days done from Tracker rows
    subjects.forEach(sub => {
      const matchingRows = appState.tracker.filter(r => r['Subject / Focus'] === sub.subject);
      const daysDone = matchingRows.filter(r => r['Status'] === 'Done').length;
      const planned = sub.days_planned || matchingRows.length || 1;
      const pct = Math.min(100, Math.round((daysDone / planned) * 100));

      const card = document.createElement('div');
      card.className = 'subject-card';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div class="subject-card-title">${sub.subject}</div>
          <span class="badge-phase phase-3">${planned} Days Plan</span>
        </div>

        <div class="subject-card-stats">
          <span>Progress: <strong>${daysDone} / ${planned} Days</strong></span>
          <span style="color:var(--accent-cyan); font-weight:700;">${pct}%</span>
        </div>

        <div class="progress-bar-bg">
          <div class="progress-bar-fill fill-cyan" style="width: ${pct}%"></div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem; padding-top:0.5rem; border-top:1px solid var(--border-subtle);">
          <div>
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Self Confidence</div>
            <div class="confidence-stars" data-subject="${sub.subject}">
              ${[1, 2, 3, 4, 5].map(star => `
                <button class="star-btn ${star <= (sub.confidence || 3) ? 'active' : ''}" data-val="${star}" title="Rate ${star}/5 stars">★</button>
              `).join('')}
            </div>
          </div>
          <button class="btn btn-sm btn-outline-cyan btn-filter-to-subject" data-subject="${sub.subject}">
            View Days →
          </button>
        </div>
      `;
      grid.appendChild(card);
    });

    // Star rating click handler
    document.querySelectorAll('.confidence-stars .star-btn').forEach(starBtn => {
      starBtn.onclick = function () {
        const starVal = parseInt(this.getAttribute('data-val'));
        const subjectName = this.parentElement.getAttribute('data-subject');
        const subObj = appState.subject_progress.find(s => s.subject === subjectName);
        if (subObj) {
          subObj.confidence = starVal;
          saveState(false);
          renderSubjectCards();
          showToast(`Confidence for ${subjectName} set to ${starVal}/5 stars`);
        }
      };
    });

    // View Days button jumps to tracker filtered by that subject
    document.querySelectorAll('.btn-filter-to-subject').forEach(btn => {
      btn.onclick = function () {
        const sub = this.getAttribute('data-subject');
        activeSubjectFilter = sub;
        document.getElementById('subjectSelectFilter').value = sub;
        const tBtn = document.querySelector('[data-tab="trackerTab"]');
        if (tBtn) tBtn.click();
        renderTracker();
      };
    });
  }

  // -------------------------------------------------------------------------
  // 8. TAB 3: WEEKLY ROADMAP & CHART
  // -------------------------------------------------------------------------
  function renderWeeklySection() {
    const chartContainer = document.getElementById('weeklyChartContainer');
    const grid = document.getElementById('weeklyCardsGrid');
    if (!chartContainer || !grid) return;

    chartContainer.innerHTML = '';
    grid.innerHTML = '';

    const weekly = appState.weekly_summary || [];

    // Recalculate dynamic hours per week
    const maxPlanned = Math.max(...weekly.map(w => w.planned_hrs || 54), 54);

    weekly.forEach((w, idx) => {
      // Calculate dynamic actuals from tracker rows in that week range
      const startDate = new Date(w.week_starting);
      const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      const matchingRows = appState.tracker.filter(r => {
        const rDate = new Date(r['Date']);
        return rDate >= startDate && rDate < endDate;
      });

      const actualHrs = matchingRows.reduce((acc, r) => acc + (parseFloat(r['Actual Hrs']) || 0), 0);
      const daysDone = matchingRows.filter(r => r['Status'] === 'Done').length;
      const pyqs = matchingRows.reduce((acc, r) => acc + (parseInt(r['PYQs Solved']) || 0), 0);

      // --- BAR CHART ITEM ---
      const plannedHeight = (w.planned_hrs / maxPlanned) * 140;
      const actualHeight = Math.min(140, (actualHrs / maxPlanned) * 140);

      const barGroup = document.createElement('div');
      barGroup.className = 'chart-bar-group';
      barGroup.innerHTML = `
        <div class="chart-bars-wrap" title="Week ${idx + 1}: ${w.planned_hrs}h planned, ${actualHrs.toFixed(1)}h actual">
          <div class="bar-planned" style="height: ${Math.max(4, plannedHeight)}px;"></div>
          <div class="bar-actual" style="height: ${Math.max(actualHrs > 0 ? 4 : 0, actualHeight)}px;"></div>
        </div>
        <div class="chart-bar-label">W${idx + 1}</div>
      `;
      chartContainer.appendChild(barGroup);

      // --- CARD ITEM ---
      const card = document.createElement('div');
      card.className = 'week-card';
      card.innerHTML = `
        <div class="week-card-top">
          <span class="week-title">Week ${idx + 1}</span>
          <span class="week-date">${w.week_starting}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Planned Hours:</span>
          <strong>${w.planned_hrs} hrs</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Actual Studied:</span>
          <strong style="color:var(--accent-cyan);">${actualHrs.toFixed(1)} hrs</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Days Done:</span>
          <span>${daysDone} / 7 days</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
          <span style="color:var(--text-muted);">PYQs Solved:</span>
          <span>${pyqs} questions</span>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // -------------------------------------------------------------------------
  // 9. TAB 4: MOCK TEST LOG
  // -------------------------------------------------------------------------
  function renderMocksTable() {
    const tbody = document.getElementById('mocksTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const mocks = appState.mocks || [];

    if (mocks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--text-muted);">
        No mocks logged yet. Click "Log New Mock Test" to start tracking!
      </td></tr>`;
      return;
    }

    mocks.forEach((m, idx) => {
      const score = parseFloat(m['Score (/100)']) || 0;
      let scoreClass = 'rgba(239, 68, 68, 0.2); color: #f87171;';
      if (score >= 60) scoreClass = 'rgba(16, 185, 129, 0.2); color: #34d399;';
      else if (score >= 45) scoreClass = 'rgba(245, 158, 11, 0.2); color: #fbbf24;';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:var(--font-mono); font-weight:700;">#${m['Mock #'] || idx + 1}</td>
        <td style="font-family:var(--font-mono); color:var(--text-secondary);">${m['Date'] || ''}</td>
        <td>
          <span class="score-badge" style="background:${scoreClass}">${score} / 100</span>
        </td>
        <td style="color:#f87171; font-weight:600;">-${m['Marks lost: concept gap'] || 0}</td>
        <td style="color:#fbbf24; font-weight:600;">-${m['Marks lost: silly mistake'] || 0}</td>
        <td style="color:#a5b4fc; font-weight:600;">-${m['Marks lost: time pressure'] || 0}</td>
        <td style="max-width: 250px; font-size: 0.8rem; color:#cbd5e1;">${m['Weak topics to fix'] || 'None recorded'}</td>
        <td>
          <button class="btn btn-sm btn-glass btn-delete-mock" data-idx="${idx}" title="Delete mock record" style="color:#f87171;">
            Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-delete-mock').forEach(btn => {
      btn.onclick = function () {
        const idx = parseInt(this.getAttribute('data-idx'));
        if (confirm(`Delete Mock #${appState.mocks[idx]['Mock #']}?`)) {
          appState.mocks.splice(idx, 1);
          saveState(true, 'Mock deleted');
          renderMocksTable();
        }
      };
    });
  }

  function initAddMockModal() {
    const modal = document.getElementById('modalAddMock');
    const openBtn = document.getElementById('btnOpenAddMockModal');
    const closeBtn = document.getElementById('btnCloseAddMock');
    const cancelBtn = document.getElementById('btnCancelAddMock');
    const form = document.getElementById('formAddMock');

    if (openBtn) {
      openBtn.onclick = () => {
        const nextNum = (appState.mocks || []).length + 1;
        document.getElementById('mockInputNumber').value = nextNum;
        modal.classList.add('show');
      };
    }

    const closeModal = () => modal.classList.remove('show');
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;

    if (form) {
      form.onsubmit = function (e) {
        e.preventDefault();
        const newMock = {
          'Mock #': parseInt(document.getElementById('mockInputNumber').value),
          'Date': document.getElementById('mockInputDate').value,
          'Score (/100)': parseFloat(document.getElementById('mockInputScore').value),
          'Marks lost: concept gap': parseFloat(document.getElementById('mockInputConcept').value) || 0,
          'Marks lost: silly mistake': parseFloat(document.getElementById('mockInputSilly').value) || 0,
          'Marks lost: time pressure': parseFloat(document.getElementById('mockInputTime').value) || 0,
          'Weak topics to fix': document.getElementById('mockInputWeak').value.trim() || 'None'
        };

        if (!appState.mocks) appState.mocks = [];
        appState.mocks.push(newMock);
        saveState(true, `Mock #${newMock['Mock #']} logged successfully!`);
        closeModal();
        renderMocksTable();
      };
    }
  }

  // -------------------------------------------------------------------------
  // 10. TAB 5: MISTAKE NOTEBOOK
  // -------------------------------------------------------------------------
  let mistakeSearchQuery = '';
  let mistakeSubjectFilter = 'all';
  let mistakeTypeFilter = 'all';
  let mistakeRevisedFilter = 'all';

  function renderMistakes() {
    const container = document.getElementById('mistakesContainer');
    if (!container) return;
    container.innerHTML = '';

    const mistakes = appState.mistakes || [];

    // Populate subject filter options
    const subSel = document.getElementById('mistakeSubjectFilter');
    if (subSel && subSel.options.length <= 1) {
      const set = new Set();
      mistakes.forEach(m => { if (m['Subject']) set.add(m['Subject']); });
      Array.from(set).sort().forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        subSel.appendChild(opt);
      });
    }

    const filtered = mistakes.filter(m => {
      if (mistakeSubjectFilter !== 'all' && m['Subject'] !== mistakeSubjectFilter) return false;
      if (mistakeTypeFilter !== 'all' && m['Mistake type'] !== mistakeTypeFilter) return false;
      if (mistakeRevisedFilter !== 'all') {
        const isRev = (m['Revised? (Yes/No)'] === 'Yes');
        if (mistakeRevisedFilter === 'Yes' && !isRev) return false;
        if (mistakeRevisedFilter === 'No' && isRev) return false;
      }
      if (mistakeSearchQuery) {
        const q = mistakeSearchQuery.toLowerCase();
        const top = (m['Topic'] || '').toLowerCase();
        const wrong = (m['What went wrong'] || '').toLowerCase();
        const corr = (m['Correct idea / formula'] || '').toLowerCase();
        if (!top.includes(q) && !wrong.includes(q) && !corr.includes(q)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 2.5rem; color: var(--text-muted);">
        No mistake records found matching your filters.
      </div>`;
      return;
    }

    filtered.forEach((m, idx) => {
      const isRevised = (m['Revised? (Yes/No)'] === 'Yes');

      const card = document.createElement('div');
      card.className = `mistake-card ${isRevised ? 'revised' : 'not-revised'}`;
      card.innerHTML = `
        <div class="mistake-card-top">
          <div>
            <div class="mistake-topic">${m['Topic'] || 'Untitled Topic'}</div>
            <div class="mistake-meta">${m['Subject'] || ''} • ${m['Source (year/mock)'] || 'PYQ'} • ${m['Date'] || ''}</div>
          </div>
          <span class="badge-mistake-type">${m['Mistake type'] || 'Concept'}</span>
        </div>

        <div>
          <div class="mistake-section-label">❌ What went wrong:</div>
          <div class="mistake-wrong-text">${m['What went wrong'] || 'N/A'}</div>
        </div>

        <div>
          <div class="mistake-section-label">💡 Correct idea / formula:</div>
          <div class="mistake-correct-text">${m['Correct idea / formula'] || 'N/A'}</div>
        </div>

        <div class="mistake-card-foot">
          <button class="revised-toggle-btn ${isRevised ? 'is-revised' : ''}" data-idx="${idx}">
            ${isRevised ? '✓ Revised' : '○ Needs Daily Revision'}
          </button>
          <button class="btn btn-sm btn-glass btn-delete-mistake" data-idx="${idx}" style="color:#f87171;">
            Delete
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    // Revised toggle click
    document.querySelectorAll('.revised-toggle-btn').forEach(btn => {
      btn.onclick = function () {
        const idx = parseInt(this.getAttribute('data-idx'));
        const m = filtered[idx];
        if (m) {
          m['Revised? (Yes/No)'] = (m['Revised? (Yes/No)'] === 'Yes') ? 'No' : 'Yes';
          saveState(true, `Revision status updated for "${m['Topic']}"`);
          renderMistakes();
        }
      };
    });

    // Delete mistake
    document.querySelectorAll('.btn-delete-mistake').forEach(btn => {
      btn.onclick = function () {
        const idx = parseInt(this.getAttribute('data-idx'));
        const m = filtered[idx];
        if (m && confirm(`Delete mistake entry "${m['Topic']}"?`)) {
          const originalIdx = appState.mistakes.indexOf(m);
          if (originalIdx > -1) {
            appState.mistakes.splice(originalIdx, 1);
            saveState(true, 'Mistake entry deleted');
            renderMistakes();
          }
        }
      };
    });
  }

  function initAddMistakeModal() {
    const modal = document.getElementById('modalAddMistake');
    const openBtn = document.getElementById('btnOpenAddMistakeModal');
    const closeBtn = document.getElementById('btnCloseAddMistake');
    const cancelBtn = document.getElementById('btnCancelAddMistake');
    const form = document.getElementById('formAddMistake');

    if (openBtn) openBtn.onclick = () => modal.classList.add('show');
    const closeModal = () => modal.classList.remove('show');
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;

    if (form) {
      form.onsubmit = function (e) {
        e.preventDefault();
        const newEntry = {
          'Date': document.getElementById('mistakeInputDate').value,
          'Subject': document.getElementById('mistakeInputSubject').value,
          'Topic': document.getElementById('mistakeInputTopic').value.trim(),
          'Source (year/mock)': document.getElementById('mistakeInputSource').value.trim() || 'GATE PYQ',
          'Mistake type': document.getElementById('mistakeInputType').value,
          'What went wrong': document.getElementById('mistakeInputWrong').value.trim(),
          'Correct idea / formula': document.getElementById('mistakeInputCorrect').value.trim(),
          'Revised? (Yes/No)': 'No'
        };

        if (!appState.mistakes) appState.mistakes = [];
        appState.mistakes.unshift(newEntry);
        saveState(true, `Added "${newEntry['Topic']}" to Mistake Notebook`);
        closeModal();
        renderMistakes();
      };
    }

    // Filters binding
    const sInput = document.getElementById('mistakeSearchInput');
    if (sInput) {
      sInput.oninput = (e) => {
        mistakeSearchQuery = e.target.value;
        renderMistakes();
      };
    }
    const subFilter = document.getElementById('mistakeSubjectFilter');
    if (subFilter) {
      subFilter.onchange = (e) => {
        mistakeSubjectFilter = e.target.value;
        renderMistakes();
      };
    }
    const typeFilter = document.getElementById('mistakeTypeFilter');
    if (typeFilter) {
      typeFilter.onchange = (e) => {
        mistakeTypeFilter = e.target.value;
        renderMistakes();
      };
    }
    const revFilter = document.getElementById('mistakeRevisedFilter');
    if (revFilter) {
      revFilter.onchange = (e) => {
        mistakeRevisedFilter = e.target.value;
        renderMistakes();
      };
    }
  }

  // -------------------------------------------------------------------------
  // 11. TAB 6: SYLLABUS 2027 CHANGES
  // -------------------------------------------------------------------------
  function renderSyllabus() {
    const grid = document.getElementById('syllabusGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const items = appState.syllabus || [];

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'syllabus-card';
      card.innerHTML = `
        <div class="syllabus-title">${item.subject}</div>
        <div class="syllabus-box-changed">
          <strong style="color:#f43f5e; display:block; margin-bottom:4px;">⚠ What Changed vs 2026:</strong>
          ${item.changed}
        </div>
        <div class="syllabus-box-todo">
          <strong style="color:#10b981; display:block; margin-bottom:4px;">✓ Action Plan (What to do):</strong>
          ${item.todo}
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // -------------------------------------------------------------------------
  // 12. TAB 7: FOCUS POMODORO TIMER
  // -------------------------------------------------------------------------
  let timerDuration = 25 * 60; // seconds
  let timerRemaining = 25 * 60;
  let timerInterval = null;
  let isTimerRunning = false;
  let timerSessionMinutes = 25;

  function initPomodoro() {
    const timeDisplay = document.getElementById('pomodoroTime');
    const modeTag = document.getElementById('pomodoroMode');
    const btnStart = document.getElementById('btnTimerStart');
    const btnPause = document.getElementById('btnTimerPause');
    const btnReset = document.getElementById('btnTimerReset');
    const btnLog = document.getElementById('btnLogPomodoroToToday');
    const presetBtns = document.querySelectorAll('.preset-btn');

    function updateDisplay() {
      const mins = Math.floor(timerRemaining / 60);
      const secs = timerRemaining % 60;
      if (timeDisplay) timeDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function startTimer() {
      if (isTimerRunning) return;
      isTimerRunning = true;
      btnStart.style.display = 'none';
      btnPause.style.display = 'inline-flex';

      timerInterval = setInterval(() => {
        if (timerRemaining > 0) {
          timerRemaining--;
          updateDisplay();
        } else {
          clearInterval(timerInterval);
          isTimerRunning = false;
          btnStart.style.display = 'inline-flex';
          btnPause.style.display = 'none';
          playBeepSound();
          showToast(`Focus session completed! Great job.`);
        }
      }, 1000);
    }

    function pauseTimer() {
      if (!isTimerRunning) return;
      clearInterval(timerInterval);
      isTimerRunning = false;
      btnStart.style.display = 'inline-flex';
      btnPause.style.display = 'none';
    }

    function resetTimer() {
      pauseTimer();
      timerRemaining = timerDuration;
      updateDisplay();
    }

    presetBtns.forEach(btn => {
      btn.onclick = function () {
        presetBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        const mins = parseInt(this.getAttribute('data-time'));
        timerSessionMinutes = mins;
        timerDuration = mins * 60;
        timerRemaining = timerDuration;

        if (modeTag) {
          if (mins === 5 || mins === 15) modeTag.textContent = 'Rest Break';
          else modeTag.textContent = 'Focus Session';
        }
        resetTimer();
      };
    });

    if (btnStart) btnStart.onclick = startTimer;
    if (btnPause) btnPause.onclick = pauseTimer;
    if (btnReset) btnReset.onclick = resetTimer;

    // Log to Today's Hours
    if (btnLog) {
      btnLog.onclick = () => {
        const todayRow = appState.tracker.find(r => r['Day'] === 1);
        if (todayRow) {
          const current = parseFloat(todayRow['Actual Hrs']) || 0;
          const addedHours = +(timerSessionMinutes / 60).toFixed(2);
          todayRow['Actual Hrs'] = +(current + addedHours).toFixed(2);
          saveState(true, `Logged +${addedHours}h to Day 1 (Total: ${todayRow['Actual Hrs']}h)`);
          renderTracker();
        }
      };
    }

    updateDisplay();
  }

  // Audio Beep generator via Web Audio API (zero external assets needed)
  function playBeepSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.log('AudioContext not allowed or not supported yet');
    }
  }

  // -------------------------------------------------------------------------
  // 13. DATA MANAGEMENT (EXPORT / IMPORT / RESET)
  // -------------------------------------------------------------------------
  function initDataManagement() {
    const btnMenu = document.getElementById('btnDataMenu');
    const dropdown = document.getElementById('dataDropdown');

    if (btnMenu && dropdown) {
      btnMenu.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      };

      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== btnMenu) {
          dropdown.classList.remove('show');
        }
      });
    }

    // Export JSON
    const btnExpJSON = document.getElementById('btnExportJSON');
    if (btnExpJSON) {
      btnExpJSON.onclick = () => {
        const jsonStr = JSON.stringify(appState, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GATE_CS_2027_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('JSON backup exported!');
      };
    }

    // Export CSV
    const btnExpCSV = document.getElementById('btnExportCSV');
    if (btnExpCSV) {
      btnExpCSV.onclick = () => {
        const rows = appState.tracker;
        const headers = ['Day', 'Date', 'Weekday', 'Phase', 'Subject / Focus', "Today's Tasks", 'Planned Hrs', 'Status', 'Aptitude done?', 'Actual Hrs', 'PYQs Solved', 'Notes'];
        const csvLines = [headers.join(',')];

        rows.forEach(r => {
          const values = headers.map(h => {
            const val = r[h] !== null && r[h] !== undefined ? String(r[h]) : '';
            return `"${val.replace(/"/g, '""')}"`;
          });
          csvLines.push(values.join(','));
        });

        const csvBlob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(csvBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GATE_CS_2027_Tracker_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('CSV Tracker exported for Excel!');
      };
    }

    // Import JSON
    const btnImpJSON = document.getElementById('btnImportJSON');
    const fileImport = document.getElementById('fileImport');
    if (btnImpJSON && fileImport) {
      btnImpJSON.onclick = () => fileImport.click();
      fileImport.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (imported.tracker && Array.isArray(imported.tracker)) {
              appState = imported;
              saveState(true, 'Data imported successfully!');
              renderAll();
            } else {
              alert('Invalid backup format. Must contain tracker array.');
            }
          } catch (err) {
            alert('Error parsing JSON file.');
          }
        };
        reader.readAsText(file);
      };
    }

    // Reset Data
    const btnReset = document.getElementById('btnResetData');
    if (btnReset) btnReset.onclick = resetState;
  }

  // -------------------------------------------------------------------------
  // 14. FILTER CONTROLS & VIEW SWITCHING
  // -------------------------------------------------------------------------
  function initFilterControls() {
    // Phase filter pills
    const pills = document.querySelectorAll('#phaseFilterGroup .filter-pill');
    pills.forEach(pill => {
      pill.onclick = function () {
        pills.forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        activePhaseFilter = this.getAttribute('data-phase');
        renderTracker();
      };
    });

    // Subject select
    const subSel = document.getElementById('subjectSelectFilter');
    if (subSel) {
      subSel.onchange = function () {
        activeSubjectFilter = this.value;
        renderTracker();
      };
    }

    // Status select
    const stSel = document.getElementById('statusSelectFilter');
    if (stSel) {
      stSel.onchange = function () {
        activeStatusFilter = this.value;
        renderTracker();
      };
    }

    // Search bar
    const searchInp = document.getElementById('taskSearchInput');
    if (searchInp) {
      searchInp.oninput = function () {
        searchQuery = this.value;
        renderTracker();
      };
    }

    // View mode toggle
    const btnTable = document.getElementById('viewModeTable');
    const btnCards = document.getElementById('viewModeCards');
    const tblWrap = document.getElementById('trackerTableWrapper');
    const crdWrap = document.getElementById('trackerCardsWrapper');

    if (btnTable && btnCards) {
      btnTable.onclick = () => {
        btnTable.classList.add('active');
        btnCards.classList.remove('active');
        tblWrap.style.display = 'block';
        crdWrap.style.display = 'none';
      };

      btnCards.onclick = () => {
        btnCards.classList.add('active');
        btnTable.classList.remove('active');
        tblWrap.style.display = 'none';
        crdWrap.style.display = 'grid';
      };
    }
  }

  // -------------------------------------------------------------------------
  // 15. TOAST NOTIFICATIONS
  // -------------------------------------------------------------------------
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  }

  // -------------------------------------------------------------------------
  // 16. MASTER RENDER & BOOTSTRAP
  // -------------------------------------------------------------------------
  function renderAll() {
    updateGlobalStats();
    populateSubjectDropdown();
    renderTracker();
    renderSubjectCards();
    renderWeeklySection();
    renderMocksTable();
    renderMistakes();
    renderSyllabus();
  }

  function initApp() {
    loadState();
    initExamCountdown();
    initTabs();
    initFilterControls();
    initNotesModal();
    initAddMockModal();
    initAddMistakeModal();
    initPomodoro();
    initDataManagement();

    renderAll();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
