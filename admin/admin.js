/* =========================================================
   MATH PREMIER LEAGUE - ADMIN PORTAL LOGIC
   Features:
   - Persistent Left Navigation
   - Tab 1: Add Teams (By Name & Members Roster up to 4)
   - Tab 2: Points Management (Target Team Dropdown, Points Input Box, 6 Power-Ups, Add Points Action)
   - Tab 3: Tournament Leaderboard (Ranked strictly by points)
   - Tab 4: Team Details (View and manage all members for any selected team)
   - Tab 5: Activity Log (Chronological audit history)
   - Persistent LocalStorage across page reloads
   - Clean UI without unnecessary emojis
========================================================= */

(function() {
  'use strict';

  // Storage Keys
  const STORAGE_KEY_TEAMS = 'mpl_teams';
  const STORAGE_KEY_LOGS = 'mpl_admin_logs';
  const STORAGE_KEY_TAB = 'mpl_admin_active_tab';
  const STORAGE_KEY_POWERUPS = 'mpl_team_powerups';

  // 6 Power-Up Task Definitions (Clean - No Emojis, Informational only)
  const POWERUP_DEFS = {
    '2x_multiplier': {
      id: '2x_multiplier',
      name: '2X Double Points',
      desc: '2X Double Points'
    },
    'time_boost': {
      id: 'time_boost',
      name: 'Extra Time (+30s)',
      desc: 'Extra Time (+30s)'
    },
    'question_swap': {
      id: 'question_swap',
      name: 'Question Swap',
      desc: 'Question Swap'
    },
    'hint_access': {
      id: 'hint_access',
      name: 'Hint Access',
      desc: 'Hint Access'
    },
    'team_assist': {
      id: 'team_assist',
      name: 'Team Tag / Collaboration',
      desc: 'Team Tag / Collaboration'
    },
    'shield_protect': {
      id: 'shield_protect',
      name: 'Score Shield / Protection',
      desc: 'Score Shield / Protection'
    }
  };

  // State
  let teams = [];
  let logs = [];
  let teamPowerUps = {}; // Stored as { [teamId]: { powerUpId, powerUpName, teamName, assignedAt } }
  let currentActiveTab = 'add-teams';
  let selectedDetailsTeamId = null;

  // DOM Elements - Navigation
  const navTabBtns = document.querySelectorAll('.nav-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const currentViewTitle = document.getElementById('currentViewTitle');
  const sidebarTeamCount = document.getElementById('sidebarTeamCount');

  // DOM Elements - Tab 1: Add Teams
  const teamForm = document.getElementById('teamForm');
  const teamNameInput = document.getElementById('teamNameInput');
  const memberInput1 = document.getElementById('memberInput1');
  const memberInput2 = document.getElementById('memberInput2');
  const memberInput3 = document.getElementById('memberInput3');
  const memberInput4 = document.getElementById('memberInput4');
  const teamsListGrid = document.getElementById('teamsListGrid');
  const registeredTeamsCount = document.getElementById('registeredTeamsCount');

  // DOM Elements - Tab 2: Points
  const teamSelect = document.getElementById('teamSelect');
  const selectedTeamBanner = document.getElementById('selectedTeamBanner');
  const bannerTeamName = document.getElementById('bannerTeamName');
  const bannerTeamMembers = document.getElementById('bannerTeamMembers');
  const bannerTeamScore = document.getElementById('bannerTeamScore');
  const bannerTeamPowerUp = document.getElementById('bannerTeamPowerUp');
  const bannerPowerUpName = document.getElementById('bannerPowerUpName');
  const quickScoresList = document.getElementById('quickScoresList');
  const pointsAmountInput = document.getElementById('pointsAmountInput');
  const pointsReasonInput = document.getElementById('pointsReasonInput');
  const powerUpSelect = document.getElementById('powerUpSelect');
  const addPointsSubmitBtn = document.getElementById('addPointsSubmitBtn');
  const reducePointsSubmitBtn = document.getElementById('reducePointsSubmitBtn');

  // DOM Elements - Tab 3: Leaderboard
  const leaderboardContainer = document.getElementById('leaderboardContainer');

  // DOM Elements - Tab 4: Team Details
  const detailsTeamSelect = document.getElementById('detailsTeamSelect');
  const detailsQuickChips = document.getElementById('detailsQuickChips');
  const teamDetailsEmpty = document.getElementById('teamDetailsEmpty');
  const teamDetailsContent = document.getElementById('teamDetailsContent');
  const detailsName = document.getElementById('detailsName');
  const detailsRank = document.getElementById('detailsRank');
  const detailsPoints = document.getElementById('detailsPoints');
  const detailsMemberCount = document.getElementById('detailsMemberCount');
  const detailsPowerUp = document.getElementById('detailsPowerUp');
  const detailsMembersBadge = document.getElementById('detailsMembersBadge');
  const detailsMembersList = document.getElementById('detailsMembersList');
  const newMemberInput = document.getElementById('newMemberInput');
  const addMemberBtn = document.getElementById('addMemberBtn');
  const detailsGoToPointsBtn = document.getElementById('detailsGoToPointsBtn');

  // DOM Elements - Tab 5: Activity Log
  const auditLogContainer = document.getElementById('auditLogContainer');
  const clearLogBtn = document.getElementById('clearLogBtn');

  // DOM Elements - Topbar Stats
  const statTotalTeams = document.getElementById('statTotalTeams');
  const statLeadingTeam = document.getElementById('statLeadingTeam');
  const statTopScore = document.getElementById('statTopScore');
  const statTotalPoints = document.getElementById('statTotalPoints');

  // Global Actions
  const resetScoresBtn = document.getElementById('resetScoresBtn');
  const clearTeamsBtn = document.getElementById('clearTeamsBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFileInput = document.getElementById('importFileInput');

  /* =========================================================
     AUDIO FEEDBACK (SYNTHESIZED WEB AUDIO API)
  ========================================================= */
  let audioCtx = null;
  function playBeep(type) {
    try {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (type === 'add') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'deduct') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.2);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'powerup') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.1);
        osc.frequency.linearRampToValueAtTime(1320, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {}
  }

  /* =========================================================
     TOAST NOTIFICATIONS (CLEAN WHITE + ORANGE/YELLOW ACCENT)
  ========================================================= */
  let toastTimer = null;
  function showToast(msg) {
    let toast = document.getElementById('adminToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'adminToast';
      toast.className = 'cyber-toast';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<span>${escapeHTML(msg)}</span>`;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  /* =========================================================
     LOCAL STORAGE PERSISTENCE
  ========================================================= */
  function loadData() {
    try {
      const storedTeams = localStorage.getItem(STORAGE_KEY_TEAMS);
      teams = storedTeams ? JSON.parse(storedTeams) : [];
      if (!Array.isArray(teams)) teams = [];
    } catch (e) {
      teams = [];
    }

    // Sanitize team data
    teams.forEach(t => {
      if (!Array.isArray(t.members)) {
        t.members = [];
      }
      if (typeof t.points !== 'number') {
        t.points = 0;
      }
    });

    try {
      const storedPowerUps = localStorage.getItem(STORAGE_KEY_POWERUPS);
      teamPowerUps = storedPowerUps ? JSON.parse(storedPowerUps) : {};
      if (typeof teamPowerUps !== 'object' || teamPowerUps === null || Array.isArray(teamPowerUps)) {
        teamPowerUps = {};
      }
    } catch (e) {
      teamPowerUps = {};
    }

    try {
      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
      logs = storedLogs ? JSON.parse(storedLogs) : [];
      if (!Array.isArray(logs)) logs = [];
    } catch (e) {
      logs = [];
    }

    // Default starter teams if empty
    if (teams.length === 0) {
      teams = [
        {
          id: 'team_1',
          name: 'Team Cipher',
          members: ['Rohan Verma', 'Aarav Patel', 'Neha Sharma'],
          points: 0
        },
        {
          id: 'team_2',
          name: 'Quantum Core',
          members: ['Ishaan Gupta', 'Pooja Iyer', 'Vikram Sen'],
          points: 0
        }
      ];
      saveTeams();
      addLog('Initialized default teams: Team Cipher & Quantum Core', 0);
    }

    // Load active tab
    const savedTab = localStorage.getItem(STORAGE_KEY_TAB);
    if (savedTab && document.getElementById(`panel-${savedTab}`)) {
      currentActiveTab = savedTab;
    }
  }

  function saveTeams() {
    try {
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
    } catch (e) {
      console.error('Failed to save teams to localStorage', e);
    }
  }

  function saveTeamPowerUps() {
    try {
      localStorage.setItem(STORAGE_KEY_POWERUPS, JSON.stringify(teamPowerUps));
    } catch (e) {
      console.error('Failed to save powerups to localStorage', e);
    }
  }

  function saveLogs() {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs.slice(0, 60)));
    } catch (e) {}
  }

  function addLog(msg, delta = null) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = { id: Date.now() + Math.random(), msg, delta, time };
    logs.unshift(entry);
    if (logs.length > 60) logs.pop();
    saveLogs();
    renderAuditLog();
  }

  /* =========================================================
     TAB NAVIGATION SYSTEM
  ========================================================= */
  const tabMetadata = {
    'add-teams': {
      title: 'Add Teams'
    },
    'points': {
      title: 'Points'
    },
    'leaderboard': {
      title: 'Leaderboard'
    },
    'team-details': {
      title: 'Team Details'
    },
    'activity-log': {
      title: 'Activity Log'
    }
  };

  function switchTab(tabId) {
    currentActiveTab = tabId;
    localStorage.setItem(STORAGE_KEY_TAB, tabId);

    // Update Tab Buttons
    navTabBtns.forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Tab Panels
    tabPanels.forEach(panel => {
      if (panel.id === `panel-${tabId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Update Header Title
    const meta = tabMetadata[tabId] || { title: 'Admin Console' };
    if (currentViewTitle) currentViewTitle.textContent = meta.title;

    // Refresh views if needed
    if (tabId === 'points') {
      updateSelectedTeamBanner();
    } else if (tabId === 'team-details') {
      renderTeamDetails();
    } else if (tabId === 'leaderboard') {
      renderLeaderboard();
    }
  }

  navTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  /* =========================================================
     TEAM OPERATIONS (ADD, DELETE, MEMBERS)
  ========================================================= */
  function createTeam(name, membersList) {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast('Please enter a team name!');
      return;
    }

    // Check duplicate name
    if (teams.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Team "${trimmed}" already exists!`);
      return;
    }

    // Parse member names
    let members = [];
    if (Array.isArray(membersList)) {
      members = membersList.map(m => (m || '').trim()).filter(Boolean);
    } else if (typeof membersList === 'string') {
      members = membersList.split(/[\n,]+/).map(m => m.trim()).filter(Boolean);
    }

    const newTeam = {
      id: 'team_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: trimmed,
      members: members,
      points: 0
    };

    teams.push(newTeam);
    saveTeams();
    addLog(`Created new team: ${newTeam.name} (${newTeam.members.length} members)`, 0);
    renderAll();
    showToast(`Team "${newTeam.name}" created successfully!`);
    playBeep('add');

    // Reset inputs
    if (teamNameInput) teamNameInput.value = '';
    const memberInputs = [memberInput1, memberInput2, memberInput3, memberInput4];
    memberInputs.forEach(inp => { if (inp) inp.value = ''; });
    if (teamNameInput) teamNameInput.focus();

    // Select the new team in team details
    selectedDetailsTeamId = newTeam.id;
  }

  function deleteTeam(teamId) {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    if (!confirm(`Are you sure you want to delete team "${team.name}"?`)) {
      return;
    }

    teams = teams.filter(t => t.id !== teamId);
    delete teamPowerUps[teamId];
    saveTeams();
    saveTeamPowerUps();
    addLog(`Deleted team: ${team.name}`, 0);

    if (selectedDetailsTeamId === teamId) {
      selectedDetailsTeamId = teams.length > 0 ? teams[0].id : null;
    }

    renderAll();
    showToast(`Team "${team.name}" removed.`);
    playBeep('deduct');
  }

  function addMemberToTeam(teamId, memberName) {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    const trimmed = memberName.trim();
    if (!trimmed) return;

    if (!Array.isArray(team.members)) team.members = [];
    if (team.members.length >= 4) {
      showToast('Maximum 4 members allowed per team.');
      return;
    }
    team.members.push(trimmed);
    saveTeams();
    addLog(`Added member "${trimmed}" to ${team.name}`, 0);
    renderAll();
    showToast(`Added ${trimmed} to ${team.name}`);
    playBeep('add');
  }

  function removeMemberFromTeam(teamId, memberIndex) {
    const team = teams.find(t => t.id === teamId);
    if (!team || !Array.isArray(team.members)) return;

    const removed = team.members.splice(memberIndex, 1);
    saveTeams();
    addLog(`Removed member "${removed[0]}" from ${team.name}`, 0);
    renderAll();
    showToast(`Removed member from ${team.name}`);
  }

  /* =========================================================
     POINTS & POWER-UP PROCESSING (PER-QUESTION FLOW)
  ========================================================= */
  function processPointsAndPowerUp(isDeduction = false) {
    const teamId = teamSelect ? teamSelect.value : '';
    if (!teamId) {
      showToast('Please select a target team first!');
      return;
    }

    const team = teams.find(t => t.id === teamId);
    if (!team) {
      showToast('Selected team not found!');
      return;
    }

    const rawPoints = pointsAmountInput ? pointsAmountInput.value.trim() : '';
    const pointsAmount = rawPoints ? parseInt(rawPoints, 10) : 0;
    const rawReason = pointsReasonInput ? pointsReasonInput.value.trim() : '';
    const selectedPowerUpKey = powerUpSelect ? powerUpSelect.value : '';
    const powerUpDef = selectedPowerUpKey ? POWERUP_DEFS[selectedPowerUpKey] : null;
    const powerUpName = powerUpDef ? powerUpDef.name : '';

    if (isNaN(pointsAmount) || pointsAmount < 0) {
      showToast('Please enter a valid points amount!');
      return;
    }

    if (pointsAmount === 0 && !powerUpName) {
      showToast(isDeduction ? 'Please enter points amount to reduce!' : 'Please enter points to add or select a power-up!');
      return;
    }

    let toastMsg = '';
    const reasonNote = rawReason ? ` (${rawReason})` : '';
    const powerUpTag = powerUpName ? ` [Power-Up: ${powerUpName}]` : '';

    if (isDeduction) {
      if (pointsAmount <= 0) {
        showToast('Please enter a positive points value to reduce!');
        return;
      }

      // Apply manual points reduction directly
      team.points = (team.points || 0) - pointsAmount;
      saveTeams();

      addLog(`${team.name}: -${pointsAmount} pts${powerUpTag}${reasonNote} [Total: ${team.points}]`, -pointsAmount);
      toastMsg = powerUpName
        ? `${team.name} -${pointsAmount} PTS with ${powerUpName}! (Total: ${team.points})`
        : `${team.name} -${pointsAmount} PTS! (Total: ${team.points})`;
      playBeep('deduct');
    } else {
      // Award points (Addition flow)
      if (pointsAmount > 0) {
        team.points = (team.points || 0) + pointsAmount;
        saveTeams();

        addLog(`${team.name}: +${pointsAmount} pts${powerUpTag}${reasonNote} [Total: ${team.points}]`, pointsAmount);
        toastMsg = powerUpName
          ? `${team.name} +${pointsAmount} PTS with ${powerUpName}! (Total: ${team.points})`
          : `${team.name} +${pointsAmount} PTS! (Total: ${team.points})`;
        playBeep(powerUpName ? 'powerup' : 'add');
      } else if (powerUpName) {
        // Power-up used without points change
        addLog(`${team.name} used Power-Up: ${powerUpName}${reasonNote}`, 0);
        toastMsg = `${team.name} used Power-Up: ${powerUpName}`;
        playBeep('powerup');
      }
    }

    // Reset inputs
    if (pointsAmountInput) pointsAmountInput.value = '';
    if (pointsReasonInput) pointsReasonInput.value = '';
    if (powerUpSelect) powerUpSelect.value = '';

    showToast(toastMsg);
    renderAll();
  }

  function modifyPoints(teamId, amount, reason = '') {
    const team = teams.find(t => t.id === teamId);
    if (!team) {
      showToast('Please select a team first!');
      return;
    }

    if (amount === 0) {
      showToast('Please enter a non-zero score value!');
      return;
    }

    const isDeduct = amount < 0;
    team.points = (team.points || 0) + amount;
    saveTeams();

    const sign = amount > 0 ? '+' : '';
    const reasonText = reason ? ` for ${reason}` : '';

    addLog(`${team.name}: ${sign}${amount} pts${reasonText} [Total: ${team.points}]`, amount);
    showToast(`${team.name} ${sign}${amount} PTS! (Total: ${team.points})`);

    playBeep(isDeduct ? 'deduct' : 'add');
    renderAll();
  }

  /* =========================================================
     RENDERING FUNCTIONS
  ========================================================= */
  function renderAll() {
    renderStats();
    renderRegisteredTeamsOverview();
    renderTeamSelectors();
    renderPointsTab();
    renderLeaderboard();
    renderTeamDetails();
    renderAuditLog();
  }

  function renderStats() {
    const count = teams.length;
    let totalPoints = 0;
    let topScore = 0;
    let leaderName = '—';

    if (count > 0) {
      const sorted = [...teams].sort((a, b) => (b.points || 0) - (a.points || 0));
      topScore = sorted[0].points || 0;
      leaderName = sorted[0].name;
      totalPoints = teams.reduce((acc, t) => acc + (t.points || 0), 0);
    }

    if (statTotalTeams) statTotalTeams.textContent = count;
    if (sidebarTeamCount) sidebarTeamCount.textContent = count;
    if (registeredTeamsCount) registeredTeamsCount.textContent = count;
    if (statTopScore) statTopScore.textContent = topScore;
    if (statLeadingTeam) statLeadingTeam.textContent = leaderName;
    if (statTotalPoints) statTotalPoints.textContent = totalPoints;
  }

  // TAB 1: Registered Teams List
  function renderRegisteredTeamsOverview() {
    if (!teamsListGrid) return;

    if (teams.length === 0) {
      teamsListGrid.innerHTML = `
        <div class="empty-state">
          <h4>No Teams Added Yet</h4>
          <p>Use the form on the left to add your first team.</p>
        </div>
      `;
      return;
    }

    let html = '';
    teams.forEach(team => {
      const memberCount = (team.members || []).length;
      const membersLabel = memberCount === 1 ? '1 member' : `${memberCount} members`;

      html += `
        <div class="team-card-item" data-id="${team.id}">
          <div class="team-card-left">
            <div class="team-card-details">
              <span class="team-card-name">${escapeHTML(team.name)}</span>
              <span class="team-card-sub">${membersLabel} &bull; ${team.points || 0} pts</span>
            </div>
          </div>
          <div class="team-card-right">
            <span class="team-points-pill">${team.points || 0} PTS</span>
            <button type="button" class="btn-icon-delete" title="Delete Team" data-action="delete-team" data-id="${team.id}">✕</button>
          </div>
        </div>
      `;
    });

    teamsListGrid.innerHTML = html;

    teamsListGrid.querySelectorAll('[data-action="delete-team"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTeam(btn.dataset.id);
      });
    });

    // Clicking team item goes to Team Details
    teamsListGrid.querySelectorAll('.team-card-item').forEach(item => {
      item.addEventListener('click', () => {
        selectedDetailsTeamId = item.dataset.id;
        switchTab('team-details');
      });
    });
  }

  // Populate Team Selectors
  function renderTeamSelectors() {
    const currentPointsVal = teamSelect ? teamSelect.value : '';
    const currentDetailsVal = detailsTeamSelect ? detailsTeamSelect.value : '';

    // 1. Points tab dropdown
    if (teamSelect) {
      teamSelect.innerHTML = '<option value="">-- Choose Target Team --</option>';
      teams.forEach(team => {
        const opt = document.createElement('option');
        opt.value = team.id;
        opt.textContent = `${team.name} (${team.points || 0} pts)`;
        teamSelect.appendChild(opt);
      });

      if (teams.some(t => t.id === currentPointsVal)) {
        teamSelect.value = currentPointsVal;
      } else if (teams.length > 0) {
        teamSelect.value = teams[0].id;
      }
    }

    // 2. Team Details dropdown
    if (detailsTeamSelect) {
      detailsTeamSelect.innerHTML = '<option value="">-- Choose Team to View Members --</option>';
      teams.forEach(team => {
        const opt = document.createElement('option');
        opt.value = team.id;
        opt.textContent = `${team.name}`;
        detailsTeamSelect.appendChild(opt);
      });

      if (!selectedDetailsTeamId && teams.length > 0) {
        selectedDetailsTeamId = teams[0].id;
      }

      if (selectedDetailsTeamId) {
        detailsTeamSelect.value = selectedDetailsTeamId;
      }
    }

    // 3. Quick Chips in Team Details
    if (detailsQuickChips) {
      let chipsHtml = '';
      teams.forEach(team => {
        const isActive = team.id === selectedDetailsTeamId ? 'active' : '';
        const memberCount = (team.members || []).length;
        chipsHtml += `
          <div class="team-chip-btn ${isActive}" data-id="${team.id}">
            <span>${escapeHTML(team.name)}</span>
            <span style="font-size: 0.78rem; opacity: 0.75;">${memberCount} members</span>
          </div>
        `;
      });
      detailsQuickChips.innerHTML = chipsHtml;

      detailsQuickChips.querySelectorAll('.team-chip-btn').forEach(chip => {
        chip.addEventListener('click', () => {
          selectedDetailsTeamId = chip.dataset.id;
          if (detailsTeamSelect) detailsTeamSelect.value = selectedDetailsTeamId;
          renderTeamDetails();
        });
      });
    }
  }

  // TAB 2: Points Tab
  function renderPointsTab() {
    updateSelectedTeamBanner();

    // Quick standings preview in Points tab
    if (quickScoresList) {
      if (teams.length === 0) {
        quickScoresList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 16px;">No teams registered.</div>';
        return;
      }

      const sorted = [...teams].sort((a, b) => (b.points || 0) - (a.points || 0));
      const currentSelected = teamSelect ? teamSelect.value : '';

      let html = '';
      sorted.forEach((team) => {
        const isActive = team.id === currentSelected ? 'active' : '';

        html += `
          <div class="quick-score-item ${isActive}" data-id="${team.id}">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-weight: 700; color: var(--text-dark);">${escapeHTML(team.name)}</span>
            </div>
            <span class="team-points-pill">${team.points || 0} PTS</span>
          </div>
        `;
      });

      quickScoresList.innerHTML = html;

      quickScoresList.querySelectorAll('.quick-score-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.dataset.id;
          if (teamSelect) {
            teamSelect.value = id;
            updateSelectedTeamBanner();
            renderPointsTab();
          }
        });
      });
    }
  }

  function updateSelectedTeamBanner() {
    if (!selectedTeamBanner || !teamSelect) return;
    const selectedId = teamSelect.value;
    const team = teams.find(t => t.id === selectedId);

    if (!team) {
      selectedTeamBanner.style.display = 'none';
      return;
    }

    selectedTeamBanner.style.display = 'flex';
    if (bannerTeamName) bannerTeamName.textContent = team.name;
    if (bannerTeamMembers) {
      const count = (team.members || []).length;
      bannerTeamMembers.textContent = `${count} ${count === 1 ? 'member' : 'members'} registered`;
    }
    if (bannerTeamScore) bannerTeamScore.textContent = team.points || 0;
  }

  // TAB 3: Leaderboard Tab
  function renderLeaderboard() {
    if (!leaderboardContainer) return;

    if (teams.length === 0) {
      leaderboardContainer.innerHTML = `
        <div class="empty-state">
          <h4>No Teams on the Leaderboard</h4>
          <p>Add teams in the "Add Teams" tab to start scoring.</p>
        </div>
      `;
      return;
    }

    const sorted = [...teams].sort((a, b) => (b.points || 0) - (a.points || 0));

    let html = '';
    sorted.forEach((team, idx) => {
      const rank = idx + 1;
      const rankClass = rank === 1 ? 'rank-1' : (rank === 2 ? 'rank-2' : (rank === 3 ? 'rank-3' : ''));
      const rankBadge = `#${rank}`;
      const memberCount = (team.members || []).length;
      const membersText = memberCount > 0 ? `${memberCount} members` : 'No members';

      html += `
        <div class="leaderboard-row ${rankClass}" data-team-id="${team.id}">
          <div class="row-left">
            <div class="rank-badge">${rankBadge}</div>
            <div class="row-info">
              <div class="row-team-name">
                <span>${escapeHTML(team.name)}</span>
              </div>
              <div class="row-members-preview">${membersText}</div>
            </div>
          </div>

          <div class="row-right">
            <div class="row-points">
              <div class="row-points-val">${team.points || 0}</div>
              <div class="row-points-label">POINTS</div>
            </div>
          </div>
        </div>
      `;
    });

    leaderboardContainer.innerHTML = html;

    // Clicking a row switches to Team Details for that team
    leaderboardContainer.querySelectorAll('.leaderboard-row').forEach(row => {
      row.addEventListener('click', () => {
        selectedDetailsTeamId = row.dataset.teamId;
        switchTab('team-details');
      });
    });
  }

  // TAB 4: Team Details Tab
  function renderTeamDetails() {
    if (!teamDetailsEmpty || !teamDetailsContent) return;

    if (!selectedDetailsTeamId || teams.length === 0) {
      teamDetailsEmpty.style.display = 'block';
      teamDetailsContent.style.display = 'none';
      return;
    }

    const team = teams.find(t => t.id === selectedDetailsTeamId);
    if (!team) {
      teamDetailsEmpty.style.display = 'block';
      teamDetailsContent.style.display = 'none';
      return;
    }

    teamDetailsEmpty.style.display = 'none';
    teamDetailsContent.style.display = 'block';

    // Calculate rank
    const sorted = [...teams].sort((a, b) => (b.points || 0) - (a.points || 0));
    const rankIndex = sorted.findIndex(t => t.id === team.id);
    const rank = rankIndex >= 0 ? rankIndex + 1 : '-';

    if (detailsName) detailsName.textContent = team.name;
    if (detailsRank) detailsRank.textContent = `Rank #${rank}`;
    if (detailsPoints) detailsPoints.textContent = team.points || 0;
    if (detailsMemberCount) detailsMemberCount.textContent = (team.members || []).length;
    if (detailsMembersBadge) {
      const count = (team.members || []).length;
      detailsMembersBadge.textContent = `${count} ${count === 1 ? 'Member' : 'Members'}`;
    }

    // Render Members Grid
    if (detailsMembersList) {
      const members = team.members || [];
      if (members.length === 0) {
        detailsMembersList.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 18px; text-align: center; color: var(--text-muted); background: #f8fafc; border-radius: var(--radius-md);">
            No members registered yet for this team. Add a member below!
          </div>
        `;
      } else {
        let membersHtml = '';
        members.forEach((member, idx) => {
          membersHtml += `
            <div class="member-chip">
              <div class="member-name-wrap">
                <span class="member-num">${idx + 1}.</span>
                <span class="member-name-text">${escapeHTML(member)}</span>
              </div>
              <button type="button" class="btn-remove-member" title="Remove Member" data-member-index="${idx}">✕</button>
            </div>
          `;
        });
        detailsMembersList.innerHTML = membersHtml;

        detailsMembersList.querySelectorAll('.btn-remove-member').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.memberIndex, 10);
            removeMemberFromTeam(team.id, index);
          });
        });
      }
    }
  }

  // TAB 5: Activity Log
  function renderAuditLog() {
    if (!auditLogContainer) return;

    if (logs.length === 0) {
      auditLogContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 24px; font-size: 0.9rem;">
          No scoring activity recorded yet.
        </div>
      `;
      return;
    }

    let html = '';
    logs.forEach(log => {
      let deltaClass = '';
      let deltaText = '';
      if (log.delta !== null && log.delta !== undefined && log.delta !== 0) {
        deltaClass = log.delta > 0 ? 'positive' : 'negative';
        deltaText = log.delta > 0 ? `+${log.delta}` : `${log.delta}`;
      }

      html += `
        <div class="log-entry">
          <span class="log-msg">${escapeHTML(log.msg)}</span>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${deltaText ? `<span class="log-delta ${deltaClass}">${deltaText}</span>` : ''}
            <span class="log-time">${log.time}</span>
          </div>
        </div>
      `;
    });

    auditLogContainer.innerHTML = html;
  }

  function escapeHTML(str) {
    return (str || '').replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  /* =========================================================
     EVENT LISTENERS & BINDINGS
  ========================================================= */

  // Team Form Submit
  if (teamForm) {
    teamForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const memberInputs = [memberInput1, memberInput2, memberInput3, memberInput4];
      const members = memberInputs
        .map(inp => inp ? inp.value.trim() : '')
        .filter(Boolean);

      createTeam(
        teamNameInput ? teamNameInput.value : '',
        members
      );
    });
  }

  // Quick Points Buttons (Populate the Points to Add Box)
  document.querySelectorAll('.point-btn[data-amount]').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = Math.abs(parseInt(btn.dataset.amount, 10));
      if (pointsAmountInput) {
        pointsAmountInput.value = amount;
        pointsAmountInput.focus();
      }
    });
  });

  // "Add Points" Button
  if (addPointsSubmitBtn) {
    addPointsSubmitBtn.addEventListener('click', () => {
      processPointsAndPowerUp(false);
    });
  }

  // "Reduce Points" Button
  if (reducePointsSubmitBtn) {
    reducePointsSubmitBtn.addEventListener('click', () => {
      processPointsAndPowerUp(true);
    });
  }

  // Team Select Change in Points Tab
  if (teamSelect) {
    teamSelect.addEventListener('change', () => {
      updateSelectedTeamBanner();
      renderPointsTab();
    });
  }

  // Team Select Change in Team Details Tab
  if (detailsTeamSelect) {
    detailsTeamSelect.addEventListener('change', () => {
      selectedDetailsTeamId = detailsTeamSelect.value;
      renderTeamDetails();
      renderTeamSelectors();
    });
  }

  // Add Member in Team Details
  if (addMemberBtn && newMemberInput) {
    const handleAddMember = () => {
      if (!selectedDetailsTeamId) {
        showToast('Please select a team first!');
        return;
      }
      const val = newMemberInput.value.trim();
      if (!val) {
        showToast('Please enter member name!');
        return;
      }
      addMemberToTeam(selectedDetailsTeamId, val);
      newMemberInput.value = '';
    };

    addMemberBtn.addEventListener('click', handleAddMember);
    newMemberInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddMember();
      }
    });
  }

  // Team Details Go To Points Button
  if (detailsGoToPointsBtn) {
    detailsGoToPointsBtn.addEventListener('click', () => {
      if (selectedDetailsTeamId && teamSelect) {
        teamSelect.value = selectedDetailsTeamId;
      }
      switchTab('points');
    });
  }

  // Reset All Scores
  if (resetScoresBtn) {
    resetScoresBtn.addEventListener('click', () => {
      if (teams.length === 0) return;
      if (!confirm('Are you sure you want to reset ALL team scores to 0?')) return;
      teams.forEach(t => {
        t.points = 0;
      });
      saveTeams();
      addLog('Reset all team scores to 0', 0);
      renderAll();
      showToast('All team scores reset to 0!');
      playBeep('deduct');
    });
  }

  // Clear All Teams
  if (clearTeamsBtn) {
    clearTeamsBtn.addEventListener('click', () => {
      if (teams.length === 0) return;
      if (!confirm('CAUTION: This will delete ALL teams from the portal! Proceed?')) return;
      teams = [];
      teamPowerUps = {};
      saveTeams();
      saveTeamPowerUps();
      selectedDetailsTeamId = null;
      addLog('Cleared all teams from portal', 0);
      renderAll();
      showToast('All teams removed.');
      playBeep('deduct');
    });
  }

  // Clear Audit Log
  if (clearLogBtn) {
    clearLogBtn.addEventListener('click', () => {
      logs = [];
      saveLogs();
      renderAuditLog();
      showToast('Activity log cleared.');
    });
  }

  // Export JSON
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        teams: teams,
        powerUps: teamPowerUps,
        logs: logs
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mpl_teams_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Scoreboard data exported as JSON!');
    });
  }

  // Import JSON
  if (importBtn && importFileInput) {
    importBtn.addEventListener('click', () => {
      importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed && Array.isArray(parsed.teams)) {
            teams = parsed.teams;
            if (parsed.powerUps && typeof parsed.powerUps === 'object') {
              teamPowerUps = parsed.powerUps;
            } else {
              teamPowerUps = {};
            }
            if (Array.isArray(parsed.logs)) logs = parsed.logs;
            saveTeams();
            saveTeamPowerUps();
            saveLogs();
            renderAll();
            showToast(`Imported ${teams.length} teams successfully!`);
            playBeep('add');
          } else if (Array.isArray(parsed)) {
            teams = parsed;
            teamPowerUps = {};
            saveTeams();
            saveTeamPowerUps();
            renderAll();
            showToast(`Imported ${teams.length} teams successfully!`);
            playBeep('add');
          } else {
            alert('Invalid file format. Expected JSON file containing team data.');
          }
        } catch (err) {
          alert('Failed to parse JSON file.');
        }
        importFileInput.value = '';
      };
      reader.readAsText(file);
    });
  }

  // Initialize
  loadData();
  renderAll();
  switchTab(currentActiveTab);

})();
