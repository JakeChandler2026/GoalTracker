const STORAGE_KEY = "bishop-goal-tracker-state-v1";
const backendRuntime = window.BishopGoalTrackerBackend || {
  runtimeMode: "demo-local",
  statusMessage: "Running in demo local mode with browser storage."
};
const backendClient = window.BishopGoalTrackerClient || {
  async loadAppState(storageKey, fallbackState) {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(fallbackState));
  },
  async saveAppState(storageKey, nextState) {
    window.localStorage.setItem(storageKey, JSON.stringify(nextState));
    return true;
  }
};
const authClient = window.BishopGoalTrackerAuthClient || {
  async hydrateSession(appState) {
    return { session: appState.session || null, appState };
  },
  async signIn({ appState, role, email, password }) {
    const matchedUser = appState.users.find((user) =>
      user.role === role &&
      String(user.email || "").toLowerCase() === email &&
      user.password === password
    );
    if (!matchedUser) {
      return { ok: false, error: "Login not recognized. Please use one of the demo accounts or create a new account." };
    }
    return { ok: true, session: { userId: matchedUser.id, authMode: "demo-local" } };
  },
  async signUp({ appState, role, name, email, ward, organization, password, competitionOptIn, createId }) {
    const newUser = {
      id: createId(role === "administrator" ? "admin" : role === "bishop" ? "bishop" : role === "youth_leader" ? "leader" : role === "parent" ? "parent" : "youth"),
      role,
      name,
      email,
      password,
      ward,
      organization,
      competitionOptIn: role === "youth" ? competitionOptIn !== false : false,
      approvalStatus: role === "youth_leader" ? "pending" : "verified"
    };
    return { ok: true, appState: { ...appState, users: [...appState.users, newUser] }, session: { userId: newUser.id, authMode: "demo-local" } };
  },
  async signOut() {
    return { ok: true };
  }
};
const storageAdapter = window.BishopGoalTrackerStorage || {
  name: "browser-localStorage-fallback",
  mode: "demo-local",
  statusMessage: "Running in demo local mode with browser storage.",
  getItem(key) {
    return window.localStorage.getItem(key);
  },
  setItem(key, value) {
    window.localStorage.setItem(key, value);
  },
  removeItem(key) {
    window.localStorage.removeItem(key);
  }
};
const isSupabaseRuntime = backendRuntime.runtimeMode === "supabase";
const BOOTSTRAP_TIMEOUT_MS = 8000;
const GOAL_DIFFICULTIES = {
  easy: {
    label: "Easy",
    summary: "A focused goal with a smaller scope."
  },
  medium: {
    label: "Medium",
    summary: "A steady goal that takes meaningful effort."
  },
  hard: {
    label: "Hard",
    summary: "A demanding goal with a larger commitment."
  }
};
const DIFFICULTY_ORDER = ["easy", "medium", "hard"];
const GOAL_CATEGORIES = {
  physical: {
    label: "Physical"
  },
  spiritual: {
    label: "Spiritual"
  },
  intellectual: {
    label: "Intellectual"
  },
  social: {
    label: "Social"
  }
};
const CATEGORY_ORDER = ["physical", "spiritual", "intellectual", "social"];
const LEVEL_NAMES = {
  1: "Learn",
  2: "Live",
  3: "Lead"
};
const DEFAULT_LEVEL_GOAL_REQUIREMENTS = [
  {
    level: 1,
    categories: {
      physical: { easy: 1, medium: 0, hard: 0 },
      spiritual: { easy: 1, medium: 1, hard: 0 },
      intellectual: { easy: 1, medium: 0, hard: 0 },
      social: { easy: 1, medium: 0, hard: 0 }
    }
  },
  {
    level: 2,
    categories: {
      physical: { easy: 1, medium: 1, hard: 0 },
      spiritual: { easy: 1, medium: 1, hard: 1 },
      intellectual: { easy: 1, medium: 1, hard: 0 },
      social: { easy: 1, medium: 1, hard: 0 }
    }
  },
  {
    level: 3,
    categories: {
      physical: { easy: 1, medium: 1, hard: 1 },
      spiritual: { easy: 1, medium: 2, hard: 1 },
      intellectual: { easy: 1, medium: 1, hard: 1 },
      social: { easy: 1, medium: 1, hard: 1 }
    }
  }
];
const LEVEL_POINT_REQUIREMENTS = [100, 100, 100];
const LEADERBOARD_PERIODS = {
  all: {
    label: "All Time",
    summary: "All approved goals"
  },
  week: {
    label: "This Week",
    summary: "Goals approved this week"
  },
  month: {
    label: "This Month",
    summary: "Goals approved this month"
  }
};
const BOOK_OF_MORMON_BOOKS = [
  ["1 Nephi", 22],
  ["2 Nephi", 33],
  ["Jacob", 7],
  ["Enos", 1],
  ["Jarom", 1],
  ["Omni", 1],
  ["Words of Mormon", 1],
  ["Mosiah", 29],
  ["Alma", 63],
  ["Helaman", 16],
  ["3 Nephi", 30],
  ["4 Nephi", 1],
  ["Mormon", 9],
  ["Ether", 15],
  ["Moroni", 10]
];
function createBookOfMormonChapterChecklist(idPrefix) {
  return BOOK_OF_MORMON_BOOKS.flatMap(([bookName, chapterCount]) =>
    Array.from({ length: chapterCount }, (_, index) => ({
      id: `${idPrefix}-${bookName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index + 1}`,
      title: `${bookName} ${index + 1}`,
      repeatCount: 1
    }))
  );
}

const firstRunState = {
  stakes: [
    { id: "s1", name: "Pocatello Idaho Stake" }
  ],
  wards: [
    { id: "w1", name: "Mapleton 1st Ward", stakeId: "s1", stakeName: "Pocatello Idaho Stake" },
    { id: "w2", name: "Pocatello Creek Ward", stakeId: "s1", stakeName: "Pocatello Idaho Stake" }
  ],
  users: [
    { id: "a1", role: "administrator", email: "admin@example.com", password: "admin123", name: "Stake Administrator", ward: "All Wards", organization: "all", approvalStatus: "verified" },
    { id: "u1", role: "youth", email: "josh@example.com", password: "goal123", name: "Josh Carter", ward: "Mapleton 1st Ward", organization: "young_men", sameGoalNotificationsOptIn: true, notificationChannels: { inApp: true, email: true, push: false } },
    { id: "u2", role: "youth", email: "maria@example.com", password: "growth456", name: "Maria Lopez", ward: "Mapleton 1st Ward", organization: "young_women" },
    { id: "u5", role: "youth", email: "noah.kim@example.com", password: "sample123", name: "Noah Kim", ward: "Mapleton 1st Ward", organization: "young_men" },
    { id: "u6", role: "youth", email: "ava.price@example.com", password: "sample456", name: "Ava Price", ward: "Mapleton 1st Ward", organization: "young_women" },
    { id: "u3", role: "youth", email: "eli.roberts@example.com", password: "pocatello1", name: "Eli Roberts", ward: "Pocatello Creek Ward", organization: "young_men" },
    { id: "u4", role: "youth", email: "sophie.martin@example.com", password: "pocatello2", name: "Sophie Martin", ward: "Pocatello Creek Ward", organization: "young_women" },
    { id: "p1", role: "parent", email: "parent.carter@example.com", password: "parent123", name: "Taylor Carter", ward: "Mapleton 1st Ward", organization: "all", approvalStatus: "verified", loginStatus: "verified" },
    { id: "l1", role: "youth_leader", email: "leader.one@example.com", password: "approve789", name: "Brother Jensen", ward: "Mapleton 1st Ward", organization: "young_men", approvalStatus: "approved", weeklySummaryEmailOptIn: true },
    { id: "l2", role: "youth_leader", email: "leader.two@example.com", password: "hearts456", name: "Sister Lopez", ward: "Mapleton 1st Ward", organization: "young_women", approvalStatus: "approved", weeklySummaryEmailOptIn: true },
    { id: "b1", role: "bishop", email: "ward.bishop@example.com", password: "steward123", name: "Bishop Reynolds", ward: "Mapleton 1st Ward", approvalStatus: "verified", weeklySummaryEmailOptIn: true },
    { id: "b2", role: "bishop", email: "pocatello.bishop@example.com", password: "steward456", name: "Jacob Chandler", ward: "Pocatello Creek Ward", approvalStatus: "verified" }
  ],
  goals: [
    {
      id: "g1",
      userId: "u1",
      title: "Complete Service Project Plan",
      summary: "Organize and finish a monthly quorum service project with full participation.",
      points: 40,
      deadline: "2026-12-31",
      leaderApproved: false,
      leaderApprovedBy: null,
      completedAt: null,
      subGoals: [
        { id: "sg1", title: "Choose project location", completed: true },
        { id: "sg2", title: "Build volunteer sign-up list", completed: true },
        { id: "sg3", title: "Finish project day", completed: false }
      ]
    },
    {
      id: "g2",
      userId: "u1",
      title: "Prepare Teaching Assignment",
      summary: "Study, prepare, and deliver the next quorum lesson.",
      points: 60,
      deadline: "2026-12-31",
      leaderApproved: false,
      leaderApprovedBy: null,
      completedAt: null,
      subGoals: [
        { id: "sg4", title: "Read source materials", completed: true },
        { id: "sg5", title: "Write outline", completed: true },
        { id: "sg6", title: "Deliver lesson", completed: true }
      ]
    },
    {
      id: "g3",
      userId: "u2",
      title: "Temple Family History Goal",
      summary: "Research family names and prepare one family line for temple submission.",
      points: 100,
      deadline: "2026-12-31",
      leaderApproved: true,
      leaderApprovedBy: "Bishop Reynolds",
      completedAt: "2026-04-01",
      subGoals: [
        { id: "sg7", title: "Collect family records", completed: true },
        { id: "sg8", title: "Verify dates and places", completed: true },
        { id: "sg9", title: "Submit final names", completed: true }
      ]
    },
    {
      id: "g4",
      userId: "u3",
      title: "Build a Scripture Study Habit",
      summary: "Create a steady weekly scripture study rhythm and record personal insights.",
      points: 50,
      priorityOrder: 100,
      goalApproved: true,
      goalApprovedBy: "Bishop Reynolds",
      goalApprovedAt: "2026-04-01",
      deadline: "2026-12-31",
      leaderApproved: false,
      leaderApprovedBy: null,
      completedAt: null,
      subGoals: [
        { id: "sg10", title: "Complete two weeks of study", repeatCount: 1, completedUnits: ["2026-04-10"] },
        { id: "sg11", title: "Share one insight with a leader", repeatCount: 1, completedUnits: [null] }
      ]
    },
    {
      id: "g5",
      userId: "u3",
      title: "Serve a Neighbor",
      summary: "Plan and complete a simple act of service for someone in the ward neighborhood.",
      points: 50,
      priorityOrder: 200,
      goalApproved: true,
      goalApprovedBy: "Bishop Reynolds",
      goalApprovedAt: "2026-04-01",
      deadline: "2026-12-31",
      leaderApproved: false,
      leaderApprovedBy: null,
      completedAt: null,
      subGoals: [
        { id: "sg12", title: "Choose a person to serve", repeatCount: 1, completedUnits: ["2026-04-12"] },
        { id: "sg13", title: "Finish the service visit", repeatCount: 1, completedUnits: [null] }
      ]
    },
    {
      id: "g6",
      userId: "u4",
      title: "Prepare a Temple Name",
      summary: "Research a family name and prepare it for temple work.",
      points: 50,
      priorityOrder: 100,
      goalApproved: true,
      goalApprovedBy: "Bishop Reynolds",
      goalApprovedAt: "2026-04-01",
      deadline: "2026-12-31",
      leaderApproved: false,
      leaderApprovedBy: null,
      completedAt: null,
      subGoals: [
        { id: "sg14", title: "Find a family record", repeatCount: 1, completedUnits: ["2026-04-11"] },
        { id: "sg15", title: "Verify and prepare the name", repeatCount: 1, completedUnits: [null] }
      ]
    },
    {
      id: "g7",
      userId: "u4",
      title: "Plan a Class Activity",
      summary: "Help plan a meaningful activity that builds friendship and faith.",
      points: 50,
      priorityOrder: 200,
      goalApproved: true,
      goalApprovedBy: "Bishop Reynolds",
      goalApprovedAt: "2026-04-01",
      deadline: "2026-12-31",
      leaderApproved: false,
      leaderApprovedBy: null,
      completedAt: null,
      subGoals: [
        { id: "sg16", title: "Draft the activity idea", repeatCount: 1, completedUnits: ["2026-04-13"] },
        { id: "sg17", title: "Coordinate the final plan", repeatCount: 1, completedUnits: [null] }
      ]
    },
    {
      id: "g8",
      userId: "u1",
      title: "Read the Book of Mormon",
      summary: "Track chapter reading progress for the year.",
      points: 70,
      priorityOrder: 300,
      goalApproved: true,
      goalApprovedBy: "Bishop Reynolds",
      goalApprovedAt: "2026-05-01",
      deadline: "2027-05-01",
      leaderApproved: true,
      leaderApprovedBy: "Brother Jensen",
      completedAt: "2026-05-18",
      sourceTemplateId: "t-bom-sample",
      subGoals: [
        { id: "sg18", title: "Read 1 Nephi", repeatCount: 5, completedUnits: ["2026-05-18", "2026-05-18", "2026-05-18", null, null] }
      ]
    },
    {
      id: "g9",
      userId: "u2",
      title: "Read the Book of Mormon",
      summary: "Track chapter reading progress for the year.",
      points: 90,
      priorityOrder: 300,
      goalApproved: true,
      goalApprovedBy: "Bishop Reynolds",
      goalApprovedAt: "2026-05-01",
      deadline: "2027-05-01",
      leaderApproved: true,
      leaderApprovedBy: "Sister Lopez",
      completedAt: "2026-05-18",
      sourceTemplateId: "t-bom-sample",
      subGoals: [
        { id: "sg19", title: "Read 1 Nephi", repeatCount: 5, completedUnits: ["2026-05-18", "2026-05-18", "2026-05-18", "2026-05-18", "2026-05-18"] }
      ]
    },
    {
      id: "g10",
      userId: "u1",
      title: "Ministering Visit",
      summary: "Complete a ministering visit and report back.",
      points: 80,
      priorityOrder: 400,
      goalApproved: true,
      goalApprovedBy: "Bishop Reynolds",
      goalApprovedAt: "2026-05-01",
      deadline: "2026-06-01",
      leaderApproved: true,
      leaderApprovedBy: "Brother Jensen",
      completedAt: "2026-05-02",
      subGoals: [
        { id: "sg20", title: "Visit completed", repeatCount: 1, completedUnits: ["2026-05-02"] }
      ]
    },
    {
      id: "g11",
      userId: "u5",
      title: "Quorum Service Sprint",
      summary: "Finish a focused week of service.",
      points: 55,
      priorityOrder: 100,
      goalApproved: true,
      goalApprovedBy: "Bishop Reynolds",
      goalApprovedAt: "2026-05-05",
      deadline: "2026-05-31",
      leaderApproved: true,
      leaderApprovedBy: "Brother Jensen",
      completedAt: "2026-05-18",
      subGoals: [
        { id: "sg21", title: "Service sprint complete", repeatCount: 1, completedUnits: ["2026-05-18"] }
      ]
    },
    {
      id: "g12",
      userId: "u6",
      title: "Class Fellowship Challenge",
      summary: "Invite and include someone new this month.",
      points: 45,
      priorityOrder: 100,
      goalApproved: true,
      goalApprovedBy: "Bishop Reynolds",
      goalApprovedAt: "2026-05-03",
      deadline: "2026-05-31",
      leaderApproved: true,
      leaderApprovedBy: "Sister Lopez",
      completedAt: "2026-05-03",
      subGoals: [
        { id: "sg22", title: "Fellowship challenge complete", repeatCount: 1, completedUnits: ["2026-05-03"] }
      ]
    }
  ],
  templates: [
    {
      id: "t1",
      title: "Daily Scripture Habit",
      summary: "Build a steady scripture study routine over three months.",
      points: 100,
      difficulty: "hard",
      category: "spiritual",
      templateApproved: true,
      subGoals: [
        { id: "tsg1", title: "Read 20 minutes a day", repeatCount: 90 },
        { id: "tsg2", title: "Write one takeaway each week", repeatCount: 12 }
      ]
    },
    {
      id: "t-pending-service",
      title: "Pending Service Template",
      summary: "A sample optional template that must be reviewed before youth can use it.",
      points: 0,
      difficulty: "easy",
      category: "social",
      templateApproved: false,
      subGoals: [
        { id: "tsg-pending-service-1", title: "Complete a service invitation", repeatCount: 1 }
      ]
    }
  ],
  levelGoalRequirements: DEFAULT_LEVEL_GOAL_REQUIREMENTS,
  requiredLevelGoals: [
    {
      id: "required-bom-level1-mapleton",
      ward: "Mapleton 1st Ward",
      level: 1,
      title: "Read the Book of Mormon",
      summary: "Read the Book of Mormon in its entirety in less than one year.",
      points: 0,
      difficulty: "hard",
      category: "spiritual",
      deadlineDays: 365,
      subGoals: createBookOfMormonChapterChecklist("required-bom-level1-mapleton")
    },
    {
      id: "required-bom-level1-pocatello-creek",
      ward: "Pocatello Creek Ward",
      level: 1,
      title: "Read the Book of Mormon",
      summary: "Read the Book of Mormon in its entirety in less than one year.",
      points: 0,
      difficulty: "hard",
      category: "spiritual",
      deadlineDays: 365,
      subGoals: createBookOfMormonChapterChecklist("required-bom-level1-pocatello-creek")
    }
  ],
  parentYouthLinks: [
    { parentId: "p1", youthId: "u1", relationship: "Parent" }
  ],
  notifications: [],
  session: null
};

const elements = {
  userTab: document.getElementById("userTab"),
  parentTab: document.getElementById("parentTab"),
  leaderTab: document.getElementById("leaderTab"),
  bishopTab: document.getElementById("bishopTab"),
  adminTab: document.getElementById("adminTab"),
  signInModeButton: document.getElementById("signInModeButton"),
  createAccountModeButton: document.getElementById("createAccountModeButton"),
  userAuthModes: document.getElementById("userAuthModes"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  registerWard: document.getElementById("registerWard"),
  registerNewWardField: document.getElementById("registerNewWardField"),
  registerNewWard: document.getElementById("registerNewWard"),
  registerOrganizationField: document.getElementById("registerOrganizationField"),
  registerCompetitionField: document.getElementById("registerCompetitionField"),
  username: document.getElementById("username"),
  password: document.getElementById("password"),
  identityLabel: document.getElementById("identityLabel"),
  loginView: document.getElementById("loginView"),
  sessionView: document.getElementById("sessionView"),
  accountMenu: document.getElementById("accountMenu"),
  accountMenuButton: document.getElementById("accountMenuButton"),
  accountMenuPanel: document.getElementById("accountMenuPanel"),
  authPanel: document.getElementById("authPanel"),
  appGrid: document.querySelector(".app-grid"),
  sessionBadge: document.getElementById("sessionBadge"),
  sessionTitle: document.getElementById("sessionTitle"),
  sessionDescription: document.getElementById("sessionDescription"),
  sessionProgressTracker: document.getElementById("sessionProgressTracker"),
  logoutButton: document.getElementById("logoutButton"),
  demoAccountsBox: document.getElementById("demoAccountsBox"),
  dashboardTitle: document.getElementById("dashboardTitle"),
  emptyState: document.getElementById("emptyState"),
  runtimeBanner: document.getElementById("runtimeBanner"),
  userDashboard: document.getElementById("userDashboard"),
  leaderDashboard: document.getElementById("leaderDashboard"),
  goalCardTemplate: document.getElementById("goalCardTemplate")
};

let activeRole = "youth";
let activeUserAuthMode = "signin";
let activeTemplateId = null;
const NEW_TEMPLATE_ID = "__new_template__";
let activeYouthDashboardView = "goals";
let activeLeaderboardPeriod = "all";
let activeAdminDashboardView = "overview";
let activeGoalEditorId = null;
let activeEditingYouthId = null;
let state = normalizeState(getFallbackState());
let bootstrappedState = false;

function cloneFirstRunState() {
  return JSON.parse(JSON.stringify(firstRunState));
}

function createEmptyState() {
  return {
    stakes: [],
    wards: [],
    users: [],
    goals: [],
    templates: [],
    levelGoalRequirements: DEFAULT_LEVEL_GOAL_REQUIREMENTS,
    requiredLevelGoals: [],
    parentYouthLinks: [],
    notifications: [],
    session: null
  };
}

function getFallbackState() {
  return isSupabaseRuntime ? createEmptyState() : cloneFirstRunState();
}

function mergeDemoSeedState(loadedState) {
  if (isSupabaseRuntime) {
    return { state: loadedState, changed: false };
  }

  const nextState = JSON.parse(JSON.stringify(loadedState));
  const seededState = normalizeState(cloneFirstRunState());
  let changed = false;

  const mergeById = (collectionName) => {
    const existingIds = new Set((nextState[collectionName] || []).map((item) => item.id));
    seededState[collectionName].forEach((seededItem) => {
      if (!existingIds.has(seededItem.id)) {
        nextState[collectionName].push(JSON.parse(JSON.stringify(seededItem)));
        existingIds.add(seededItem.id);
        changed = true;
      }
    });
  };

  mergeById("users");
  mergeById("goals");
  mergeById("templates");
  mergeById("requiredLevelGoals");
  if (!loadedState.levelGoalRequirements?.length) {
    loadedState.levelGoalRequirements = cloneDefaultLevelGoalRequirements();
  }
  mergeById("stakes");
  mergeById("wards");

  const existingParentLinks = new Set((nextState.parentYouthLinks || []).map((link) => `${link.parentId}:${link.youthId}`));
  seededState.parentYouthLinks.forEach((seededLink) => {
    const key = `${seededLink.parentId}:${seededLink.youthId}`;
    if (!existingParentLinks.has(key)) {
      nextState.parentYouthLinks.push(JSON.parse(JSON.stringify(seededLink)));
      existingParentLinks.add(key);
      changed = true;
    }
  });

  return { state: normalizeState(nextState), changed };
}

function cloneStateSnapshot() {
  return JSON.parse(JSON.stringify(state));
}

function stateUsersToWardNames(appState) {
  const wardNames = [];
  (appState.users || []).forEach((user) => {
    const wardName = String(user.ward || "").trim();
    if (wardName && !wardNames.some((existingName) => isSameWard(existingName, wardName))) {
      wardNames.push(wardName);
    }
  });
  return wardNames;
}

function renderRuntimeBanner() {
  if (elements.demoAccountsBox) {
    elements.demoAccountsBox.classList.toggle("hidden", isSupabaseRuntime);
  }

  if (!elements.runtimeBanner) {
    return;
  }

  const modeLabel = backendRuntime.runtimeMode === "supabase" ? "Supabase Mode" : "Demo Local Mode";
  elements.runtimeBanner.innerHTML = `<strong>${modeLabel}</strong><span>${storageAdapter.statusMessage || backendRuntime.statusMessage}</span>`;
}

function applyBackendState(nextState, sessionOverride = state.session) {
  state = normalizeState(nextState);
  if (sessionOverride) {
    state.session = sessionOverride;
  }
}

async function persistGoal(goal, options = {}) {
  const nextState = options.isCreate
    ? await backendClient.createGoal(STORAGE_KEY, state, {
      goal,
      createdBy: options.createdBy || state.session?.userId || goal.userId,
      sourceTemplateId: options.sourceTemplateId || null,
      sourceGoalId: options.sourceGoalId || null,
      fallbackState: getFallbackState()
    })
    : await backendClient.updateGoal(STORAGE_KEY, state, {
      goal,
      fallbackState: getFallbackState()
    });
  applyBackendState(nextState);
  saveState();
  render();
}

async function persistTemplate(template, options = {}) {
  const nextState = options.isCreate
    ? await backendClient.createTemplate(STORAGE_KEY, state, {
      template,
      createdBy: options.createdBy || state.session?.userId,
      fallbackState: getFallbackState()
    })
    : await backendClient.updateTemplate(STORAGE_KEY, state, {
      template,
      fallbackState: getFallbackState()
    });
  applyBackendState(nextState);
  saveState();
  render();
}

function normalizeState(rawState) {
  const nextState = JSON.parse(JSON.stringify(rawState));

  const defaultStakeName = "Default Stake";
  nextState.stakes = (nextState.stakes || []).map((stake) => ({
    id: stake.id || createId("stake"),
    name: String(stake.name || "").trim()
  })).filter((stake) => stake.name);

  const ensureStake = (stakeName) => {
    const normalizedStakeName = String(stakeName || defaultStakeName).trim() || defaultStakeName;
    let stake = nextState.stakes.find((item) => item.name.toLowerCase() === normalizedStakeName.toLowerCase());
    if (!stake) {
      stake = { id: createId("stake"), name: normalizedStakeName };
      nextState.stakes.push(stake);
    }
    return stake;
  };

  nextState.wards = (nextState.wards || []).map((ward) => {
    const stake = nextState.stakes.find((item) => item.id === ward.stakeId) || ensureStake(ward.stakeName);
    return {
      id: ward.id || createId("ward"),
      name: String(ward.name || "").trim(),
      stakeId: stake.id,
      stakeName: stake.name
    };
  }).filter((ward) => ward.name);

  nextState.users = nextState.users.map((user) => ({
    ...user,
    role: user.role === "user" ? "youth" : user.role === "leader" ? "youth_leader" : user.role,
    email: String(user.email || user.username || "").toLowerCase(),
    ward: String(user.ward || "").trim(),
    organization: user.role === "bishop" || user.role === "parent" || user.role === "administrator" ? "all" : (user.organization || (user.role === "youth" ? "young_men" : "young_men")),
    competitionOptIn: user.role === "youth" ? user.competitionOptIn !== false : false,
    sameGoalNotificationsOptIn: user.role === "youth" ? Boolean(user.sameGoalNotificationsOptIn) : false,
    weeklySummaryEmailOptIn: user.role === "bishop" || user.role === "youth_leader" ? user.weeklySummaryEmailOptIn !== false : false,
    notificationChannels: {
      inApp: user.notificationChannels?.inApp !== false,
      email: Boolean(user.notificationChannels?.email),
      push: Boolean(user.notificationChannels?.push)
    },
    inactivityNotificationsOptIn: user.role === "youth" ? Boolean(user.inactivityNotificationsOptIn) : false,
    inactivityNotificationChannels: {
      inApp: user.inactivityNotificationChannels?.inApp !== false,
      email: Boolean(user.inactivityNotificationChannels?.email),
      push: Boolean(user.inactivityNotificationChannels?.push)
    },
    inactivityReminderMinHours: Math.min(96, Math.max(24, Number(user.inactivityReminderMinHours || 24))),
    inactivityReminderMaxHours: Math.min(96, Math.max(24, Number(user.inactivityReminderMaxHours || 96))),
    nextInactivityReminderAt: user.nextInactivityReminderAt || null,
    pushToken: user.pushToken || "",
    lastActiveAt: user.lastActiveAt || null,
    approvalStatus: user.approvalStatus || (user.role === "youth_leader" ? "approved" : "verified"),
    loginStatus: user.loginStatus || ((user.role === "youth" || user.role === "parent") && !user.email ? "not_invited" : "verified")
  }));

  nextState.parentYouthLinks = (nextState.parentYouthLinks || []).map((link) => ({
    parentId: link.parentId,
    youthId: link.youthId,
    relationship: String(link.relationship || "Parent").trim() || "Parent"
  })).filter((link) => link.parentId && link.youthId);

  nextState.notifications = (nextState.notifications || []).map((notification) => ({
    id: notification.id || createId("notification"),
    userId: notification.userId,
    actorId: notification.actorId || null,
    actorName: notification.actorName || "Another youth",
    goalId: notification.goalId || null,
    goalTitle: notification.goalTitle || "Shared goal",
    type: notification.type || "same_goal_passed",
    message: notification.message || "",
    recipientEmail: notification.recipientEmail || "",
    pushToken: notification.pushToken || "",
    createdAt: normalizeDateString(notification.createdAt) || getTodayDateString(),
    readAt: normalizeDateString(notification.readAt),
    channels: {
      inApp: notification.channels?.inApp !== false,
      email: Boolean(notification.channels?.email),
      push: Boolean(notification.channels?.push)
    },
    status: notification.status || "queued"
  })).filter((notification) => notification.userId && notification.message);

  nextState.levelGoalRequirements = normalizeLevelGoalRequirements(nextState.levelGoalRequirements);

  nextState.goals = nextState.goals.map((goal, index) => {
    const points = normalizePointValue(goal.points);
    const completionApproved = Boolean(goal.leaderApproved);
    const planApproved = typeof goal.goalApproved === "boolean"
      ? goal.goalApproved
      : points > 0 || completionApproved;
    const parsedPriority = Number(goal.priorityOrder);

    return {
      ...goal,
      points,
      difficulty: normalizeDifficulty(goal.difficulty, points),
      category: normalizeGoalCategory(goal.category),
      priorityOrder: Number.isFinite(parsedPriority) ? parsedPriority : (index + 1) * 100,
      sourceTemplateId: goal.sourceTemplateId || goal.source_template_id || null,
      sourceGoalId: goal.sourceGoalId || goal.source_goal_id || null,
      requiredGoalDefinitionId: goal.requiredGoalDefinitionId || null,
      requiredGoalLevel: Number.isFinite(Number(goal.requiredGoalLevel)) ? Number(goal.requiredGoalLevel) : null,
      goalApproved: planApproved,
      goalApprovedBy: goal.goalApprovedBy || (planApproved ? goal.leaderApprovedBy || "Leader" : null),
      goalApprovedAt: goal.goalApprovedAt || (planApproved ? goal.completedAt || null : null),
      leaderApproved: completionApproved,
      leaderApprovedBy: goal.leaderApprovedBy || null,
      completedAt: goal.completedAt || null,
      deadline: normalizeGoalDeadline(goal),
      subGoals: goal.subGoals.map((subGoal) => ({
        id: subGoal.id,
        title: subGoal.title,
        repeatCount: Math.max(1, Number(subGoal.repeatCount || 1)),
        completedUnits: normalizeCompletedUnits(subGoal)
      }))
    };
  });

  nextState.goals.forEach((goal) => {
    goal.subGoals = goal.subGoals.map((subGoal) => ({
      ...subGoal,
      completedUnits: subGoal.completedUnits.slice(0, subGoal.repeatCount)
    }));
  });

  nextState.templates = (nextState.templates || []).map((template) => ({
    ...template,
    points: normalizePointValue(template.points),
    difficulty: normalizeDifficulty(template.difficulty, template.points),
    category: normalizeGoalCategory(template.category),
    templateApproved: template.templateApproved !== false,
    templateApprovedBy: template.templateApprovedBy || null,
    templateApprovedAt: normalizeDateString(template.templateApprovedAt),
    subGoals: (template.subGoals || []).map((subGoal) => ({
      id: subGoal.id,
      title: subGoal.title,
      repeatCount: parseRepeatCount(subGoal.repeatCount || 1)
    }))
  }));

  nextState.requiredLevelGoals = (nextState.requiredLevelGoals || []).map((goal) => ({
    id: goal.id || createId("required-goal"),
    ward: String(goal.ward || "").trim(),
    level: Math.max(1, Math.min(LEVEL_POINT_REQUIREMENTS.length, Number(goal.level || 1))),
    title: String(goal.title || "").trim(),
    summary: String(goal.summary || "").trim(),
    points: normalizePointValue(goal.points),
    difficulty: normalizeDifficulty(goal.difficulty, goal.points),
    category: normalizeGoalCategory(goal.category),
    deadlineDays: Number.isFinite(Number(goal.deadlineDays)) ? Math.max(1, Number(goal.deadlineDays)) : 30,
    subGoals: (goal.subGoals || []).map((subGoal) => ({
      id: subGoal.id || createId("required-subgoal"),
      title: String(subGoal.title || "").trim(),
      repeatCount: parseRepeatCount(subGoal.repeatCount || 1)
    })).filter((subGoal) => subGoal.title)
  })).filter((goal) => goal.ward && goal.title && goal.summary && goal.subGoals.length);

  stateUsersToWardNames(nextState).forEach((wardName) => {
    if (!nextState.wards.some((ward) => isSameWard(ward.name, wardName))) {
      const stake = ensureStake(defaultStakeName);
      nextState.wards.push({ id: createId("ward"), name: wardName, stakeId: stake.id, stakeName: stake.name });
    }
  });

  return nextState;
}

async function loadState() {
  try {
    const loadedState = await backendClient.loadAppState(STORAGE_KEY, getFallbackState());
    const mergedState = mergeDemoSeedState(normalizeState(loadedState));
    if (mergedState.changed) {
      storageAdapter.setItem(STORAGE_KEY, JSON.stringify(mergedState.state));
      backendClient.saveAppState(STORAGE_KEY, mergedState.state).catch((error) => {
        console.warn("Demo seed merge could not be saved.", error);
      });
    }
    return mergedState.state;
  } catch (error) {
    console.warn("Backend client load failed; using local fallback state.", error);
    const saved = storageAdapter.getItem(STORAGE_KEY);
    if (!saved) {
      const initialState = normalizeState(getFallbackState());
      storageAdapter.setItem(STORAGE_KEY, JSON.stringify(initialState));
      return initialState;
    }

    try {
      const mergedState = mergeDemoSeedState(normalizeState(JSON.parse(saved)));
      if (mergedState.changed) {
        storageAdapter.setItem(STORAGE_KEY, JSON.stringify(mergedState.state));
      }
      return mergedState.state;
    } catch (fallbackError) {
      const initialState = normalizeState(getFallbackState());
      storageAdapter.setItem(STORAGE_KEY, JSON.stringify(initialState));
      return initialState;
    }
  }
}

function loadCachedState() {
  const saved = storageAdapter.getItem(STORAGE_KEY);
  if (!saved) {
    return normalizeState(getFallbackState());
  }

  try {
    return mergeDemoSeedState(normalizeState(JSON.parse(saved))).state;
  } catch (error) {
    return normalizeState(getFallbackState());
  }
}

function createTimeoutPromise(label, milliseconds) {
  return new Promise((_, reject) => {
    window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${milliseconds}ms.`));
    }, milliseconds);
  });
}

function saveState() {
  storageAdapter.setItem(STORAGE_KEY, JSON.stringify(state));
  backendClient.saveAppState(STORAGE_KEY, state).catch((error) => {
    console.warn("Backend client save failed; local fallback remains available.", error);
  });
}

function getOrderedYouthGoals(userId) {
  return state.goals
    .filter((goal) => goal.userId === userId)
    .sort((a, b) => {
      const priorityDifference = Number(a.priorityOrder || 0) - Number(b.priorityOrder || 0);
      if (priorityDifference !== 0) {
        return priorityDifference;
      }
      return state.goals.indexOf(a) - state.goals.indexOf(b);
    });
}

function getNextGoalPriority(userId) {
  const priorities = state.goals
    .filter((goal) => goal.userId === userId)
    .map((goal) => Number(goal.priorityOrder || 0));
  return priorities.length ? Math.max(...priorities) + 100 : 100;
}

function reorderYouthGoal(userId, draggedGoalId, targetGoalId, placement = "before") {
  if (!draggedGoalId || !targetGoalId || draggedGoalId === targetGoalId) {
    return;
  }

  const orderedGoals = getOrderedYouthGoals(userId);
  const draggedGoal = orderedGoals.find((goal) => goal.id === draggedGoalId);
  const targetIndex = orderedGoals.findIndex((goal) => goal.id === targetGoalId);
  if (!draggedGoal || targetIndex < 0) {
    return;
  }

  const nextOrder = orderedGoals.filter((goal) => goal.id !== draggedGoalId);
  const adjustedTargetIndex = nextOrder.findIndex((goal) => goal.id === targetGoalId);
  const insertIndex = adjustedTargetIndex < 0 ? targetIndex : adjustedTargetIndex;
  nextOrder.splice(placement === "after" ? insertIndex + 1 : insertIndex, 0, draggedGoal);
  nextOrder.forEach((goal, index) => {
    goal.priorityOrder = (index + 1) * 100;
  });

  saveState();
  render();
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDateString(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

function getLeaderboardPeriodRange(period = activeLeaderboardPeriod, referenceDateString = getTodayDateString()) {
  if (period === "all") {
    return null;
  }

  const referenceDate = new Date(`${referenceDateString}T00:00:00`);
  if (Number.isNaN(referenceDate.getTime())) {
    return null;
  }

  if (period === "week") {
    const startDate = new Date(referenceDate);
    const daysSinceMonday = (startDate.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - daysSinceMonday);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return {
      start: startDate.toISOString().slice(0, 10),
      end: endDate.toISOString().slice(0, 10)
    };
  }

  if (period === "month") {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    return {
      start: new Date(year, month, 1).toISOString().slice(0, 10),
      end: new Date(year, month + 1, 0).toISOString().slice(0, 10)
    };
  }

  return null;
}

function isDateInsideRange(value, range) {
  const dateString = normalizeDateString(value);
  return Boolean(dateString && (!range || (dateString >= range.start && dateString <= range.end)));
}

function normalizePointValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
}

function cloneDefaultLevelGoalRequirements() {
  return DEFAULT_LEVEL_GOAL_REQUIREMENTS.map((requirement) => ({
    level: requirement.level,
    categories: cloneGoalCategoryMatrix(requirement.categories)
  }));
}

function normalizeDifficulty(value, fallbackPoints = 0) {
  const normalized = String(value || "").trim().toLowerCase();
  if (GOAL_DIFFICULTIES[normalized]) {
    return normalized;
  }

  const points = normalizePointValue(fallbackPoints);
  if (points >= 90) {
    return "hard";
  }
  if (points >= 50) {
    return "medium";
  }
  return "easy";
}

function getDifficultyLabel(value) {
  return GOAL_DIFFICULTIES[normalizeDifficulty(value)].label;
}

function normalizeGoalCategory(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/\s+/g, "_");
  return GOAL_CATEGORIES[normalized] ? normalized : "spiritual";
}

function getGoalCategoryLabel(value) {
  return GOAL_CATEGORIES[normalizeGoalCategory(value)].label;
}

function getLevelName(level) {
  return LEVEL_NAMES[Number(level)] || `Level ${level}`;
}

function getLevelLabel(level) {
  const normalizedLevel = Number(level);
  const levelName = getLevelName(normalizedLevel);
  return `Level ${normalizedLevel}: ${levelName}`;
}

function buildCategoryOptions(selected = "spiritual") {
  const normalizedSelected = normalizeGoalCategory(selected);
  return CATEGORY_ORDER.map((category) =>
    `<option value="${category}"${category === normalizedSelected ? " selected" : ""}>${GOAL_CATEGORIES[category].label}</option>`
  ).join("");
}

function buildDifficultyOptions(selected = "medium") {
  const normalizedSelected = normalizeDifficulty(selected);
  return DIFFICULTY_ORDER.map((difficulty) =>
    `<option value="${difficulty}"${difficulty === normalizedSelected ? " selected" : ""}>${GOAL_DIFFICULTIES[difficulty].label}</option>`
  ).join("");
}

function cloneGoalCategoryMatrix(source = {}) {
  return CATEGORY_ORDER.reduce((matrix, category) => {
    const categorySource = source[category] || {};
    matrix[category] = DIFFICULTY_ORDER.reduce((counts, difficulty) => {
      counts[difficulty] = Math.max(0, Math.floor(Number(categorySource[difficulty] || 0)));
      return counts;
    }, {});
    return matrix;
  }, {});
}

function normalizeRequirementCounts(source = {}, fallback = {}) {
  return DIFFICULTY_ORDER.reduce((counts, difficulty) => {
    counts[difficulty] = Math.max(0, Math.floor(Number(source[difficulty] ?? fallback[difficulty] ?? 0) || 0));
    return counts;
  }, {});
}

function normalizeRequirementCategories(source = {}, fallback = {}) {
  return CATEGORY_ORDER.reduce((categories, category) => {
    categories[category] = normalizeRequirementCounts(source[category] || {}, fallback[category] || {});
    return categories;
  }, {});
}

function normalizeLevelGoalRequirements(requirements = []) {
  const byLevel = new Map();
  (requirements || []).forEach((requirement) => {
    const level = Number(requirement.level);
    if (!Number.isFinite(level)) {
      return;
    }
    const existing = byLevel.get(level) || { level, categories: {} };
    const sourceCategories = requirement.categories || CATEGORY_ORDER.reduce((categories, category) => {
      categories[category] = requirement[category] || {};
      return categories;
    }, {});
    if (!requirement.categories && DIFFICULTY_ORDER.some((difficulty) => requirement[difficulty] !== undefined)) {
      sourceCategories.spiritual = requirement;
    }
    existing.categories = {
      ...existing.categories,
      ...sourceCategories
    };
    byLevel.set(level, existing);
  });
  return cloneDefaultLevelGoalRequirements().map((defaultRequirement) => {
    const source = byLevel.get(defaultRequirement.level) || defaultRequirement;
    return {
      level: defaultRequirement.level,
      categories: normalizeRequirementCategories(source.categories || {}, defaultRequirement.categories)
    };
  });
}

function addDays(dateString, days) {
  const base = new Date(`${dateString}T00:00:00`);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function getDefaultGoalDeadline() {
  return addDays(getTodayDateString(), 30);
}

function normalizeGoalDeadline(goal) {
  return goal.deadline ? String(goal.deadline).slice(0, 10) : getDefaultGoalDeadline();
}

function formatDeadline(value) {
  return formatCompletedDate(value);
}

function isGoalOverdue(goal) {
  return Boolean(goal.deadline && getTodayDateString() > goal.deadline && !goal.leaderApproved);
}

function isGoalClosed(goal) {
  return isGoalOverdue(goal);
}

function normalizeCompletedUnits(subGoal) {
  const repeatCount = Math.max(1, Number(subGoal.repeatCount || 1));
  const existingUnits = Array.isArray(subGoal.completedUnits)
    ? subGoal.completedUnits.slice(0, repeatCount).map((value) => (value ? String(value).slice(0, 10) : null))
    : [];
  const fallbackCompletedCount = typeof subGoal.completedCount === "number"
    ? Math.max(0, Number(subGoal.completedCount))
    : (typeof subGoal.completed === "boolean"
      ? (subGoal.completed ? repeatCount : 0)
      : (Number(subGoal.progress || 0) >= 100 ? repeatCount : 0));
  const normalizedUnits = [...existingUnits];

  for (let index = 0; index < repeatCount; index += 1) {
    if (typeof normalizedUnits[index] === "undefined") {
      normalizedUnits[index] = index < fallbackCompletedCount ? getTodayDateString() : null;
    }
  }

  return normalizedUnits.slice(0, repeatCount);
}

function getCompletedCount(subGoal) {
  return (subGoal.completedUnits || []).filter(Boolean).length;
}

function getCompletedCountInRange(subGoal, periodRange = null) {
  return (subGoal.completedUnits || []).filter((value) => isDateInsideRange(value, periodRange)).length;
}

function getGoalTotalCheckCount(goal) {
  return (goal.subGoals || []).reduce((sum, subGoal) => sum + subGoal.repeatCount, 0);
}

function getGoalCompletedCheckCount(goal, period = "all") {
  const periodRange = getLeaderboardPeriodRange(period);
  return (goal.subGoals || []).reduce((sum, subGoal) => sum + getCompletedCountInRange(subGoal, periodRange), 0);
}

function getGoalCheckboxProgress(goal, period = "all") {
  const totalChecks = getGoalTotalCheckCount(goal);
  const completedChecks = getGoalCompletedCheckCount(goal, period);
  return totalChecks ? Math.round((completedChecks / totalChecks) * 100) : 0;
}

function normalizeGoalMatchText(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function getGoalMatchKey(goal) {
  return goal.sourceTemplateId
    ? `template:${goal.sourceTemplateId}`
    : `title:${normalizeGoalMatchText(goal.title)}`;
}

function getSameGoalRowsForGoal(goal, currentYouthId, period = "all") {
  const matchKey = getGoalMatchKey(goal);
  return state.goals
    .filter((candidate) => candidate.id !== goal.id && getGoalMatchKey(candidate) === matchKey)
    .map((candidate) => {
      const youth = state.users.find((user) => user.id === candidate.userId && user.role === "youth");
      return youth ? {
        youth,
        goal: candidate,
        completedChecks: getGoalCompletedCheckCount(candidate, period),
        totalChecks: getGoalTotalCheckCount(candidate),
        progressPercent: getGoalCheckboxProgress(candidate),
        weeklyChecks: getGoalCompletedCheckCount(candidate, "week")
      } : null;
    })
    .filter(Boolean)
    .sort((left, right) =>
      right.completedChecks - left.completedChecks ||
      right.weeklyChecks - left.weeklyChecks ||
      left.youth.name.localeCompare(right.youth.name)
    )
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      isCurrentYouth: row.youth.id === currentYouthId
    }));
}

function formatCompletedDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getMostRecentCompletedUnitIndex(subGoal) {
  const units = subGoal.completedUnits || [];
  let latestIndex = -1;
  let latestValue = "";

  units.forEach((value, index) => {
    if (value && value >= latestValue) {
      latestValue = value;
      latestIndex = index;
    }
  });

  return latestIndex;
}

function parseRepeatCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count < 1) {
    return 1;
  }

  return Math.max(1, Math.floor(count));
}

function parseChecklistLine(line) {
  const match = line.match(/^(.*?)(?:\s*\|\s*(\d+))?$/);
  const title = match ? match[1].trim() : line.trim();
  const repeatCount = match && match[2] ? parseRepeatCount(match[2]) : 1;

  return {
    title,
    repeatCount
  };
}

function readDraftChecklistItems(form) {
  try {
    return JSON.parse(form.elements.goalSubGoalsData.value || "[]");
  } catch (error) {
    return [];
  }
}

function writeDraftChecklistItems(form, items) {
  form.elements.goalSubGoalsData.value = JSON.stringify(items);
}

function syncGoalFormFromTemplate(form, templateId) {
  if (!form) {
    return;
  }

  if (!templateId) {
    form.elements.goalTitle.value = "";
    form.elements.goalSummary.value = "";
    if (form.elements.goalPoints) {
      form.elements.goalPoints.value = "0";
    }
    if (form.elements.goalDifficulty) {
      form.elements.goalDifficulty.value = "medium";
    }
    if (form.elements.goalCategory) {
      form.elements.goalCategory.value = "spiritual";
    }
    writeDraftChecklistItems(form, []);
    renderDraftChecklistItems(form);
    return;
  }

  const template = state.templates.find((item) => item.id === templateId);
  if (!template) {
    return;
  }

  form.elements.goalTitle.value = template.title;
  form.elements.goalSummary.value = template.summary;
  if (form.elements.goalPoints) {
    form.elements.goalPoints.value = String(normalizePointValue(template.points));
  }
  if (form.elements.goalDifficulty) {
    form.elements.goalDifficulty.value = normalizeDifficulty(template.difficulty, template.points);
  }
  if (form.elements.goalCategory) {
    form.elements.goalCategory.value = normalizeGoalCategory(template.category);
  }
  writeDraftChecklistItems(form, template.subGoals.map((subGoal) => ({
    title: subGoal.title,
    repeatCount: subGoal.repeatCount
  })));
  renderDraftChecklistItems(form);
}

function renderDraftChecklistItems(form) {
  const items = readDraftChecklistItems(form);
  const list = form.querySelector(".draft-checklist-list");
  list.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "subgoal-meta";
    empty.textContent = "No checklist items added yet.";
    list.appendChild(empty);
    return;
  }

  items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "draft-item-row";

    const text = document.createElement("div");
    text.innerHTML = `<strong>${item.title}</strong><br><span class="subgoal-meta">${item.repeatCount} checkbox${item.repeatCount === 1 ? "" : "es"}</span>`;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "ghost-button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      const nextItems = readDraftChecklistItems(form).filter((_, itemIndex) => itemIndex !== index);
      writeDraftChecklistItems(form, nextItems);
      renderDraftChecklistItems(form);
    });

    row.append(text, removeButton);
    list.appendChild(row);
  });
}

function addDraftChecklistItem(form) {
  const title = form.elements.newSubGoalTitle.value.trim();
  const repeatCount = parseRepeatCount(form.elements.newSubGoalRepeatCount.value);

  if (!title) {
    window.alert("Please enter a checklist item description before adding it.");
    return;
  }

  const items = readDraftChecklistItems(form);
  items.push({ title, repeatCount });
  writeDraftChecklistItems(form, items);
  form.elements.newSubGoalTitle.value = "";
  form.elements.newSubGoalRepeatCount.value = "1";
  renderDraftChecklistItems(form);
}

function buildGoalFromTemplate(template, userId, deadline = getDefaultGoalDeadline()) {
  const sessionUser = getSessionUser();
  return {
    id: createId("goal"),
    userId,
    title: template.title,
    summary: template.summary,
    points: normalizePointValue(template.points),
    difficulty: normalizeDifficulty(template.difficulty, template.points),
    category: normalizeGoalCategory(template.category),
    priorityOrder: getNextGoalPriority(userId),
    sourceTemplateId: template.id,
    sourceGoalId: null,
    goalApproved: Boolean(sessionUser && isWardAdmin(sessionUser)),
    goalApprovedBy: sessionUser && isWardAdmin(sessionUser) ? sessionUser.name : null,
    goalApprovedAt: sessionUser && isWardAdmin(sessionUser) ? getTodayDateString() : null,
    deadline,
    leaderApproved: false,
    leaderApprovedBy: null,
    completedAt: null,
    subGoals: template.subGoals.map((subGoal) => ({
      id: createId("subgoal"),
      title: subGoal.title,
      repeatCount: subGoal.repeatCount,
      completedUnits: Array.from({ length: subGoal.repeatCount }, () => null)
    }))
  };
}

function getRequiredGoalsForWardLevel(ward, level) {
  return (state.requiredLevelGoals || [])
    .filter((goal) => isSameWard(goal.ward, ward) && Number(goal.level) === Number(level))
    .sort((left, right) => left.title.localeCompare(right.title));
}

function buildGoalFromRequiredLevelGoal(requiredGoal, youth) {
  const deadline = addDays(getTodayDateString(), Math.max(1, Number(requiredGoal.deadlineDays || 30)));
  return {
    id: createId("goal"),
    userId: youth.id,
    title: requiredGoal.title,
    summary: requiredGoal.summary,
    points: normalizePointValue(requiredGoal.points),
    difficulty: normalizeDifficulty(requiredGoal.difficulty, requiredGoal.points),
    category: normalizeGoalCategory(requiredGoal.category),
    priorityOrder: getNextGoalPriority(youth.id),
    sourceTemplateId: null,
    sourceGoalId: null,
    requiredGoalDefinitionId: requiredGoal.id,
    requiredGoalLevel: Number(requiredGoal.level),
    goalApproved: true,
    goalApprovedBy: "Bishop Required Goal",
    goalApprovedAt: getTodayDateString(),
    deadline,
    leaderApproved: false,
    leaderApprovedBy: null,
    completedAt: null,
    subGoals: requiredGoal.subGoals.map((subGoal) => ({
      id: createId("subgoal"),
      title: subGoal.title,
      repeatCount: subGoal.repeatCount,
      completedUnits: Array.from({ length: subGoal.repeatCount }, () => null)
    }))
  };
}

function getMissingRequiredGoalsForYouthLevel(youth, level) {
  const assignedDefinitionIds = new Set(state.goals
    .filter((goal) => goal.userId === youth.id && Number(goal.requiredGoalLevel) === Number(level))
    .map((goal) => goal.requiredGoalDefinitionId)
    .filter(Boolean));
  return getRequiredGoalsForWardLevel(youth.ward, level)
    .filter((requiredGoal) => !assignedDefinitionIds.has(requiredGoal.id));
}

function getRequiredGoalCompletionForYouthLevel(youth, level) {
  const requiredGoals = getRequiredGoalsForWardLevel(youth.ward, level);
  if (!requiredGoals.length) {
    return { requiredCount: 0, completedCount: 0, complete: true };
  }

  const completedCount = requiredGoals.filter((requiredGoal) =>
    state.goals.some((goal) =>
      goal.userId === youth.id &&
      goal.requiredGoalDefinitionId === requiredGoal.id &&
      goal.leaderApproved
    )
  ).length;

  return {
    requiredCount: requiredGoals.length,
    completedCount,
    complete: completedCount >= requiredGoals.length
  };
}

function getYouthCompletedAttainmentLevels(youth) {
  const difficultyCounts = getYouthDifficultyCounts(youth.id);
  const milestones = getLevelGoalMilestones();
  return milestones.filter((level) =>
    isDifficultyRequirementMet(difficultyCounts, level.requirements) &&
    getRequiredGoalCompletionForYouthLevel(youth, level.index).complete
  ).length;
}

async function assignMissingRequiredGoalsForYouth(youth, level, createdBy = null) {
  const missingRequiredGoals = getMissingRequiredGoalsForYouthLevel(youth, level);
  if (!missingRequiredGoals.length) {
    return 0;
  }

  let assignedCount = 0;
  for (const requiredGoal of missingRequiredGoals) {
    const goal = buildGoalFromRequiredLevelGoal(requiredGoal, youth);
    const nextState = await backendClient.createGoal(STORAGE_KEY, state, {
      goal,
      createdBy: createdBy || state.session?.userId || youth.id,
      fallbackState: getFallbackState()
    });
    applyBackendState(nextState);
    assignedCount += 1;
  }
  saveState();
  return assignedCount;
}

async function assignRequiredGoalsForCurrentAttainment(youth, createdBy = null) {
  const completedLevels = getYouthCompletedAttainmentLevels(youth);
  const nextLevel = Math.min(completedLevels + 1, LEVEL_POINT_REQUIREMENTS.length);
  return assignMissingRequiredGoalsForYouth(youth, nextLevel, createdBy);
}

function cloneGoalForUser(sourceGoal, userId, deadline = (sourceGoal.deadline && sourceGoal.deadline > getTodayDateString()) ? sourceGoal.deadline : getDefaultGoalDeadline()) {
  const sessionUser = getSessionUser();
  return {
    id: createId("goal"),
    userId,
    title: sourceGoal.title,
    summary: sourceGoal.summary,
    points: normalizePointValue(sourceGoal.points),
    difficulty: normalizeDifficulty(sourceGoal.difficulty, sourceGoal.points),
    category: normalizeGoalCategory(sourceGoal.category),
    priorityOrder: getNextGoalPriority(userId),
    sourceTemplateId: sourceGoal.sourceTemplateId || null,
    sourceGoalId: sourceGoal.id,
    goalApproved: Boolean(sessionUser && isWardAdmin(sessionUser)),
    goalApprovedBy: sessionUser && isWardAdmin(sessionUser) ? sessionUser.name : null,
    goalApprovedAt: sessionUser && isWardAdmin(sessionUser) ? getTodayDateString() : null,
    deadline,
    leaderApproved: false,
    leaderApprovedBy: null,
    completedAt: null,
    subGoals: sourceGoal.subGoals.map((subGoal) => ({
      id: createId("subgoal"),
      title: subGoal.title,
      repeatCount: subGoal.repeatCount,
      completedUnits: Array.from({ length: subGoal.repeatCount }, () => null)
    }))
  };
}

async function saveGoalAsTemplate(goalId) {
  const goal = state.goals.find((item) => item.id === goalId);
  const sessionUser = getSessionUser();
  if (!goal) {
    return;
  }

  const template = {
    id: createId("template"),
    title: goal.title,
    summary: goal.summary,
    points: normalizePointValue(goal.points),
    difficulty: normalizeDifficulty(goal.difficulty, goal.points),
    category: normalizeGoalCategory(goal.category),
    templateApproved: true,
    templateApprovedBy: sessionUser.name,
    templateApprovedById: sessionUser.id,
    templateApprovedAt: getTodayDateString(),
    subGoals: goal.subGoals.map((subGoal) => ({
      id: createId("template-subgoal"),
      title: subGoal.title,
      repeatCount: subGoal.repeatCount
    }))
  };

  activeAdminDashboardView = "templates";
  activeGoalEditorId = null;
  await persistTemplate(template, { isCreate: true });
  activeTemplateId = template.id;
  render();
}

async function approveGoalExtension(goalId, newDeadline) {
  const goal = state.goals.find((item) => item.id === goalId);
  const sessionUser = getSessionUser();
  if (!goal || !sessionUser || !isWardAdmin(sessionUser)) {
    return;
  }

  if (!newDeadline) {
    window.alert("Please choose a new deadline before approving the extension.");
    return;
  }

  if (newDeadline <= getTodayDateString()) {
    window.alert("Please choose an extension date after today.");
    return;
  }

  goal.deadline = newDeadline;
  resetCompletionApproval(goal);
  await persistGoal(goal);
}

async function updateGoalDetails(goalId, form) {
  const goal = state.goals.find((item) => item.id === goalId);
  if (!goal) {
    return;
  }

  const title = form.elements.editGoalTitle.value.trim();
  const summary = form.elements.editGoalSummary.value.trim();
  const difficulty = normalizeDifficulty(form.elements.editGoalDifficulty?.value || goal.difficulty, goal.points);
  const category = normalizeGoalCategory(form.elements.editGoalCategory?.value || goal.category);
  const deadline = form.elements.editGoalDeadline.value;
  if (!title || !summary || !deadline) {
    window.alert("Please provide a goal title, summary, and deadline.");
    return;
  }

  const subGoals = Array.from(form.querySelectorAll(".editable-subgoal-row")).map((row, index) => ({
    id: goal.subGoals[index]?.id || createId("subgoal"),
    title: row.querySelector("[name='editableSubGoalTitle']").value.trim(),
    repeatCount: parseRepeatCount(row.querySelector("[name='editableSubGoalRepeatCount']").value),
    completedUnits: (goal.subGoals[index]?.completedUnits || [])
      .slice(0, parseRepeatCount(row.querySelector("[name='editableSubGoalRepeatCount']").value))
  })).filter((item) => item.title);

  if (!subGoals.length) {
    window.alert("Please keep at least one checklist item on the goal.");
    return;
  }

  goal.title = title;
  goal.summary = summary;
  goal.difficulty = difficulty;
  goal.category = category;
  goal.deadline = deadline;
  goal.subGoals = subGoals;
  approveGoalPlanFields(goal, getSessionUser(), difficulty, category);
  if (getGoalProgress(goal) < 100) {
    resetCompletionApproval(goal);
  }
  await persistGoal(goal);
}

async function updateTemplateDetails(templateId, form) {
  const template = state.templates.find((item) => item.id === templateId);
  if (!template) {
    return;
  }

  const title = form.elements.editTemplateTitle.value.trim();
  const summary = form.elements.editTemplateSummary.value.trim();
  const difficulty = normalizeDifficulty(form.elements.editTemplateDifficulty?.value || template.difficulty, template.points);
  const category = normalizeGoalCategory(form.elements.editTemplateCategory?.value || template.category);
  const subGoals = Array.from(form.querySelectorAll(".editable-subgoal-row")).map((row, index) => ({
    id: template.subGoals[index]?.id || createId("template-subgoal"),
    title: row.querySelector("[name='editableSubGoalTitle']").value.trim(),
    repeatCount: parseRepeatCount(row.querySelector("[name='editableSubGoalRepeatCount']").value)
  })).filter((item) => item.title);

  if (!title || !summary || !subGoals.length) {
    window.alert("Templates need a title, summary, and at least one checklist item.");
    return;
  }

  template.title = title;
  template.summary = summary;
  template.difficulty = difficulty;
  template.category = category;
  template.subGoals = subGoals;
  activeTemplateId = null;
  await persistTemplate(template);
}

async function approveTemplateForUse(templateId) {
  const sessionUser = getSessionUser();
  const template = state.templates.find((item) => item.id === templateId);
  if (!sessionUser || !isWardAdmin(sessionUser) || !template) {
    return;
  }

  template.templateApproved = true;
  template.templateApprovedBy = sessionUser.name;
  template.templateApprovedById = sessionUser.id;
  template.templateApprovedAt = getTodayDateString();
  template.templateApprovalUpdated = true;
  await persistTemplate(template);
}

async function copyGoalToYouth(goalId, userId) {
  const sessionUser = getSessionUser();
  const goal = state.goals.find((item) => item.id === goalId);
  const youth = state.users.find((item) => item.id === userId);
  if (!sessionUser || !goal || !youth || !canManageYouth(sessionUser, youth)) {
    window.alert("Please choose a youth you can manage before copying the goal.");
    return;
  }

  await persistGoal(cloneGoalForUser(goal, youth.id), {
    isCreate: true,
    createdBy: sessionUser.id,
    sourceGoalId: goal.id
  });
}

function buildEditableSubgoalRows(items) {
  return items.map((item) => `
    <div class="editable-subgoal-row">
      <label>
        <span>Checklist item</span>
        <input name="editableSubGoalTitle" type="text" value="${item.title.replace(/"/g, "&quot;")}">
      </label>
      <label>
        <span>Quantity</span>
        <input name="editableSubGoalRepeatCount" type="number" min="1" step="1" value="${item.repeatCount}">
      </label>
    </div>
  `).join("");
}

function getGoalProgress(goal) {
  if (!goal.subGoals.length) {
    return 0;
  }

  const totalChecks = goal.subGoals.reduce((sum, subGoal) => sum + subGoal.repeatCount, 0);
  const completedChecks = goal.subGoals.reduce((sum, subGoal) => sum + getCompletedCount(subGoal), 0);
  return totalChecks ? Math.round((completedChecks / totalChecks) * 100) : 0;
}

function isGoalEarnedInRange(goal, periodRange = null) {
  return Boolean(
    goal.goalApproved &&
    goal.leaderApproved &&
    (!periodRange || isDateInsideRange(goal.completedAt, periodRange))
  );
}

function getYouthDifficultyCounts(userId, period = "all") {
  const periodRange = getLeaderboardPeriodRange(period);
  return state.goals
    .filter((goal) => goal.userId === userId && isGoalEarnedInRange(goal, periodRange))
    .reduce((counts, goal) => {
      const category = normalizeGoalCategory(goal.category);
      const difficulty = normalizeDifficulty(goal.difficulty, goal.points);
      counts.categories[category][difficulty] = (counts.categories[category][difficulty] || 0) + 1;
      counts.categories[category].total += 1;
      counts[difficulty] = (counts[difficulty] || 0) + 1;
      counts.total += 1;
      return counts;
    }, {
      easy: 0,
      medium: 0,
      hard: 0,
      total: 0,
      categories: CATEGORY_ORDER.reduce((categories, category) => {
        categories[category] = { easy: 0, medium: 0, hard: 0, total: 0 };
        return categories;
      }, {})
    });
}

function getLevelGoalRequirements() {
  return normalizeLevelGoalRequirements(state.levelGoalRequirements);
}

function getRequirementTotal(requirement) {
  return CATEGORY_ORDER.reduce((categorySum, category) =>
    categorySum + DIFFICULTY_ORDER.reduce((difficultySum, difficulty) =>
      difficultySum + Number(requirement.categories?.[category]?.[difficulty] || 0),
    0),
  0);
}

function isDifficultyRequirementMet(counts, requirement) {
  return CATEGORY_ORDER.every((category) =>
    DIFFICULTY_ORDER.every((difficulty) =>
      Number(counts.categories?.[category]?.[difficulty] || 0) >= Number(requirement.categories?.[category]?.[difficulty] || 0)
    )
  );
}

function getCompletedDifficultyRequirementCount(counts, requirement) {
  return CATEGORY_ORDER.reduce((categorySum, category) =>
    categorySum + DIFFICULTY_ORDER.reduce((difficultySum, difficulty) =>
      difficultySum + Math.min(
        Number(counts.categories?.[category]?.[difficulty] || 0),
        Number(requirement.categories?.[category]?.[difficulty] || 0)
      ),
    0),
  0);
}

function formatDifficultyRequirementProgress(counts, requirement) {
  const requiredParts = CATEGORY_ORDER.map((category) => {
    const parts = DIFFICULTY_ORDER
      .filter((difficulty) => Number(requirement.categories?.[category]?.[difficulty] || 0) > 0)
      .map((difficulty) =>
        `${getDifficultyLabel(difficulty)} ${Math.min(Number(counts.categories?.[category]?.[difficulty] || 0), Number(requirement.categories?.[category]?.[difficulty] || 0))}/${Number(requirement.categories?.[category]?.[difficulty] || 0)}`
      );
    return parts.length ? `${GOAL_CATEGORIES[category].label}: ${parts.join(", ")}` : "";
  }).filter(Boolean);
  return requiredParts.join(" | ") || "No category requirements";
}

function formatDifficultyCounts(counts) {
  return CATEGORY_ORDER.map((category) => {
    const categoryCounts = counts.categories?.[category] || {};
    return `${GOAL_CATEGORIES[category].label} E${categoryCounts.easy || 0}/M${categoryCounts.medium || 0}/H${categoryCounts.hard || 0}`;
  }).join(" | ");
}

function getLevelGoalMilestones() {
  return getLevelGoalRequirements().map((requirement) => {
    return {
      index: requirement.level,
      requirements: requirement
    };
  });
}

function getYouthLevelProgress(youth, period = "all") {
  const difficultyCounts = getYouthDifficultyCounts(youth.id, period);
  const milestones = getLevelGoalMilestones();
  const completedLevels = period === "all"
    ? getYouthCompletedAttainmentLevels(youth)
    : milestones.filter((level) => isDifficultyRequirementMet(difficultyCounts, level.requirements)).length;
  const nextLevel = milestones[completedLevels] || null;
  const completedRequirementsForNextLevel = nextLevel ? getCompletedDifficultyRequirementCount(difficultyCounts, nextLevel.requirements) : difficultyCounts.total;
  const requiredGoalsForNextLevel = nextLevel ? getRequirementTotal(nextLevel.requirements) : difficultyCounts.total;
  const requiredGoalProgress = nextLevel ? getRequiredGoalCompletionForYouthLevel(youth, nextLevel.index) : { requiredCount: 0, completedCount: 0, complete: true };
  const nextPercent = nextLevel
    ? Math.max(0, Math.min(100, Math.round((completedRequirementsForNextLevel / requiredGoalsForNextLevel) * 100)))
    : 100;

  return {
    difficultyCounts,
    completedLevels,
    currentLevelLabel: completedLevels > 0 ? getLevelLabel(completedLevels) : "Getting started",
    nextLevelLabel: nextLevel ? getLevelLabel(nextLevel.index) : "All levels complete",
    completedRequirementsForNextLevel,
    requiredGoalsForNextLevel,
    nextProgressLabel: nextLevel ? formatDifficultyRequirementProgress(difficultyCounts, nextLevel.requirements) : `${difficultyCounts.total} goals completed`,
    requiredGoalProgress,
    nextPercent
  };
}

function buildYouthCompetitionRows(scopeYouth, currentYouthId, period = activeLeaderboardPeriod) {
  const rows = scopeYouth
    .filter((youth) => youth.competitionOptIn !== false)
    .map((youth) => ({
      youth,
      progress: getYouthLevelProgress(youth, period)
    }))
    .sort((left, right) =>
      right.progress.difficultyCounts.hard - left.progress.difficultyCounts.hard ||
      right.progress.difficultyCounts.medium - left.progress.difficultyCounts.medium ||
      right.progress.difficultyCounts.easy - left.progress.difficultyCounts.easy ||
      left.youth.name.localeCompare(right.youth.name)
    );

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
    isCurrentYouth: row.youth.id === currentYouthId
  }));
}

function getYouthCompetitionData(sessionUser, period = activeLeaderboardPeriod) {
  const wardYouth = state.users.filter((user) =>
    user.role === "youth" && isSameWard(user.ward, sessionUser.ward)
  );
  const stakeYouth = state.users.filter((user) =>
    user.role === "youth" && isSameStake(user.ward, sessionUser.ward)
  );
  const currentGoalTitles = new Set(getOrderedYouthGoals(sessionUser.id)
    .map((goal) => goal.title.trim().toLowerCase())
    .filter(Boolean));
  const sharedGoalRows = state.users
    .filter((user) => user.role === "youth" && user.id !== sessionUser.id)
    .map((youth) => {
      const matchingGoals = getOrderedYouthGoals(youth.id).filter((goal) =>
        currentGoalTitles.has(goal.title.trim().toLowerCase())
      );
      const bestGoalProgress = matchingGoals.reduce((best, goal) => {
        const completedChecks = getGoalCompletedCheckCount(goal, period);
        const weeklyChecks = getGoalCompletedCheckCount(goal, "week");
        return completedChecks > best.completedChecks
          ? {
            completedChecks,
            weeklyChecks,
            totalChecks: getGoalTotalCheckCount(goal),
            progressPercent: getGoalCheckboxProgress(goal),
            goalTitle: goal.title
          }
          : best;
      }, { completedChecks: 0, weeklyChecks: 0, totalChecks: 0, progressPercent: 0, goalTitle: "" });
      return { youth, matchingGoals, progress: getYouthLevelProgress(youth), bestGoalProgress };
    })
    .filter((row) => row.matchingGoals.length)
    .sort((left, right) =>
      right.bestGoalProgress.completedChecks - left.bestGoalProgress.completedChecks ||
      right.matchingGoals.length - left.matchingGoals.length ||
      right.progress.difficultyCounts.hard - left.progress.difficultyCounts.hard ||
      right.progress.difficultyCounts.medium - left.progress.difficultyCounts.medium ||
      right.progress.difficultyCounts.easy - left.progress.difficultyCounts.easy ||
      left.youth.name.localeCompare(right.youth.name)
    );

  return {
    wardRows: buildYouthCompetitionRows(wardYouth, sessionUser.id, period),
    stakeRows: buildYouthCompetitionRows(stakeYouth, sessionUser.id, period),
    sharedGoalRows
  };
}

function buildLeaderboardCard(title, subtitle, rows, sessionUser, period = activeLeaderboardPeriod) {
  const currentRow = rows.find((row) => row.isCurrentYouth);
  const visibleRows = rows.slice(0, 10);
  const periodConfig = LEADERBOARD_PERIODS[period] || LEADERBOARD_PERIODS.all;
  const card = document.createElement("section");
  card.className = "form-card leaderboard-card";
  const currentSummary = sessionUser.competitionOptIn === false
    ? "You are non-competitive, so you are not ranked on this leaderboard."
    : currentRow
      ? `You are rank ${currentRow.rank} of ${rows.length}. ${currentRow.rank > 10 ? "Your score is outside the top 10 right now." : "Goal difficulty counts determine the ranking."}`
      : "No ranking available yet.";
  card.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="eyebrow">${escapeHtml(subtitle)}</p>
        <h3>${escapeHtml(title)}</h3>
        <p class="subgoal-meta">Top 10 competitive youth. ${escapeHtml(periodConfig.summary)}. ${escapeHtml(currentSummary)}</p>
      </div>
      <div class="session-badge">${escapeHtml(periodConfig.label)}</div>
    </div>
    <div class="leaderboard-list">
      ${visibleRows.map((row) => {
        return `
          <div class="leaderboard-row${row.isCurrentYouth ? " is-current" : ""}">
            <span class="leaderboard-rank">#${row.rank}</span>
            <div>
              <strong>${escapeHtml(row.youth.name)}${row.isCurrentYouth ? " (You)" : ""}</strong>
              <span>${escapeHtml(row.youth.ward)} · ${escapeHtml(row.progress.currentLevelLabel)}</span>
            </div>
            <div class="leaderboard-points">
              <strong>${row.progress.difficultyCounts.total}</strong>
              <span>${formatDifficultyCounts(row.progress.difficultyCounts)}</span>
            </div>
          </div>
        `;
      }).join("") || `<p class="subgoal-meta">No youth have joined this leaderboard yet.</p>`}
    </div>
  `;
  return card;
}

function buildSharedGoalsCard(sessionUser, sharedGoalRows) {
  const card = document.createElement("section");
  card.className = "form-card shared-goals-card";
  card.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="eyebrow">Shared Goals</p>
        <h3>Others Working On The Same Goals</h3>
      </div>
      <div class="session-badge">${sharedGoalRows.length} matches</div>
    </div>
    ${sharedGoalRows.length ? `
      <div class="shared-goal-list">
        ${sharedGoalRows.map((row) => `
          <div class="shared-goal-row">
            <div>
              <strong>${escapeHtml(row.youth.name)}</strong>
              <span>${escapeHtml(row.youth.ward)} · ${escapeHtml(row.progress.currentLevelLabel)} · ${formatDifficultyCounts(row.progress.difficultyCounts)}</span>
              <span>${row.bestGoalProgress.completedChecks}/${row.bestGoalProgress.totalChecks} same-goal checks · ${row.bestGoalProgress.progressPercent}% complete · ${row.bestGoalProgress.weeklyChecks} this week</span>
            </div>
            <div class="shared-goal-tags">
              ${row.matchingGoals.slice(0, 3).map((goal) => `<span>${escapeHtml(goal.title)}</span>`).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    ` : `<p class="subgoal-meta">No one else currently has a goal with the same title. Shared goals will appear here as youth choose similar goals.</p>`}
  `;
  return card;
}

async function updateCompetitionPreference(competitionOptIn) {
  const sessionUser = getSessionUser();
  if (!sessionUser || sessionUser.role !== "youth") {
    return;
  }

  const updatedUser = {
    ...sessionUser,
    competitionOptIn
  };

  try {
    const nextState = backendClient.updateCompetitionPreference
      ? await backendClient.updateCompetitionPreference(STORAGE_KEY, state, {
        user: updatedUser,
        fallbackState: getFallbackState()
      })
      : {
        ...state,
        users: state.users.map((user) => user.id === updatedUser.id ? updatedUser : user)
      };
    applyBackendState(nextState);
    state.session = { ...state.session, userId: updatedUser.id };
    saveState();
    render();
  } catch (error) {
    console.warn("Competition preference update failed.", error);
    window.alert(error?.message || "Your competition preference could not be saved right now.");
  }
}

function getNotificationChannels(user) {
  return {
    inApp: user.notificationChannels?.inApp !== false,
    email: Boolean(user.notificationChannels?.email),
    push: Boolean(user.notificationChannels?.push)
  };
}

function getInactivityNotificationChannels(user) {
  return {
    inApp: user.inactivityNotificationChannels?.inApp !== false,
    email: Boolean(user.inactivityNotificationChannels?.email),
    push: Boolean(user.inactivityNotificationChannels?.push)
  };
}

function getYouthNotifications(userId) {
  return (state.notifications || [])
    .filter((notification) => notification.userId === userId)
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
}

function markYouthNotificationsRead(userId) {
  state.notifications = (state.notifications || []).map((notification) =>
    notification.userId === userId && !notification.readAt
      ? { ...notification, readAt: getTodayDateString() }
      : notification
  );
  saveState();
  render();
}

async function updateSameGoalNotificationPreference(form) {
  const sessionUser = getSessionUser();
  if (!sessionUser || sessionUser.role !== "youth") {
    return;
  }

  const updatedUser = {
    ...sessionUser,
    sameGoalNotificationsOptIn: form.elements.sameGoalNotificationsOptIn.checked,
    notificationChannels: {
      inApp: true,
      email: form.elements.sameGoalEmail.checked,
      push: form.elements.sameGoalPush.checked
    },
    inactivityNotificationsOptIn: form.elements.inactivityNotificationsOptIn.checked,
    inactivityNotificationChannels: {
      inApp: true,
      email: form.elements.inactivityEmail.checked,
      push: form.elements.inactivityPush.checked
    },
    inactivityReminderMinHours: 24,
    inactivityReminderMaxHours: 96
  };

  try {
    const nextState = backendClient.updateNotificationPreferences
      ? await backendClient.updateNotificationPreferences(STORAGE_KEY, state, {
        user: updatedUser,
        fallbackState: getFallbackState()
      })
      : {
        ...state,
        users: state.users.map((user) => user.id === updatedUser.id ? updatedUser : user)
      };
    applyBackendState(nextState);
    state.session = { ...state.session, userId: updatedUser.id };
    saveState();
    render();
  } catch (error) {
    console.warn("Notification preference update failed.", error);
    window.alert(error?.message || "Your notification preferences could not be saved right now.");
  }
}

function buildSameGoalNotificationCard(sessionUser) {
  const card = document.createElement("section");
  card.className = "form-card notification-preference-card";
  const channels = getNotificationChannels(sessionUser);
  const inactivityChannels = getInactivityNotificationChannels(sessionUser);
  const pushReady = Boolean(sessionUser.pushToken);
  card.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="eyebrow">Notification Settings</p>
        <h3>${sessionUser.sameGoalNotificationsOptIn || sessionUser.inactivityNotificationsOptIn ? "Notifications On" : "Notifications Off"}</h3>
        <p class="subgoal-meta">Choose same-goal alerts and reminders for when you have not used the tracker in a while.</p>
      </div>
    </div>
    <form class="stack same-goal-notification-form">
      <div class="notification-preference-group">
        <h4>Same Goal Alerts</h4>
        <p class="subgoal-meta">Get notified when another youth with the same templated goal passes your checkbox progress or completes more same-goal checks this week.</p>
      </div>
      <label class="checkbox-label">
        <input name="sameGoalNotificationsOptIn" type="checkbox" ${sessionUser.sameGoalNotificationsOptIn ? "checked" : ""}>
        <span>Notify me when someone passes me on the same goal</span>
      </label>
      <label class="checkbox-label">
        <input name="sameGoalEmail" type="checkbox" ${channels.email ? "checked" : ""}>
        <span>Email me too</span>
      </label>
      <label class="checkbox-label">
        <input name="sameGoalPush" type="checkbox" ${channels.push ? "checked" : ""}>
        <span>Mobile push when available</span>
      </label>
      <div class="notification-preference-group">
        <h4>Inactivity Reminders</h4>
        <p class="subgoal-meta">When reminders are on, the server can contact you on a random schedule between 24 and 96 hours after your last activity.</p>
      </div>
      <label class="checkbox-label">
        <input name="inactivityNotificationsOptIn" type="checkbox" ${sessionUser.inactivityNotificationsOptIn ? "checked" : ""}>
        <span>Remind me if I have not used the goal tracker recently</span>
      </label>
      <label class="checkbox-label">
        <input name="inactivityEmail" type="checkbox" ${inactivityChannels.email ? "checked" : ""}>
        <span>Email inactivity reminders</span>
      </label>
      <label class="checkbox-label">
        <input name="inactivityPush" type="checkbox" ${inactivityChannels.push ? "checked" : ""}>
        <span>Mobile push inactivity reminders</span>
      </label>
      <p class="subgoal-meta">In-app alerts are active now. Email delivery uses the backend service. ${pushReady ? "Push is linked to this account." : "Push delivery starts after the mobile app registers this device."}</p>
      <button type="submit">Save Notification Settings</button>
    </form>
  `;
  card.querySelector(".same-goal-notification-form").addEventListener("submit", (event) => {
    event.preventDefault();
    updateSameGoalNotificationPreference(event.currentTarget);
  });
  return card;
}

function buildNotificationInboxCard(sessionUser) {
  const notifications = getYouthNotifications(sessionUser.id);
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;
  const card = document.createElement("section");
  card.className = "form-card notification-inbox-card";
  card.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="eyebrow">Notifications</p>
        <h3>${unreadCount ? `${unreadCount} New Alert${unreadCount === 1 ? "" : "s"}` : "No New Alerts"}</h3>
      </div>
      ${unreadCount ? `<button class="ghost-button" type="button" data-action="mark-notifications-read">Mark Read</button>` : ""}
    </div>
    <div class="notification-list">
      ${notifications.slice(0, 6).map((notification) => `
        <div class="notification-row${notification.readAt ? "" : " is-unread"}">
          <strong>${escapeHtml(notification.goalTitle)}</strong>
          <span>${escapeHtml(notification.message)}</span>
          <span class="subgoal-meta">${formatCompletedDate(notification.createdAt)} · ${notification.channels.email ? "email queued" : "in-app"}${notification.channels.push ? " · push queued" : ""}</span>
        </div>
      `).join("") || `<p class="subgoal-meta">Same-goal alerts will appear here after you opt in.</p>`}
    </div>
  `;
  card.querySelector("[data-action='mark-notifications-read']")?.addEventListener("click", () => markYouthNotificationsRead(sessionUser.id));
  return card;
}

function buildCompetitionPreferenceCard(sessionUser) {
  const card = document.createElement("section");
  card.className = "form-card competition-preference-card";
  const isCompetitive = sessionUser.competitionOptIn !== false;
  card.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="eyebrow">Competition Preference</p>
        <h3>${isCompetitive ? "Competitive" : "Non-Competitive"}</h3>
        <p class="subgoal-meta">${isCompetitive ? "Your completed goal counts can appear on ward and stake leaderboards." : "Your completed goal counts are private from leaderboard ranking. Your goals still track normally."}</p>
      </div>
      <button class="${isCompetitive ? "ghost-button" : "secondary-button"}" type="button" data-action="toggle-competition">
        ${isCompetitive ? "Go Non-Competitive" : "Join Leaderboards"}
      </button>
    </div>
  `;
  card.querySelector("[data-action='toggle-competition']").addEventListener("click", () => updateCompetitionPreference(!isCompetitive));
  return card;
}

function setActiveLeaderboardPeriod(period) {
  activeLeaderboardPeriod = LEADERBOARD_PERIODS[period] ? period : "all";
  render();
}

function buildLeaderboardPeriodCard() {
  const card = document.createElement("section");
  card.className = "form-card leaderboard-period-card";
  card.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="eyebrow">Leaderboard Range</p>
        <h3>${escapeHtml(LEADERBOARD_PERIODS[activeLeaderboardPeriod].label)}</h3>
      </div>
      <div class="leaderboard-period-toggle" role="group" aria-label="Leaderboard range">
        ${Object.entries(LEADERBOARD_PERIODS).map(([period, config]) => `
          <button class="tab-button${activeLeaderboardPeriod === period ? " active" : ""}" type="button" data-leaderboard-period="${period}">
            ${escapeHtml(config.label)}
          </button>
        `).join("")}
      </div>
    </div>
  `;
  card.querySelectorAll("[data-leaderboard-period]").forEach((button) => {
    button.addEventListener("click", () => setActiveLeaderboardPeriod(button.dataset.leaderboardPeriod));
  });
  return card;
}

function buildYouthCompetitionBoard(sessionUser) {
  const stake = getStakeForWardName(sessionUser.ward);
  const data = getYouthCompetitionData(sessionUser, activeLeaderboardPeriod);
  const board = document.createElement("div");
  board.className = "competition-board";
  board.appendChild(buildCompetitionPreferenceCard(sessionUser));
  board.appendChild(buildSameGoalNotificationCard(sessionUser));
  board.appendChild(buildNotificationInboxCard(sessionUser));
  board.appendChild(buildLeaderboardPeriodCard());
  board.appendChild(buildLeaderboardCard("Ward Leaderboard", "Ward Competition", data.wardRows, sessionUser, activeLeaderboardPeriod));
  board.appendChild(buildLeaderboardCard("Stake Leaderboard", stake?.name || "Stake Competition", data.stakeRows, sessionUser, activeLeaderboardPeriod));
  board.appendChild(buildSharedGoalsCard(sessionUser, data.sharedGoalRows));
  return board;
}

function getManagerProgressRows(manager, period) {
  return buildYouthCompetitionRows(getManagedYouth(manager), null, period);
}

function formatProgressRowsForEmail(rows) {
  if (!rows.length) {
    return "No youth are currently eligible for this leaderboard.";
  }

  return rows.slice(0, 10).map((row) =>
    `#${row.rank} ${row.youth.name}: ${formatDifficultyCounts(row.progress.difficultyCounts)}, ${row.progress.currentLevelLabel}`
  ).join("\n");
}

function buildWeeklyProgressEmailBody(manager) {
  const managedYouth = getManagedYouth(manager);
  const weeklyRows = getManagerProgressRows(manager, "week");
  const monthlyRows = getManagerProgressRows(manager, "month");
  const requiredGoalLines = managedYouth.map((youth) => {
    const progress = getYouthLevelProgress(youth);
    const required = progress.requiredGoalProgress;
    return `${youth.name}: ${required.requiredCount ? `${required.completedCount}/${required.requiredCount} required goals complete` : "no required goals due at current level"}`;
  });

  return [
    `Weekly youth progress summary for ${manager.ward}`,
    "",
    "This week's progress:",
    formatProgressRowsForEmail(weeklyRows),
    "",
    "This month's progress:",
    formatProgressRowsForEmail(monthlyRows),
    "",
    "Required goals:",
    requiredGoalLines.join("\n") || "No youth accounts are available yet."
  ].join("\n");
}

async function updateWeeklySummaryEmailPreference(enabled) {
  const sessionUser = getSessionUser();
  if (!sessionUser || !isWardAdmin(sessionUser)) {
    return;
  }

  state.users = state.users.map((user) =>
    user.id === sessionUser.id ? { ...user, weeklySummaryEmailOptIn: enabled } : user
  );
  saveState();
  render();
}

async function sendWeeklyProgressEmailPreview() {
  const sessionUser = getSessionUser();
  if (!sessionUser || !isWardAdmin(sessionUser) || !sessionUser.email) {
    window.alert("Add an email address before sending weekly progress summaries.");
    return;
  }

  const notification = {
    id: createId("notification"),
    userId: sessionUser.id,
    actorId: sessionUser.id,
    actorName: sessionUser.name,
    goalId: null,
    goalTitle: "Weekly Youth Progress Summary",
    type: "weekly_progress_summary",
    message: buildWeeklyProgressEmailBody(sessionUser),
    recipientEmail: sessionUser.email,
    pushToken: "",
    createdAt: getTodayDateString(),
    readAt: null,
    channels: { inApp: false, email: true, push: false },
    status: "queued"
  };

  state.notifications = [notification, ...(state.notifications || [])];
  saveState();

  try {
    if (backendClient.dispatchNotifications) {
      await backendClient.dispatchNotifications(STORAGE_KEY, state, { notifications: [notification] });
    }
    window.alert("Weekly progress email queued with this week's and this month's comparison.");
  } catch (error) {
    console.warn("Weekly progress email dispatch failed.", error);
    window.alert("Weekly progress email is saved in the queue, but delivery could not be dispatched right now.");
  }
  render();
}

function buildWeeklyProgressEmailCard(sessionUser) {
  const weeklyRows = getManagerProgressRows(sessionUser, "week");
  const monthlyRows = getManagerProgressRows(sessionUser, "month");
  const optedIn = sessionUser.weeklySummaryEmailOptIn !== false;
  const card = document.createElement("section");
  card.className = "form-card weekly-summary-email-card";
  card.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="eyebrow">Weekly Email</p>
        <h3>${optedIn ? "Weekly Progress Email On" : "Weekly Progress Email Off"}</h3>
        <p class="subgoal-meta">Sends ${escapeHtml(sessionUser.email || "this leader's email")} both this week's leaderboard and this month's leaderboard comparison.</p>
      </div>
      <button class="secondary-button" type="button" data-action="send-weekly-summary-preview">Send Test Summary</button>
    </div>
    <form class="stack weekly-summary-email-form">
      <label class="checkbox-label">
        <input name="weeklySummaryEmailOptIn" type="checkbox" ${optedIn ? "checked" : ""}>
        <span>Receive the weekly progress email</span>
      </label>
      <div class="summary-comparison-grid">
        <div>
          <strong>This week</strong>
          <p class="subgoal-meta">${weeklyRows.slice(0, 3).map((row) => `${row.rank}. ${escapeHtml(row.youth.name)} (${formatDifficultyCounts(row.progress.difficultyCounts)})`).join(" | ") || "No completed goals this week"}</p>
        </div>
        <div>
          <strong>This month</strong>
          <p class="subgoal-meta">${monthlyRows.slice(0, 3).map((row) => `${row.rank}. ${escapeHtml(row.youth.name)} (${formatDifficultyCounts(row.progress.difficultyCounts)})`).join(" | ") || "No completed goals this month"}</p>
        </div>
      </div>
    </form>
  `;
  card.querySelector(".weekly-summary-email-form").addEventListener("change", (event) => {
    updateWeeklySummaryEmailPreference(event.currentTarget.elements.weeklySummaryEmailOptIn.checked);
  });
  card.querySelector("[data-action='send-weekly-summary-preview']").addEventListener("click", sendWeeklyProgressEmailPreview);
  return card;
}

function renderSessionProgressTracker(sessionUser) {
  if (!elements.sessionProgressTracker) {
    return;
  }

  if (!sessionUser || sessionUser.role !== "youth") {
    elements.sessionProgressTracker.classList.add("hidden");
    elements.sessionProgressTracker.innerHTML = "";
    return;
  }

  const difficultyCounts = getYouthDifficultyCounts(sessionUser.id);
  const milestones = getLevelGoalMilestones();
  const currentLevel = milestones.find((level) => !isDifficultyRequirementMet(difficultyCounts, level.requirements)) || milestones[milestones.length - 1];

  elements.sessionProgressTracker.classList.remove("hidden");
  elements.sessionProgressTracker.innerHTML = `
    <section class="sidebar-progress-card">
      <div>
        <p class="eyebrow">Overall Progress</p>
        <div class="sidebar-progress-total">
          <strong>${difficultyCounts.total} goals</strong>
          <span class="subgoal-meta">Current target: ${getLevelLabel(currentLevel.index)}</span>
        </div>
      </div>
      <div class="sidebar-progress-levels">
        ${milestones.map((level) => {
          const completedCount = getCompletedDifficultyRequirementCount(difficultyCounts, level.requirements);
          const requiredCount = getRequirementTotal(level.requirements);
          const percent = requiredCount ? Math.max(0, Math.min(100, Math.round((completedCount / requiredCount) * 100))) : 100;
          const complete = isDifficultyRequirementMet(difficultyCounts, level.requirements);
          return `
            <div class="sidebar-progress-level${complete ? " is-complete" : ""}">
              <div class="sidebar-progress-level-head">
                <strong>${getLevelLabel(level.index)}</strong>
                <span class="subgoal-meta">${formatDifficultyRequirementProgress(difficultyCounts, level.requirements)}</span>
              </div>
              <div class="sidebar-progress-bar">
                <div class="sidebar-progress-fill" style="width:${percent}%"></div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
      <p class="subgoal-meta">Goals count toward levels after a Youth leader or bishop approves both the goal plan and the completed goal.</p>
    </section>
  `;
}

function approveGoalPlanFields(goal, sessionUser, difficulty = goal.difficulty, category = goal.category) {
  goal.difficulty = normalizeDifficulty(difficulty, goal.points);
  goal.category = normalizeGoalCategory(category);
  goal.goalApproved = true;
  goal.goalApprovedBy = sessionUser.name;
  goal.goalApprovedAt = getTodayDateString();
}

function resetGoalPlanApproval(goal) {
  goal.goalApproved = false;
  goal.goalApprovedBy = null;
  goal.goalApprovedAt = null;
}

function resetCompletionApproval(goal) {
  goal.leaderApproved = false;
  goal.leaderApprovedBy = null;
  goal.completedAt = null;
}

function openGoalEditor(goalId) {
  activeGoalEditorId = goalId;
  render();
}

function closeGoalEditor() {
  activeGoalEditorId = null;
  render();
}

function toggleAccountMenu() {
  if (!elements.accountMenuPanel || !elements.accountMenuButton) {
    return;
  }

  const willOpen = elements.accountMenuPanel.classList.contains("hidden");
  elements.accountMenuPanel.classList.toggle("hidden", !willOpen);
  elements.accountMenuButton.setAttribute("aria-expanded", String(willOpen));
}

function closeAccountMenu() {
  if (!elements.accountMenuPanel || !elements.accountMenuButton) {
    return;
  }

  elements.accountMenuPanel.classList.add("hidden");
  elements.accountMenuButton.setAttribute("aria-expanded", "false");
}

function getInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "AC";
}

function getGoalStatus(goal) {
  const progress = getGoalProgress(goal);

  if (!goal.goalApproved) {
    return { label: "Pending goal approval", className: "pending" };
  }

  if (goal.leaderApproved) {
    return { label: "Completed and approved", className: "approved" };
  }

  if (isGoalOverdue(goal)) {
    return { label: "Deadline passed", className: "overdue" };
  }

  if (progress === 100) {
    return { label: "Pending completion approval", className: "pending" };
  }

  return { label: "In progress", className: "in-progress" };
}

function getSessionUser() {
  if (!state.session) {
    return null;
  }

  return state.users.find((user) => user.id === state.session.userId) || null;
}

function getOrganizationLabel(value) {
  return value === "young_women" ? "Young Women" : value === "young_men" ? "Young Men" : "All Youth";
}

function normalizeWardKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\bward\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isSameWard(leftWard, rightWard) {
  const leftKey = normalizeWardKey(leftWard);
  const rightKey = normalizeWardKey(rightWard);
  return Boolean(leftKey && rightKey && leftKey === rightKey);
}

function findWardByName(wardName) {
  return state.wards.find((ward) => isSameWard(ward.name, wardName)) || null;
}

function getStakeForWardName(wardName) {
  const ward = findWardByName(wardName);
  if (!ward) {
    return null;
  }

  return state.stakes.find((stake) => stake.id === ward.stakeId) || { id: ward.stakeId, name: ward.stakeName || "Default Stake" };
}

function isSameStake(leftWardName, rightWardName) {
  const leftStake = getStakeForWardName(leftWardName);
  const rightStake = getStakeForWardName(rightWardName);
  return Boolean(leftStake?.id && rightStake?.id && leftStake.id === rightStake.id);
}

function canManageYouth(manager, youth) {
  if (!manager || !youth || youth.role !== "youth") {
    return false;
  }

  if (manager.role === "bishop") {
    return isSameWard(manager.ward, youth.ward);
  }

  if (manager.role === "youth_leader") {
    return isSameWard(manager.ward, youth.ward) && manager.organization === youth.organization;
  }

  return false;
}

function getManagedYouth(manager) {
  return state.users.filter((user) => canManageYouth(manager, user));
}

function getParentsForYouth(youthId) {
  return (state.parentYouthLinks || [])
    .filter((link) => link.youthId === youthId)
    .map((link) => ({
      link,
      parent: state.users.find((user) => user.id === link.parentId && user.role === "parent")
    }))
    .filter((item) => item.parent);
}

function getLinkedYouthForParent(parentId) {
  return (state.parentYouthLinks || [])
    .filter((link) => link.parentId === parentId)
    .map((link) => ({
      link,
      youth: state.users.find((user) => user.id === link.youthId && user.role === "youth")
    }))
    .filter((item) => item.youth);
}

function getParentLoginLabel(parent) {
  if (!parent.email) {
    return "Login not set up";
  }
  return parent.loginStatus === "verified" ? "Login ready" : "Email ready";
}

function isWardAdmin(user) {
  return Boolean(user && (user.role === "bishop" || user.role === "youth_leader"));
}

function isGlobalAdmin(user) {
  return Boolean(user && user.role === "administrator");
}

function getAllowedOrganizationsForManager(manager) {
  if (!manager) {
    return [];
  }

  if (manager.role === "bishop") {
    return ["young_men", "young_women"];
  }

  if (manager.role === "youth_leader") {
    return [manager.organization];
  }

  return [];
}

function getWardBishop(ward) {
  return state.users.find((user) => user.role === "bishop" && isSameWard(user.ward, ward)) || null;
}

function getPendingWardLeaders(ward) {
  return state.users.filter((user) => user.role === "youth_leader" && isSameWard(user.ward, ward) && user.approvalStatus !== "approved");
}

function getWardAccessUsers(ward) {
  return state.users
    .filter((user) => ["youth", "youth_leader", "parent"].includes(user.role) && isSameWard(user.ward, ward))
    .sort((left, right) => {
      const roleDifference = left.role.localeCompare(right.role);
      return roleDifference || left.name.localeCompare(right.name);
    });
}

function getAccountRoleLabel(role) {
  if (role === "youth") {
    return "Youth";
  }
  if (role === "youth_leader") {
    return "Youth Leader";
  }
  if (role === "parent") {
    return "Parent";
  }
  if (role === "bishop") {
    return "Bishop";
  }
  return "Account";
}

function getAccessStatusLabel(user) {
  if (user.approvalStatus === "rejected") {
    return "Disabled";
  }

  if (user.role === "youth_leader") {
    return user.approvalStatus === "approved" ? "Access enabled" : "Waiting for approval";
  }

  return "Access enabled";
}

function getEnabledStatusForRole(role) {
  return role === "youth_leader" ? "approved" : "verified";
}

function getActiveTemplate() {
  if (activeTemplateId === NEW_TEMPLATE_ID) {
    return null;
  }

  if (!state.templates.length) {
    activeTemplateId = null;
    return null;
  }

  const matchingTemplate = state.templates.find((template) => template.id === activeTemplateId);
  if (matchingTemplate) {
    return matchingTemplate;
  }

  activeTemplateId = state.templates[0].id;
  return state.templates[0];
}

function setUserAuthMode(mode) {
  activeUserAuthMode = mode;
  const createMode = mode === "create";
  elements.signInModeButton.classList.toggle("active", mode === "signin");
  elements.createAccountModeButton.classList.toggle("active", mode === "create");
  elements.loginForm.classList.toggle("hidden", createMode);
  elements.registerForm.classList.toggle("hidden", !createMode);
  renderRegisterWardOptions();
}

function setActiveRole(role) {
  activeRole = role;
  elements.userTab.classList.toggle("active", role === "youth");
  elements.parentTab?.classList.toggle("active", role === "parent");
  elements.leaderTab.classList.toggle("active", role === "youth_leader");
  elements.bishopTab.classList.toggle("active", role === "bishop");
  elements.adminTab?.classList.toggle("active", role === "administrator");
  if (role === "administrator") {
    activeUserAuthMode = "signin";
  }
  elements.userAuthModes.classList.toggle("hidden", role === "administrator");
  elements.identityLabel.textContent = "Email";
  elements.username.type = "email";
  elements.username.placeholder =
    role === "administrator" ? "Enter admin email" :
    role === "bishop" ? "Enter bishop email" :
    role === "youth_leader" ? "Enter Youth leader email" :
    role === "parent" ? "Enter parent email" :
    "Enter youth email";
  elements.registerOrganizationField.classList.toggle("hidden", role === "bishop" || role === "parent" || role === "administrator");
  elements.registerCompetitionField?.classList.toggle("hidden", role !== "youth");
  setUserAuthMode(activeUserAuthMode);
  elements.userAuthModes.classList.toggle("hidden", role === "administrator");
}

function renderRegisterWardOptions() {
  if (!elements.registerWard || elements.registerWard.tagName !== "SELECT") {
    return;
  }

  const canCreateWard = activeRole === "bishop";
  const wardOptions = (state.wards || [])
    .filter((ward) => ward.name && normalizeWardKey(ward.name) !== "all")
    .sort((left, right) => left.name.localeCompare(right.name));
  const currentValue = elements.registerWard.value;
  elements.registerWard.innerHTML = `
    <option value="">Choose your ward</option>
    ${wardOptions.map((ward) => `<option value="${escapeHtml(ward.id)}">${escapeHtml(ward.name)}</option>`).join("")}
    ${canCreateWard ? `<option value="__new_ward__">Add a new ward...</option>` : ""}
  `;

  if (wardOptions.some((ward) => ward.id === currentValue) || (canCreateWard && currentValue === "__new_ward__")) {
    elements.registerWard.value = currentValue;
  }
  updateRegisterNewWardVisibility();
}

function updateRegisterNewWardVisibility() {
  const isCreatingWard = activeRole === "bishop" && elements.registerWard?.value === "__new_ward__";
  elements.registerNewWardField?.classList.toggle("hidden", !isCreatingWard);
  if (elements.registerNewWard) {
    elements.registerNewWard.required = isCreatingWard;
    if (!isCreatingWard) {
      elements.registerNewWard.value = "";
    }
  }
}

function getSelectedRegisterWard() {
  const field = elements.registerWard;
  if (!field) {
    return { ward: "", wardId: "" };
  }

  if (field.tagName === "SELECT") {
    if (field.value === "__new_ward__") {
      const newWardName = elements.registerNewWard?.value.trim() || "";
      return {
        ward: newWardName,
        wardId: ""
      };
    }
    const option = field.selectedOptions?.[0] || null;
    return {
      ward: option && option.value ? option.textContent.trim() : "",
      wardId: field.value
    };
  }

  return {
    ward: field.value.trim(),
    wardId: ""
  };
}

async function login(event) {
  event.preventDefault();
  try {
    const identifier = elements.username.value.trim().toLowerCase();
    const password = elements.password.value;
    const result = await authClient.signIn({
      appState: state,
      role: activeRole,
      email: identifier,
      password
    });

    if (!result.ok) {
      window.alert(result.error);
      return;
    }

    if (result.appState) {
      state = normalizeState(result.appState);
    }
    state.session = result.session;
    if (isSupabaseRuntime && result.session?.authMode === "supabase") {
      try {
        const reloadedState = await backendClient.loadAppState(STORAGE_KEY, state);
        state = normalizeState(reloadedState);
        state.session = result.session;
      } catch (reloadError) {
        console.warn("Supabase state reload after login failed.", reloadError);
      }
    }
    if (backendClient.recordUserActivity && result.session?.userId) {
      try {
        const activityState = await backendClient.recordUserActivity(STORAGE_KEY, state, {
          userId: result.session.userId,
          fallbackState: getFallbackState()
        });
        state = normalizeState(activityState);
        state.session = result.session;
      } catch (activityError) {
        console.warn("User activity timestamp could not be recorded.", activityError);
      }
    }
    activeAdminDashboardView = "overview";
    activeYouthDashboardView = "goals";
    saveState();
    elements.loginForm.reset();
    render();
  } catch (error) {
    console.warn("Login failed unexpectedly.", error);
    window.alert(error?.message || "Login failed unexpectedly. Please try again.");
  }
}

async function registerUser(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const name = form.elements.registerName.value.trim();
  const email = form.elements.registerEmail.value.trim().toLowerCase();
  const { ward, wardId } = getSelectedRegisterWard();
  const organization = activeRole === "bishop" || activeRole === "parent" ? "all" : form.elements.registerOrganization.value;
  const competitionOptIn = activeRole === "youth" ? form.elements.registerCompetitionOptIn.checked : false;
  const password = form.elements.registerPassword.value;

  if (!name || !email || !ward || !password) {
    window.alert("Please complete your name, email, ward, and password.");
    return;
  }

  const result = await authClient.signUp({
    appState: state,
    role: activeRole,
    name,
    email,
    ward,
    wardId,
    organization,
    competitionOptIn,
    password,
    createId
  });

  if (!result.ok) {
    window.alert(result.error);
    return;
  }

  state = normalizeState(result.appState || state);
  if (result.requiresEmailVerification) {
    saveState();
    form.reset();
    setUserAuthMode("signin");
    window.alert("Your account was created. Please verify your email, then sign in to finish setting up your profile.");
    render();
    return;
  }
  if (result.pendingApproval) {
    saveState();
    form.reset();
    setUserAuthMode("signin");
    window.alert("Your Youth leader account has been created and is waiting for bishop approval.");
    render();
    return;
  }

  state.session = result.session;
  activeAdminDashboardView = "overview";
  activeYouthDashboardView = "goals";
  saveState();
  form.reset();
  setUserAuthMode("signin");
  render();
}

async function logout() {
  await authClient.signOut();
  state.session = null;
  activeAdminDashboardView = "overview";
  activeYouthDashboardView = "goals";
  closeAccountMenu();
  saveState();
  render();
}

async function toggleSubGoalUnit(goalId, subGoalId, unitIndex, completed) {
  const goal = state.goals.find((item) => item.id === goalId);
  if (!goal || isGoalClosed(goal) || !goal.goalApproved) {
    return;
  }
  const sessionUser = getSessionUser();
  const previousGoal = JSON.parse(JSON.stringify(goal));

  const subGoal = goal.subGoals.find((item) => item.id === subGoalId);
  if (!subGoal) {
    return;
  }

  subGoal.completedUnits = subGoal.completedUnits || Array.from({ length: subGoal.repeatCount }, () => null);
  subGoal.completedUnits[unitIndex] = completed ? getTodayDateString() : null;

  if (getGoalProgress(goal) < 100) {
    resetCompletionApproval(goal);
  }

  const queuedNotifications = completed && sessionUser?.role === "youth"
    ? queueSameGoalPassedNotifications(previousGoal, goal, sessionUser)
    : [];

  await persistGoal(goal);
  if (queuedNotifications.length && backendClient.dispatchNotifications) {
    backendClient.dispatchNotifications(STORAGE_KEY, state, { notifications: queuedNotifications }).catch((error) => {
      console.warn("Notification dispatch failed; notifications remain queued.", error);
    });
  }
}

function queueSameGoalPassedNotifications(previousActorGoal, actorGoal, actor) {
  const matchKey = getGoalMatchKey(actorGoal);
  const previousTotal = getGoalCompletedCheckCount(previousActorGoal);
  const nextTotal = getGoalCompletedCheckCount(actorGoal);
  const previousWeek = getGoalCompletedCheckCount(previousActorGoal, "week");
  const nextWeek = getGoalCompletedCheckCount(actorGoal, "week");

  if (nextTotal <= previousTotal && nextWeek <= previousWeek) {
    return;
  }

  const existingNotificationKeys = new Set((state.notifications || []).map((notification) =>
    `${notification.userId}:${notification.actorId}:${notification.goalId}:${notification.createdAt}:${notification.type}`
  ));

  const newNotifications = state.goals
    .filter((candidate) => candidate.userId !== actor.id && getGoalMatchKey(candidate) === matchKey)
    .map((candidate) => {
      const recipient = state.users.find((user) =>
        user.id === candidate.userId &&
        user.role === "youth" &&
        user.sameGoalNotificationsOptIn &&
        user.competitionOptIn !== false
      );
      if (!recipient) {
        return null;
      }

      const recipientTotal = getGoalCompletedCheckCount(candidate);
      const recipientWeek = getGoalCompletedCheckCount(candidate, "week");
      const passedOverall = previousTotal <= recipientTotal && nextTotal > recipientTotal;
      const passedThisWeek = previousWeek <= recipientWeek && nextWeek > recipientWeek;
      if (!passedOverall && !passedThisWeek) {
        return null;
      }

      const channels = getNotificationChannels(recipient);
      const reason = passedOverall
        ? `${actor.name} passed you on ${actorGoal.title} with ${nextTotal}/${getGoalTotalCheckCount(actorGoal)} checkboxes complete.`
        : `${actor.name} has completed ${nextWeek} same-goal checks this week, which is now ahead of your ${recipientWeek}.`;
      const notification = {
        id: createId("notification"),
        userId: recipient.id,
        recipientId: recipient.id,
        actorId: actor.id,
        actorName: actor.name,
        goalId: actorGoal.id,
        goalTitle: actorGoal.title,
        type: "same_goal_passed",
        message: reason,
        recipientEmail: recipient.email || "",
        pushToken: recipient.pushToken || "",
        createdAt: getTodayDateString(),
        readAt: null,
        channels,
        status: channels.email || channels.push ? "queued" : "in_app"
      };
      const key = `${notification.userId}:${notification.actorId}:${notification.goalId}:${notification.createdAt}:${notification.type}`;
      return existingNotificationKeys.has(key) ? null : notification;
    })
    .filter(Boolean);

  if (newNotifications.length) {
    state.notifications = [...newNotifications, ...(state.notifications || [])];
  }
  return newNotifications;
}

async function undoLatestSubGoalCompletion(goalId, subGoalId) {
  const goal = state.goals.find((item) => item.id === goalId);
  if (!goal) {
    return;
  }

  const subGoal = goal.subGoals.find((item) => item.id === subGoalId);
  if (!subGoal) {
    return;
  }

  const latestIndex = getMostRecentCompletedUnitIndex(subGoal);
  if (latestIndex < 0) {
    return;
  }

  subGoal.completedUnits[latestIndex] = null;
  resetCompletionApproval(goal);
  await persistGoal(goal);
}

async function approveGoalPlan(goalId, difficulty, category) {
  const sessionUser = getSessionUser();
  const goal = state.goals.find((item) => item.id === goalId);

  if (!sessionUser || !isWardAdmin(sessionUser) || !goal) {
    return;
  }

  if (isGoalClosed(goal)) {
    window.alert("This goal needs an approved extension before it can be approved.");
    return;
  }

  approveGoalPlanFields(goal, sessionUser, difficulty, category);
  await persistGoal(goal);
}

async function approveGoal(goalId) {
  const sessionUser = getSessionUser();
  const goal = state.goals.find((item) => item.id === goalId);

  if (!sessionUser || !isWardAdmin(sessionUser) || !goal) {
    return;
  }

  if (isGoalClosed(goal)) {
    window.alert("This goal needs an approved extension before it can be signed off.");
    return;
  }

  if (!goal.goalApproved) {
    window.alert("Approve the goal plan and assign a difficulty before completing final approval.");
    return;
  }

  if (getGoalProgress(goal) !== 100) {
    window.alert("Every checklist item must be complete before a leader can approve the goal.");
    return;
  }

  goal.leaderApproved = true;
  goal.leaderApprovedBy = sessionUser.name;
  goal.completedAt = getTodayDateString();
  const youth = state.users.find((user) => user.id === goal.userId && user.role === "youth");
  await persistGoal(goal);
  if (youth) {
    await assignRequiredGoalsForCurrentAttainment(youth, sessionUser.id);
    render();
  }
}

function resetFirstRunState() {
  if (isSupabaseRuntime) {
    return;
  }
  state = normalizeState(cloneFirstRunState());
  saveState();
  render();
}

async function addGoal(event) {
  event.preventDefault();

  const sessionUser = getSessionUser();
  if (!sessionUser || sessionUser.role !== "youth") {
    return;
  }

  const form = event.currentTarget;
  const title = form.elements.goalTitle.value.trim();
  const summary = form.elements.goalSummary.value.trim();
  const category = normalizeGoalCategory(form.elements.goalCategory?.value || "spiritual");
  const difficulty = normalizeDifficulty(form.elements.goalDifficulty?.value || "medium");
  const deadline = form.elements.goalDeadline.value;
  const draftChecklistItems = readDraftChecklistItems(form);

  if (!title || !summary || !deadline || !draftChecklistItems.length) {
    window.alert("Please add a goal title, summary, deadline, and at least one checklist item.");
    return;
  }

  const goal = {
    id: createId("goal"),
    userId: sessionUser.id,
    title,
    summary,
    points: 0,
    category,
    difficulty,
    priorityOrder: getNextGoalPriority(sessionUser.id),
    goalApproved: false,
    goalApprovedBy: null,
    goalApprovedAt: null,
    deadline,
    leaderApproved: false,
    leaderApprovedBy: null,
    completedAt: null,
    subGoals: draftChecklistItems.map((item) => {
      return {
      id: createId("subgoal"),
      title: item.title,
      repeatCount: item.repeatCount,
      completedUnits: Array.from({ length: item.repeatCount }, () => null)
    };
    })
  };

  activeYouthDashboardView = "goals";
  await persistGoal(goal, { isCreate: true, createdBy: sessionUser.id });
  form.reset();
  render();
}

function setActiveYouthDashboardView(view) {
  activeYouthDashboardView = ["create", "prioritize", "competition"].includes(view) ? view : "goals";
  render();
}

function setActiveAdminDashboardView(view) {
  activeAdminDashboardView = ["create-goal", "create-youth", "import-youth", "create-template", "templates", "required-goals", "goals", "ward-approval", "edit-youth", "ward-management"].includes(view) ? view : "overview";
  if (activeAdminDashboardView !== "edit-youth") {
    activeEditingYouthId = null;
  }
  render();
}

function openYouthAccountEditor(youthId) {
  activeEditingYouthId = youthId;
  activeAdminDashboardView = "edit-youth";
  render();
}

async function createManagedGoal(event) {
  event.preventDefault();

  const sessionUser = getSessionUser();
  if (!sessionUser || !isWardAdmin(sessionUser)) {
    return;
  }

  const form = event.currentTarget;
  const targetYouthId = form.elements.targetYouthId.value;
  const targetYouth = state.users.find((user) => user.id === targetYouthId);
  const title = form.elements.goalTitle.value.trim();
  const summary = form.elements.goalSummary.value.trim();
  const difficulty = normalizeDifficulty(form.elements.goalDifficulty?.value || "medium");
  const category = normalizeGoalCategory(form.elements.goalCategory?.value || "spiritual");
  const deadline = form.elements.goalDeadline.value;
  const draftChecklistItems = readDraftChecklistItems(form);

  if (!targetYouth || !canManageYouth(sessionUser, targetYouth) || !title || !summary || !deadline || !draftChecklistItems.length) {
    window.alert("Please choose a youth you manage, then add a title, summary, deadline, and at least one checklist item.");
    return;
  }

  const goal = {
    id: createId("goal"),
    userId: targetYouth.id,
    title,
    summary,
    points: 0,
    difficulty,
    category,
    priorityOrder: getNextGoalPriority(targetYouth.id),
    goalApproved: true,
    goalApprovedBy: sessionUser.name,
    goalApprovedAt: getTodayDateString(),
    deadline,
    leaderApproved: false,
    leaderApprovedBy: null,
    completedAt: null,
    subGoals: draftChecklistItems.map((item) => ({
      id: createId("subgoal"),
      title: item.title,
      repeatCount: item.repeatCount,
      completedUnits: Array.from({ length: item.repeatCount }, () => null)
    }))
  };

  await persistGoal(goal, { isCreate: true, createdBy: sessionUser.id });
  activeAdminDashboardView = "goals";
  form.reset();
  writeDraftChecklistItems(form, []);
  render();
}

async function addSubGoal(goalId, event) {
  event.preventDefault();

  const form = event.currentTarget;
  const value = form.elements.subGoalTitle.value.trim();
  const repeatCount = parseRepeatCount(form.elements.subGoalRepeatCount.value);
  const goal = state.goals.find((item) => item.id === goalId);

  if (!goal || !value || isGoalClosed(goal) || !goal.goalApproved) {
    return;
  }

  goal.subGoals.push({
    id: createId("subgoal"),
    title: value,
    repeatCount,
    completedUnits: Array.from({ length: repeatCount }, () => null)
  });

  resetGoalPlanApproval(goal);
  resetCompletionApproval(goal);
  await persistGoal(goal);
}

async function createTemplate(event) {
  event.preventDefault();

  const sessionUser = getSessionUser();
  if (!sessionUser || !isWardAdmin(sessionUser)) {
    return;
  }

  const form = event.currentTarget;
  const title = form.elements.templateTitle.value.trim();
  const summary = form.elements.templateSummary.value.trim();
  const draftChecklistItems = readDraftChecklistItems(form);

  if (!title || !summary || !draftChecklistItems.length) {
    window.alert("Please add a template title, summary, and at least one checklist item.");
    return;
  }

  const template = {
    id: createId("template"),
    title,
    summary,
    points: normalizePointValue(form.elements.templatePoints?.value || 0),
    difficulty: normalizeDifficulty(form.elements.templateDifficulty?.value || "medium", form.elements.templatePoints?.value || 0),
    category: normalizeGoalCategory(form.elements.templateCategory?.value || "spiritual"),
    templateApproved: true,
    templateApprovedBy: sessionUser.name,
    templateApprovedById: sessionUser.id,
    templateApprovedAt: getTodayDateString(),
    subGoals: draftChecklistItems.map((item) => ({
      id: createId("template-subgoal"),
      title: item.title,
      repeatCount: item.repeatCount
    }))
  };

  activeTemplateId = template.id;
  activeAdminDashboardView = "templates";
  await persistTemplate(template, { isCreate: true, createdBy: sessionUser.id });
  form.reset();
  writeDraftChecklistItems(form, []);
  render();
}

async function assignTemplateToUser(templateId, userId) {
  const sessionUser = getSessionUser();
  if (!sessionUser || !isWardAdmin(sessionUser)) {
    return;
  }

  const template = state.templates.find((item) => item.id === templateId);
  const user = state.users.find((item) => item.id === userId && canManageYouth(sessionUser, item));

  if (!template || !user) {
    window.alert("Please choose a user before assigning this template.");
    return;
  }
  if (template.templateApproved === false) {
    window.alert("This optional goal still needs bishop or Youth leader approval before it can be copied to youth.");
    return;
  }

  await persistGoal(buildGoalFromTemplate(template, user.id), {
    isCreate: true,
    createdBy: sessionUser.id,
    sourceTemplateId: template.id
  });
}

async function createYouthAccount(event) {
  event.preventDefault();

  const sessionUser = getSessionUser();
  if (!sessionUser || !isWardAdmin(sessionUser)) {
    return;
  }

  const form = event.currentTarget;
  const name = form.elements.youthName.value.trim();
  const email = form.elements.youthEmail.value.trim().toLowerCase();
  const organization = form.elements.youthOrganization.value;
  const competitionOptIn = form.elements.youthCompetitionOptIn.checked;
  const password = form.elements.youthPassword.value;
  const allowedOrganizations = getAllowedOrganizationsForManager(sessionUser);

  if (!name || !organization) {
    window.alert("Please complete the youth name and organization.");
    return;
  }

  if (!allowedOrganizations.includes(organization)) {
    window.alert("You can only create youth accounts inside the organization you manage.");
    return;
  }

  const emailInUse = email && state.users.some((user) => String(user.email || "").toLowerCase() === email);
  if (emailInUse) {
    window.alert("That email already has an account.");
    return;
  }

  const user = {
    id: createId("youth"),
    role: "youth",
    name,
    email,
    password,
    ward: sessionUser.ward,
    organization,
    competitionOptIn,
    approvalStatus: "verified",
    loginStatus: email && password ? "verified" : email ? "invitation_ready" : "not_invited"
  };

  try {
    const nextState = await backendClient.createYouthAccount(STORAGE_KEY, state, {
      user,
      password,
      fallbackState: getFallbackState()
    });
    applyBackendState(nextState);
    await assignMissingRequiredGoalsForYouth(user, 1, sessionUser.id);
    saveState();
    activeAdminDashboardView = "overview";
    form.reset();
    render();
  } catch (error) {
    console.warn("Youth account creation failed.", error);
    window.alert(error?.message || "The youth account could not be created right now.");
  }
}

function splitDelimitedLine(line, delimiter) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];
    if (character === "\"" && quoted && nextCharacter === "\"") {
      current += "\"";
      index += 1;
    } else if (character === "\"") {
      quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  values.push(current.trim());
  return values;
}

function parseRosterText(rawText) {
  const lines = String(rawText || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return [];
  }

  const headerLine = lines[0];
  const delimiter = (headerLine.match(/\t/g) || []).length > (headerLine.match(/,/g) || []).length ? "\t" : ",";
  const headers = splitDelimitedLine(headerLine, delimiter).map((header) => header.toLowerCase().replace(/[^a-z0-9]+/g, ""));
  return lines.slice(1).map((line) => {
    const cells = splitDelimitedLine(line, delimiter);
    return headers.reduce((row, header, index) => {
      row[header] = cells[index] || "";
      return row;
    }, {});
  });
}

function getRosterField(row, fieldNames) {
  const normalizedNames = fieldNames.map((fieldName) => fieldName.toLowerCase().replace(/[^a-z0-9]+/g, ""));
  for (const name of normalizedNames) {
    if (row[name]) {
      return String(row[name]).trim();
    }
  }
  return "";
}

function normalizeRosterOrganization(value) {
  const normalizedValue = String(value || "").toLowerCase();
  if (normalizedValue.includes("young women") || normalizedValue.includes("female") || normalizedValue === "f") {
    return "young_women";
  }
  if (normalizedValue.includes("young men") || normalizedValue.includes("male") || normalizedValue === "m") {
    return "young_men";
  }
  return "";
}

function buildRosterYouth(row, allowedOrganizations, fallbackOrganization) {
  const fullName = getRosterField(row, ["preferredname", "preferredname", "individualname", "fullname", "name", "membername"]);
  const firstName = getRosterField(row, ["firstname", "givenname"]);
  const lastName = getRosterField(row, ["lastname", "surname", "familyname"]);
  const name = (fullName || `${firstName} ${lastName}`).trim().replace(/\s+/g, " ");
  const email = getRosterField(row, ["email", "emailaddress", "individualemail", "householdemail", "preferredemail"]).toLowerCase();
  const organization = normalizeRosterOrganization(getRosterField(row, ["organization", "class", "gender", "sex"])) || fallbackOrganization;

  if (!name || !allowedOrganizations.includes(organization)) {
    return null;
  }

  return {
    name,
    email,
    organization
  };
}

async function importYouthRoster(event) {
  event.preventDefault();
  const sessionUser = getSessionUser();
  if (!sessionUser || !isWardAdmin(sessionUser)) {
    return;
  }

  const form = event.currentTarget;
  const rosterText = form.elements.rosterData.value;
  const fallbackOrganization = form.elements.defaultOrganization.value;
  const allowedOrganizations = getAllowedOrganizationsForManager(sessionUser);
  const rows = parseRosterText(rosterText);
  const importedYouth = [];
  const skippedRows = [];
  const seenKeys = new Set();

  rows.forEach((row, index) => {
    const youth = buildRosterYouth(row, allowedOrganizations, fallbackOrganization);
    if (!youth) {
      skippedRows.push(index + 2);
      return;
    }

    const duplicateKey = youth.email || `${youth.name.toLowerCase()}:${youth.organization}`;
    if (seenKeys.has(duplicateKey)) {
      skippedRows.push(index + 2);
      return;
    }

    const existingYouth = state.users.some((user) =>
      user.role === "youth" &&
      isSameWard(user.ward, sessionUser.ward) &&
      (
        (youth.email && String(user.email || "").toLowerCase() === youth.email) ||
        (!youth.email && user.name.toLowerCase() === youth.name.toLowerCase() && user.organization === youth.organization)
      )
    );

    if (existingYouth) {
      skippedRows.push(index + 2);
      return;
    }

    seenKeys.add(duplicateKey);
    importedYouth.push(youth);
  });

  if (!importedYouth.length) {
    window.alert("No new youth were found to import.");
    return;
  }

  try {
    let nextState = state;
    for (const youth of importedYouth) {
      const user = {
        id: createId("youth"),
        role: "youth",
        name: youth.name,
        email: youth.email,
        password: "",
        ward: sessionUser.ward,
        organization: youth.organization,
        approvalStatus: "verified",
        loginStatus: youth.email ? "invitation_ready" : "not_invited"
      };
      nextState = await backendClient.createYouthAccount(STORAGE_KEY, nextState, {
        user,
        password: "",
        fallbackState: getFallbackState()
      });
    }

    applyBackendState(nextState);
    for (const imported of importedYouth) {
      const youth = state.users.find((user) =>
        user.role === "youth" &&
        isSameWard(user.ward, sessionUser.ward) &&
        user.organization === imported.organization &&
        (
          (imported.email && user.email === imported.email) ||
          (!imported.email && user.name.toLowerCase() === imported.name.toLowerCase())
        )
      );
      if (youth) {
        await assignMissingRequiredGoalsForYouth(youth, 1, sessionUser.id);
      }
    }
    saveState();
    activeAdminDashboardView = "overview";
    form.reset();
    window.alert(`Imported ${importedYouth.length} youth profile${importedYouth.length === 1 ? "" : "s"}${skippedRows.length ? ` and skipped ${skippedRows.length} row${skippedRows.length === 1 ? "" : "s"}` : ""}.`);
    render();
  } catch (error) {
    console.warn("Youth roster import failed.", error);
    window.alert(error?.message || "The ward list could not be imported right now.");
  }
}

async function updateYouthAccount(event) {
  event.preventDefault();

  const sessionUser = getSessionUser();
  if (!sessionUser || !isWardAdmin(sessionUser)) {
    return;
  }

  const form = event.currentTarget;
  const youthId = form.elements.youthId.value;
  const youth = state.users.find((user) => user.id === youthId && canManageYouth(sessionUser, user));
  const name = form.elements.youthName.value.trim();
  const email = form.elements.youthEmail.value.trim().toLowerCase();
  const organization = form.elements.youthOrganization.value;
  const allowedOrganizations = getAllowedOrganizationsForManager(sessionUser);

  if (!youth || !name || !organization) {
    window.alert("Please choose a youth, then complete the youth name and organization.");
    return;
  }

  if (!allowedOrganizations.includes(organization)) {
    window.alert("You can only manage youth accounts inside the organization you serve.");
    return;
  }

  const emailInUse = email && state.users.some((user) => user.id !== youth.id && String(user.email || "").toLowerCase() === email);
  if (emailInUse) {
    window.alert("That email is already attached to another account.");
    return;
  }

  const updatedYouth = {
    ...youth,
    name,
    email,
    organization,
    loginStatus: youth.loginStatus === "verified" ? "verified" : email ? "invitation_ready" : "not_invited"
  };

  try {
    const nextState = await backendClient.updateYouthAccount(STORAGE_KEY, state, {
      user: updatedYouth,
      updatedBy: sessionUser.id,
      fallbackState: getFallbackState()
    });
    applyBackendState(nextState);
    saveState();
    activeEditingYouthId = null;
    activeAdminDashboardView = "overview";
    render();
  } catch (error) {
    console.warn("Youth account update failed.", error);
    window.alert(error?.message || "The youth account could not be updated right now.");
  }
}

async function createParentForYouth(event) {
  event.preventDefault();

  const sessionUser = getSessionUser();
  if (!sessionUser || !isWardAdmin(sessionUser)) {
    return;
  }

  const form = event.currentTarget;
  const youthId = form.elements.youthId.value;
  const youth = state.users.find((user) => user.id === youthId && canManageYouth(sessionUser, user));
  const name = form.elements.parentName.value.trim();
  const email = form.elements.parentEmail.value.trim().toLowerCase();
  const password = form.elements.parentPassword?.value || "";
  const relationship = form.elements.parentRelationship.value.trim() || "Parent";

  if (!youth || !name) {
    window.alert("Please add a parent name.");
    return;
  }

  const emailInUse = email && state.users.some((user) => user.email === email && user.role !== "parent");
  if (emailInUse) {
    window.alert("That email is already attached to another non-parent account.");
    return;
  }

  let parent = email
    ? state.users.find((user) => user.role === "parent" && user.email === email)
    : null;

  if (!parent) {
    parent = {
      id: createId("parent"),
      role: "parent",
      name,
      email,
      password,
      ward: youth.ward,
      organization: "all",
      approvalStatus: "verified",
      loginStatus: email && password ? "verified" : email ? "invitation_ready" : "not_invited"
    };
  } else {
    parent = {
      ...parent,
      name,
      password: password || parent.password || "",
      ward: parent.ward || youth.ward,
      loginStatus: parent.loginStatus === "verified" || (parent.email && (password || parent.password)) ? "verified" : parent.email ? "invitation_ready" : "not_invited"
    };
  }

  const existingLinks = state.parentYouthLinks || [];
  const nextLinks = existingLinks.some((link) => link.parentId === parent.id && link.youthId === youth.id)
    ? existingLinks.map((link) => link.parentId === parent.id && link.youthId === youth.id ? { ...link, relationship } : link)
    : [...existingLinks, { parentId: parent.id, youthId: youth.id, relationship }];

  try {
    const nextState = await backendClient.updateParentYouthLinks(STORAGE_KEY, state, {
      parent,
      youthId: youth.id,
      relationship,
      parentYouthLinks: nextLinks,
      updatedBy: sessionUser.id,
      fallbackState: getFallbackState()
    });
    applyBackendState(nextState);
    saveState();
    activeEditingYouthId = youth.id;
    activeAdminDashboardView = "edit-youth";
    render();
  } catch (error) {
    console.warn("Parent link update failed.", error);
    window.alert(error?.message || "The parent could not be linked right now.");
  }
}

async function unlinkParentFromYouth(parentId, youthId) {
  const sessionUser = getSessionUser();
  const youth = state.users.find((user) => user.id === youthId && canManageYouth(sessionUser, user));
  const parent = state.users.find((user) => user.id === parentId && user.role === "parent");
  if (!sessionUser || !isWardAdmin(sessionUser) || !youth || !parent) {
    return;
  }

  const nextLinks = (state.parentYouthLinks || []).filter((link) => !(link.parentId === parentId && link.youthId === youthId));

  try {
    const nextState = await backendClient.updateParentYouthLinks(STORAGE_KEY, state, {
      parent,
      youthId,
      unlink: true,
      parentYouthLinks: nextLinks,
      updatedBy: sessionUser.id,
      fallbackState: getFallbackState()
    });
    applyBackendState(nextState);
    saveState();
    activeEditingYouthId = youthId;
    activeAdminDashboardView = "edit-youth";
    render();
  } catch (error) {
    console.warn("Parent unlink failed.", error);
    window.alert(error?.message || "The parent link could not be removed right now.");
  }
}

async function approveYouthLeaderAccount(leaderId) {
  const sessionUser = getSessionUser();
  if (!sessionUser || sessionUser.role !== "bishop") {
    return;
  }

  const leader = state.users.find((user) => user.id === leaderId && user.role === "youth_leader" && user.ward === sessionUser.ward);
  if (!leader) {
    return;
  }

  try {
    leader.approvalStatus = "approved";
    const nextState = await backendClient.approveYouthLeader(STORAGE_KEY, state, {
      leaderId,
      approvedBy: sessionUser.id,
      fallbackState: getFallbackState()
    });
    applyBackendState(nextState);
    saveState();
    render();
  } catch (error) {
    leader.approvalStatus = "pending";
    console.warn("Youth leader approval failed.", error);
    window.alert(error?.message || "The Youth leader approval could not be completed right now.");
  }
}

async function updateWardAccessStatus(userId, approvalStatus) {
  const sessionUser = getSessionUser();
  const target = state.users.find((user) => user.id === userId && (user.role === "youth_leader" || user.role === "parent"));
  if (!sessionUser || sessionUser.role !== "bishop" || !target || !isSameWard(sessionUser.ward, target.ward)) {
    return;
  }

  const normalizedStatus = approvalStatus === "rejected" ? "rejected" : getEnabledStatusForRole(target.role);
  try {
    const nextState = await backendClient.updateUserAccessStatus(STORAGE_KEY, state, {
      userId: target.id,
      approvalStatus: normalizedStatus,
      updatedBy: sessionUser.id,
      fallbackState: getFallbackState()
    });
    applyBackendState(nextState);
    saveState();
    activeAdminDashboardView = "ward-approval";
    render();
  } catch (error) {
    console.warn("Access status update failed.", error);
    window.alert(error?.message || "Access could not be updated right now.");
  }
}

async function updateWardAccountType(form) {
  const sessionUser = getSessionUser();
  const userId = form.elements.userId.value;
  const target = state.users.find((user) => user.id === userId && ["youth", "youth_leader", "parent"].includes(user.role));
  if (!sessionUser || sessionUser.role !== "bishop" || !target || !isSameWard(sessionUser.ward, target.ward)) {
    return;
  }

  const role = form.elements.accountRole.value;
  const organization = role === "parent" ? "all" : form.elements.accountOrganization.value;
  if (!["youth", "youth_leader", "parent"].includes(role)) {
    window.alert("Choose Youth, Youth Leader, or Parent.");
    return;
  }
  if (role !== "parent" && !["young_men", "young_women"].includes(organization)) {
    window.alert("Choose Young Men or Young Women for Youth and Youth Leader accounts.");
    return;
  }

  try {
    const nextState = await backendClient.updateUserAccountType(STORAGE_KEY, state, {
      userId: target.id,
      role,
      organization,
      updatedBy: sessionUser.id,
      fallbackState: getFallbackState()
    });
    applyBackendState(nextState);
    saveState();
    activeAdminDashboardView = "ward-approval";
    render();
  } catch (error) {
    console.warn("Account type update failed.", error);
    window.alert(error?.message || "Account type could not be updated right now.");
  }
}

function buildGoalCard(goal, mode) {
  const fragment = elements.goalCardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".goal-card");
  const owner = state.users.find((user) => user.id === goal.userId);
  const sessionUser = getSessionUser();
  const progress = getGoalProgress(goal);
  const status = getGoalStatus(goal);
  const goalClosed = isGoalClosed(goal);
  const requiredGoalLabel = goal.requiredGoalLevel ? `Required ${getLevelLabel(goal.requiredGoalLevel)}` : "";

  card.classList.toggle("is-required-goal", Boolean(goal.requiredGoalLevel));

  fragment.querySelector(".goal-owner").textContent = owner ? owner.name : "Unknown user";
  fragment.querySelector(".goal-title").textContent = goal.title;
  fragment.querySelector(".goal-summary").textContent = goal.summary;
  fragment.querySelector(".progress-value").textContent = `${progress}%`;
  fragment.querySelector(".progress-fill").style.width = `${progress}%`;

  const statusNode = fragment.querySelector(".goal-status");
  statusNode.textContent = status.label;
  statusNode.classList.add(status.className);

  const subGoalList = fragment.querySelector(".subgoal-list");
  const actions = fragment.querySelector(".goal-actions");

  const pointsRow = document.createElement("div");
  pointsRow.className = "goal-points-row";
  pointsRow.innerHTML = `
    <span class="goal-points-badge">${getGoalCategoryLabel(goal.category)}</span>
    <span class="goal-points-badge">${getDifficultyLabel(goal.difficulty)}</span>
    ${requiredGoalLabel ? `<span class="required-goal-badge">${requiredGoalLabel}</span>` : ""}
    <span class="subgoal-meta">${goal.leaderApproved ? "Completed and approved" : goal.goalApproved ? "Approved category and difficulty" : "Awaiting category and difficulty approval"}</span>
  `;
  actions.appendChild(pointsRow);

  const deadlineMeta = document.createElement("p");
  deadlineMeta.className = "goal-deadline";
  deadlineMeta.textContent = goalClosed
    ? `Deadline passed on ${formatDeadline(goal.deadline)}. A Youth leader or bishop must approve an extension.`
    : `Deadline: ${formatDeadline(goal.deadline)}`;
  actions.appendChild(deadlineMeta);

  const useCompactChapterGrid = goal.subGoals.length > 40 && goal.subGoals.every((subGoal) => subGoal.repeatCount === 1);
  if (useCompactChapterGrid) {
    const chapterGrid = document.createElement("div");
    chapterGrid.className = "chapter-checklist-grid";
    goal.subGoals.forEach((subGoal) => {
      const completedDate = subGoal.completedUnits?.[0] || null;
      const label = document.createElement("label");
      label.className = `chapter-check-item${completedDate ? " completed" : ""}`;
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(completedDate);
      checkbox.disabled = mode !== "youth" || goalClosed || !goal.goalApproved;
      checkbox.title = completedDate ? `Completed on ${formatCompletedDate(completedDate)}` : "Not completed yet";
      checkbox.dataset.completedDate = completedDate || "";
      if (mode === "youth") {
        checkbox.addEventListener("change", (event) => {
          toggleSubGoalUnit(goal.id, subGoal.id, 0, event.target.checked);
        });
      }
      const text = document.createElement("span");
      text.textContent = subGoal.title;
      label.append(checkbox, text);
      chapterGrid.appendChild(label);
    });
    subGoalList.appendChild(chapterGrid);
  } else {
    goal.subGoals.forEach((subGoal) => {
    const completedCount = getCompletedCount(subGoal);
    const row = document.createElement("div");
    row.className = "subgoal-row";
    row.classList.toggle("completed", completedCount === subGoal.repeatCount);

    const details = document.createElement("div");
    details.className = "checklist-item";
    const textWrap = document.createElement("div");
    const subGoalTitle = document.createElement("h4");
    subGoalTitle.className = "checklist-label";
    subGoalTitle.classList.toggle("completed", completedCount === subGoal.repeatCount);
    subGoalTitle.textContent = subGoal.title;
    const subGoalMeta = document.createElement("div");
    subGoalMeta.className = "subgoal-meta";
    const latestCompletedIndex = getMostRecentCompletedUnitIndex(subGoal);
    const latestCompletedDate = latestCompletedIndex >= 0 ? subGoal.completedUnits[latestCompletedIndex] : null;
    subGoalMeta.textContent = latestCompletedDate
      ? `${completedCount} of ${subGoal.repeatCount} completed. Last checked on ${formatCompletedDate(latestCompletedDate)}.`
      : `${completedCount} of ${subGoal.repeatCount} completed`;
    textWrap.append(subGoalTitle, subGoalMeta);

    const checklistTrack = document.createElement("div");
    checklistTrack.className = "checklist-track";

    for (let unitIndex = 0; unitIndex < subGoal.repeatCount; unitIndex += 1) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      const completedDate = subGoal.completedUnits?.[unitIndex] || null;
      checkbox.checked = Boolean(completedDate);
      checkbox.disabled = mode !== "youth" || goalClosed || !goal.goalApproved;
      checkbox.title = completedDate ? `Completed on ${formatCompletedDate(completedDate)}` : "Not completed yet";
      checkbox.dataset.completedDate = completedDate || "";

      if (mode === "youth") {
        checkbox.addEventListener("change", (event) => {
          toggleSubGoalUnit(goal.id, subGoal.id, unitIndex, event.target.checked);
        });
      }

      checklistTrack.appendChild(checkbox);
    }

    details.append(textWrap, checklistTrack);

    const actionWrap = document.createElement("div");
    actionWrap.className = "subgoal-actions";
    const badge = document.createElement("div");
    badge.className = "session-badge";
    badge.textContent = `${completedCount}/${subGoal.repeatCount}`;
    actionWrap.appendChild(badge);

    if ((mode === "youth_leader" || mode === "bishop") && completedCount > 0) {
      const undoButton = document.createElement("button");
      undoButton.type = "button";
      undoButton.className = "ghost-button";
      undoButton.textContent = "Undo Latest Check";
      undoButton.addEventListener("click", () => undoLatestSubGoalCompletion(goal.id, subGoal.id));
      actionWrap.appendChild(undoButton);
    }

    row.append(details, actionWrap);
    subGoalList.appendChild(row);
    });
  }

  if (mode === "youth" && !goal.goalApproved) {
    const note = document.createElement("p");
    note.className = "leader-summary";
    note.textContent = "This goal is waiting for a Youth leader or bishop to approve its difficulty before work begins.";
    actions.appendChild(note);
  } else if (mode === "youth" && goalClosed) {
    const note = document.createElement("p");
    note.className = "leader-summary";
    note.textContent = "This goal is closed because its deadline passed. A Youth leader or bishop must approve an extension before you can keep working on it.";
    actions.appendChild(note);
  } else if (mode === "youth" && progress === 100 && !goal.leaderApproved) {
    const note = document.createElement("p");
    note.className = "leader-summary";
    note.textContent = "This goal is complete and ready for final Youth leader or bishop approval.";
    actions.appendChild(note);
  }

  if (mode === "youth" && !goalClosed && goal.goalApproved) {
    const subGoalForm = document.createElement("form");
    subGoalForm.className = "inline-form form-card";
    subGoalForm.innerHTML = `
      <label>
        <span>Add a checklist item</span>
        <input name="subGoalTitle" type="text" placeholder="Example: Meet with advisor" required>
      </label>
      <label>
        <span>Repeat count</span>
        <input name="subGoalRepeatCount" type="number" min="1" step="1" value="1" required>
      </label>
      <button class="secondary-button" type="submit">Add Checklist Item</button>
    `;
    subGoalForm.addEventListener("submit", (event) => addSubGoal(goal.id, event));
    actions.appendChild(subGoalForm);
  }

  if (mode === "youth_leader" || mode === "bishop") {
    const note = document.createElement("div");
    note.className = "leader-summary";
    note.textContent = goal.leaderApproved
      ? `Goal plan approved by ${goal.goalApprovedBy || "a leader"}${goal.goalApprovedAt ? ` on ${goal.goalApprovedAt}` : ""}. Completed goal approved by ${goal.leaderApprovedBy} on ${goal.completedAt}.`
      : goalClosed
        ? "This goal is closed because its deadline passed. Approve a new deadline to extend it."
        : !goal.goalApproved
          ? "Review this goal, assign a category and difficulty, and approve it before the youth begins work."
          : progress === 100
            ? "Goal plan is approved. Review the completed work for final approval."
            : `Goal plan approved by ${goal.goalApprovedBy || "a leader"}${goal.goalApprovedAt ? ` on ${goal.goalApprovedAt}` : ""}. Waiting for the youth to finish every checklist item.`;
    actions.appendChild(note);

    if (!goal.goalApproved && !goalClosed) {
      const approvalForm = document.createElement("form");
      approvalForm.className = "inline-form form-card";
      approvalForm.innerHTML = `
        <h4>Approve Goal Plan</h4>
        <label>
          <span>Category</span>
          <select name="approvalCategory">${buildCategoryOptions(goal.category)}</select>
        </label>
        <label>
          <span>Difficulty</span>
          <select name="approvalDifficulty">${buildDifficultyOptions(goal.difficulty)}</select>
        </label>
        <button class="primary-button" type="submit">Approve Goal Plan</button>
      `;
      approvalForm.addEventListener("submit", (event) => {
        event.preventDefault();
        approveGoalPlan(goal.id, approvalForm.elements.approvalDifficulty.value, approvalForm.elements.approvalCategory.value);
      });
      actions.appendChild(approvalForm);
    } else if (goalClosed) {
      const extensionForm = document.createElement("form");
      extensionForm.className = "inline-form form-card";
      extensionForm.innerHTML = `
        <label>
          <span>New deadline</span>
          <input name="extensionDeadline" type="date" min="${addDays(getTodayDateString(), 1)}" value="${addDays(getTodayDateString(), 7)}" required>
        </label>
        <button class="secondary-button" type="submit">Approve Extension</button>
      `;
      extensionForm.addEventListener("submit", (event) => {
        event.preventDefault();
        approveGoalExtension(goal.id, extensionForm.elements.extensionDeadline.value);
      });
      actions.appendChild(extensionForm);
    } else if (!goal.leaderApproved) {
      const approveButton = document.createElement("button");
      approveButton.type = "button";
      approveButton.className = "secondary-button";
      approveButton.textContent = "Approve Completed Goal";
      approveButton.disabled = progress !== 100;
      approveButton.addEventListener("click", () => approveGoal(goal.id));
      actions.appendChild(approveButton);
    }
  }

  if ((mode === "youth_leader" || mode === "bishop") && sessionUser) {
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "ghost-button";
    editButton.textContent = "Edit Goal";
    editButton.addEventListener("click", () => openGoalEditor(goal.id));
    actions.appendChild(editButton);
  }

  if (mode === "youth" && !isSupabaseRuntime) {
    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "ghost-button";
    resetButton.textContent = "Reset to first-run state";
    resetButton.addEventListener("click", resetFirstRunState);
    actions.appendChild(resetButton);
  }

  return card;
}

function buildGoalEditorOverlay(sessionUser) {
  if (!sessionUser || !isWardAdmin(sessionUser) || !activeGoalEditorId) {
    return null;
  }

  const goal = state.goals.find((item) => item.id === activeGoalEditorId);
  const owner = goal ? state.users.find((user) => user.id === goal.userId) : null;
  if (!goal || !owner || !canManageYouth(sessionUser, owner)) {
    activeGoalEditorId = null;
    return null;
  }

  const managedYouthOptions = getManagedYouth(sessionUser)
    .filter((user) => user.id !== goal.userId)
    .map((user) => `<option value="${user.id}">${user.name} (${getOrganizationLabel(user.organization)})</option>`)
    .join("");

  const overlay = document.createElement("section");
  overlay.className = "goal-editor-overlay";
  overlay.innerHTML = `
    <div class="goal-editor-screen" role="dialog" aria-modal="true" aria-label="Edit goal">
      <div class="goal-editor-header">
        <div>
          <p class="eyebrow">Edit Goal</p>
          <h2>${goal.title}</h2>
          <p class="subgoal-meta">${owner.name} (${getOrganizationLabel(owner.organization)})</p>
        </div>
        <button class="ghost-button" type="button" data-action="close-editor">Close</button>
      </div>
      <form class="inline-form goal-editor-form">
        <div class="goal-editor-grid">
          <label>
            <span>Goal title</span>
            <input name="editGoalTitle" type="text" value="${goal.title.replace(/"/g, "&quot;")}" required>
          </label>
          <label>
            <span>Category</span>
            <select name="editGoalCategory">${buildCategoryOptions(goal.category)}</select>
          </label>
          <label>
            <span>Difficulty</span>
            <select name="editGoalDifficulty">${buildDifficultyOptions(goal.difficulty)}</select>
          </label>
          <label>
            <span>Deadline</span>
            <input name="editGoalDeadline" type="date" value="${goal.deadline}" required>
          </label>
        </div>
        <label>
          <span>Goal summary</span>
          <textarea name="editGoalSummary">${goal.summary}</textarea>
        </label>
        <div class="editable-subgoal-list">
          ${buildEditableSubgoalRows(goal.subGoals)}
        </div>
        <div class="goal-editor-grid">
          <label>
            <span>Copy to youth</span>
            <select name="copyGoalTarget">
              <option value="">Choose youth</option>
              ${managedYouthOptions}
            </select>
          </label>
          <div class="template-action-wrap">
            <button class="secondary-button" type="button" data-action="copy-goal">Copy Goal</button>
          </div>
        </div>
        <div class="admin-action-row">
          <button class="secondary-button" type="button" data-action="save-template">Make Template</button>
          <button class="primary-button" type="submit">Save Goal Changes</button>
        </div>
      </form>
    </div>
  `;

  const form = overlay.querySelector(".goal-editor-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await updateGoalDetails(goal.id, form);
    activeGoalEditorId = null;
    render();
  });
  overlay.querySelector("[data-action='close-editor']").addEventListener("click", closeGoalEditor);
  overlay.querySelector("[data-action='save-template']").addEventListener("click", () => saveGoalAsTemplate(goal.id));
  overlay.querySelector("[data-action='copy-goal']").addEventListener("click", () => copyGoalToYouth(goal.id, form.elements.copyGoalTarget.value));
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeGoalEditor();
    }
  });

  return overlay;
}

function buildGoalPriorityBoard(sessionUser, goals) {
  const board = document.createElement("section");
  board.className = "goal-priority-board";
  board.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="eyebrow">Priority Board</p>
        <h3>Arrange your goals</h3>
        <p class="subgoal-meta">Drag a goal tile above or below another tile to choose what matters most right now.</p>
      </div>
    </div>
  `;

  const tileList = document.createElement("div");
  tileList.className = "goal-priority-list";

  if (!goals.length) {
    const empty = document.createElement("section");
    empty.className = "form-card goal-list-empty";
    empty.innerHTML = "<h3>No goals yet</h3><p>Create a goal first, then return here to arrange your priorities.</p>";
    board.appendChild(empty);
    return board;
  }

  let draggedGoalId = null;
  goals.forEach((goal, index) => {
    const progress = getGoalProgress(goal);
    const tile = document.createElement("article");
    tile.className = "goal-priority-tile";
    tile.draggable = true;
    tile.dataset.goalId = goal.id;
    tile.innerHTML = `
      <span class="goal-priority-rank">${index + 1}</span>
      <div>
        <h4>${goal.title}</h4>
        <p class="subgoal-meta">${progress}% complete &middot; ${getGoalCategoryLabel(goal.category)} &middot; ${getDifficultyLabel(goal.difficulty)} &middot; ${getGoalStatus(goal).label}</p>
      </div>
      <span class="goal-priority-handle" aria-hidden="true">Drag</span>
    `;

    tile.addEventListener("dragstart", (event) => {
      draggedGoalId = goal.id;
      tile.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", goal.id);
    });
    tile.addEventListener("dragend", () => {
      draggedGoalId = null;
      tile.classList.remove("is-dragging", "drop-before", "drop-after");
      tileList.querySelectorAll(".goal-priority-tile").forEach((item) => item.classList.remove("drop-before", "drop-after"));
    });
    tile.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (!draggedGoalId || draggedGoalId === goal.id) {
        return;
      }

      const rect = tile.getBoundingClientRect();
      const placement = event.clientY > rect.top + rect.height / 2 ? "after" : "before";
      tile.dataset.dropPlacement = placement;
      tile.classList.toggle("drop-before", placement === "before");
      tile.classList.toggle("drop-after", placement === "after");
    });
    tile.addEventListener("dragleave", () => {
      tile.classList.remove("drop-before", "drop-after");
    });
    tile.addEventListener("drop", (event) => {
      event.preventDefault();
      const droppedGoalId = event.dataTransfer.getData("text/plain") || draggedGoalId;
      reorderYouthGoal(sessionUser.id, droppedGoalId, goal.id, tile.dataset.dropPlacement || "before");
    });

    tileList.appendChild(tile);
  });

  board.appendChild(tileList);
  return board;
}

function renderUserDashboard(sessionUser) {
  const goals = getOrderedYouthGoals(sessionUser.id);
  elements.dashboardTitle.textContent = `${sessionUser.name}'s goals`;
  elements.userDashboard.innerHTML = "";

  const dashboardSwitch = document.createElement("div");
  dashboardSwitch.className = "tab-row user-dashboard-switch";
  dashboardSwitch.innerHTML = `
    <button class="tab-button${activeYouthDashboardView === "goals" ? " active" : ""}" type="button" data-youth-view="goals">Existing Goals</button>
    <button class="tab-button${activeYouthDashboardView === "competition" ? " active" : ""}" type="button" data-youth-view="competition">Competition</button>
    <button class="tab-button${activeYouthDashboardView === "prioritize" ? " active" : ""}" type="button" data-youth-view="prioritize">Prioritize Goals</button>
    <button class="tab-button${activeYouthDashboardView === "create" ? " active" : ""}" type="button" data-youth-view="create">Create Goal</button>
  `;
  dashboardSwitch.querySelectorAll("[data-youth-view]").forEach((button) => {
    button.addEventListener("click", () => setActiveYouthDashboardView(button.dataset.youthView));
  });
  elements.userDashboard.appendChild(dashboardSwitch);

  const formCard = document.createElement("section");
  formCard.className = "form-card";
  formCard.innerHTML = `
    <h3>Create a new goal</h3>
    <form class="inline-form" id="addGoalForm">
      <label>
        <span>Goal title</span>
        <input name="goalTitle" type="text" placeholder="Example: Finish mission preparation" required>
      </label>
      <label>
        <span>Goal summary</span>
        <textarea name="goalSummary" placeholder="Describe what success looks like." required></textarea>
      </label>
      <label>
        <span>Category</span>
        <select name="goalCategory">${buildCategoryOptions("spiritual")}</select>
      </label>
      <label>
        <span>Difficulty</span>
        <select name="goalDifficulty">${buildDifficultyOptions("medium")}</select>
      </label>
      <label>
        <span>Deadline</span>
        <input name="goalDeadline" type="date" value="${getDefaultGoalDeadline()}" min="${getTodayDateString()}" required>
      </label>
      <p class="subgoal-meta">A Youth leader or bishop can adjust the category and difficulty after reviewing the goal.</p>
      <div class="draft-builder">
        <div class="draft-builder-grid">
          <label>
            <span>Checklist item description</span>
            <input name="newSubGoalTitle" type="text" placeholder="Example: Read 20 minutes a day">
          </label>
          <label>
            <span>Quantity</span>
            <input name="newSubGoalRepeatCount" type="number" min="1" step="1" value="1">
          </label>
        </div>
        <button class="secondary-button" type="button" id="addGoalChecklistItemButton">Add Checklist Item</button>
        <input name="goalSubGoalsData" type="hidden" value="[]">
        <div class="draft-checklist-list"></div>
      </div>
      <button class="primary-button" type="submit">Create Goal</button>
    </form>
  `;
  const addGoalForm = formCard.querySelector("#addGoalForm");
  addGoalForm.addEventListener("submit", addGoal);
  addGoalForm.querySelector("#addGoalChecklistItemButton").addEventListener("click", () => addDraftChecklistItem(addGoalForm));
  renderDraftChecklistItems(addGoalForm);

  const goalsWrap = document.createElement("div");
  goalsWrap.className = "goal-list";
  if (goals.length) {
    goals.forEach((goal) => {
      goalsWrap.appendChild(buildGoalCard(goal, "youth"));
    });
  } else {
    const emptyCard = document.createElement("section");
    emptyCard.className = "form-card goal-list-empty";
    emptyCard.innerHTML = `
      <h3>No goals yet</h3>
      <p>Create your first goal when you are ready to start tracking progress.</p>
      <button class="secondary-button" type="button">Create Goal</button>
    `;
    emptyCard.querySelector("button").addEventListener("click", () => setActiveYouthDashboardView("create"));
    goalsWrap.appendChild(emptyCard);
  }

  if (activeYouthDashboardView === "create") {
    elements.userDashboard.appendChild(formCard);
  } else if (activeYouthDashboardView === "competition") {
    elements.userDashboard.appendChild(buildYouthCompetitionBoard(sessionUser));
  } else if (activeYouthDashboardView === "prioritize") {
    elements.userDashboard.appendChild(buildGoalPriorityBoard(sessionUser, goals));
  } else {
    elements.userDashboard.appendChild(goalsWrap);
  }
}

function buildParentYouthCard(youth, relationship) {
  const youthGoals = getOrderedYouthGoals(youth.id);
  const card = document.createElement("section");
  card.className = "form-card parent-child-card";
  card.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="eyebrow">${escapeHtml(relationship || "Child")}</p>
        <h3>${escapeHtml(youth.name)}</h3>
        <p class="subgoal-meta">${getOrganizationLabel(youth.organization)}</p>
      </div>
      <div class="session-badge">${youthGoals.length} goals</div>
    </div>
    <div class="goal-list"></div>
  `;

  const goalList = card.querySelector(".goal-list");
  if (youthGoals.length) {
    youthGoals.forEach((goal) => {
      goalList.appendChild(buildGoalCard(goal, "parent"));
    });
  } else {
    goalList.innerHTML = `<p class="subgoal-meta">No goals assigned yet.</p>`;
  }
  return card;
}

function renderParentDashboard(sessionUser) {
  const linkedYouth = getLinkedYouthForParent(sessionUser.id);
  elements.dashboardTitle.textContent = `${sessionUser.name}'s family dashboard`;
  elements.userDashboard.innerHTML = "";

  const summary = document.createElement("section");
  summary.className = "leader-summary";
  summary.innerHTML = `
    <strong>${linkedYouth.length}</strong> linked youth
    <br>
    Parents can review goal progress and deadlines for their linked children.
  `;
  elements.userDashboard.appendChild(summary);

  if (!linkedYouth.length) {
    const empty = document.createElement("section");
    empty.className = "form-card goal-list-empty";
    empty.innerHTML = `
      <h3>No youth linked yet</h3>
      <p class="subgoal-meta">A bishop or Youth leader can link your parent profile to your youth from the youth account editor.</p>
    `;
    elements.userDashboard.appendChild(empty);
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "parent-child-grid";
  linkedYouth.forEach(({ youth, link }) => {
    wrap.appendChild(buildParentYouthCard(youth, link.relationship));
  });
  elements.userDashboard.appendChild(wrap);
}

function getWardOverviewRows() {
  const wardKeys = new Map();
  state.wards.forEach((ward) => {
    const key = normalizeWardKey(ward.name);
    if (key && !wardKeys.has(key)) {
      wardKeys.set(key, ward.name);
    }
  });

  state.users.forEach((user) => {
    if (!user.ward || user.role === "administrator") {
      return;
    }

    const key = normalizeWardKey(user.ward);
    if (!key) {
      return;
    }

    if (!wardKeys.has(key)) {
      wardKeys.set(key, user.ward);
    }
  });

  return Array.from(wardKeys.entries())
    .map(([wardKey, wardName]) => {
      const usersInWard = state.users.filter((user) => user.role !== "administrator" && normalizeWardKey(user.ward) === wardKey);
      const youth = usersInWard.filter((user) => user.role === "youth");
      const youthIds = new Set(youth.map((user) => user.id));
      const leaders = usersInWard.filter((user) => user.role === "youth_leader");
      const bishops = usersInWard.filter((user) => user.role === "bishop");
      const parents = usersInWard.filter((user) => user.role === "parent");
      const goals = state.goals.filter((goal) => youthIds.has(goal.userId));
      const stake = getStakeForWardName(wardName);

      return {
        wardKey,
        wardName,
        stakeName: stake?.name || "Default Stake",
        bishops,
        leaders,
        parents,
        youth,
        goals
      };
    })
    .sort((left, right) => left.wardName.localeCompare(right.wardName));
}

function getBishopOptions() {
  return state.users
    .filter((user) => user.role === "bishop")
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function createAdminWard(event) {
  event.preventDefault();
  const sessionUser = getSessionUser();
  if (!isGlobalAdmin(sessionUser)) {
    return;
  }

  const form = event.currentTarget;
  const wardName = form.elements.wardName.value.trim();
  const stakeName = form.elements.stakeName.value.trim();
  if (!wardName) {
    window.alert("Please enter a ward name.");
    return;
  }

  if (findWardByName(wardName)) {
    window.alert("That ward already exists.");
    return;
  }

  const ward = {
    id: createId("ward"),
    name: wardName,
    stakeName: stakeName || "Default Stake"
  };

  try {
    const nextState = await backendClient.createWard(STORAGE_KEY, state, {
      ward,
      createdBy: sessionUser.id,
      fallbackState: getFallbackState()
    });
    applyBackendState(nextState);
    saveState();
    activeAdminDashboardView = "ward-management";
    form.reset();
    render();
  } catch (error) {
    console.warn("Ward creation failed.", error);
    window.alert(error?.message || "The ward could not be created right now.");
  }
}

async function createAdminBishop(event) {
  event.preventDefault();
  const sessionUser = getSessionUser();
  if (!isGlobalAdmin(sessionUser)) {
    return;
  }

  const form = event.currentTarget;
  const name = form.elements.bishopName.value.trim();
  const email = form.elements.bishopEmail.value.trim().toLowerCase();
  const wardName = form.elements.bishopWard.value;
  const password = form.elements.bishopPassword.value;

  if (!name || !email || !wardName || !password) {
    window.alert("Please complete bishop name, email, ward, and password.");
    return;
  }

  if (state.users.some((user) => String(user.email || "").toLowerCase() === email)) {
    window.alert("That email already has an account.");
    return;
  }

  const bishop = {
    id: createId("bishop"),
    role: "bishop",
    name,
    email,
    password,
    ward: wardName,
    organization: "all",
    approvalStatus: "verified"
  };

  try {
    const nextState = await backendClient.createBishopAccount(STORAGE_KEY, state, {
      user: bishop,
      password,
      createdBy: sessionUser.id,
      fallbackState: getFallbackState()
    });
    applyBackendState(nextState);
    saveState();
    activeAdminDashboardView = "ward-management";
    form.reset();
    render();
  } catch (error) {
    console.warn("Bishop creation failed.", error);
    window.alert(error?.message || "The bishop profile could not be created right now.");
  }
}

async function assignAdminBishopWard(event) {
  event.preventDefault();
  const sessionUser = getSessionUser();
  if (!isGlobalAdmin(sessionUser)) {
    return;
  }

  const form = event.currentTarget;
  const bishopId = form.elements.assignBishopId.value;
  const wardName = form.elements.assignWardName.value;
  const bishop = state.users.find((user) => user.id === bishopId && user.role === "bishop");

  if (!bishop || !wardName) {
    window.alert("Please choose a bishop and ward.");
    return;
  }

  const updatedBishop = {
    ...bishop,
    ward: wardName
  };

  try {
    const nextState = await backendClient.assignBishopWard(STORAGE_KEY, state, {
      user: updatedBishop,
      wardName,
      updatedBy: sessionUser.id,
      fallbackState: getFallbackState()
    });
    applyBackendState(nextState);
    saveState();
    activeAdminDashboardView = "ward-management";
    form.reset();
    render();
  } catch (error) {
    console.warn("Bishop ward assignment failed.", error);
    window.alert(error?.message || "The bishop ward assignment could not be saved right now.");
  }
}

function formatAdminNameList(users, emptyText = "None assigned") {
  if (!users.length) {
    return `<span class="subgoal-meta">${emptyText}</span>`;
  }

  return users
    .map((user) => {
      const status = user.role === "youth_leader" ? ` (${user.approvalStatus || "verified"})` : "";
      return `<span class="admin-person-line">${escapeHtml(user.name)}${status}</span>`;
    })
    .join("");
}

function buildAdministratorDashboardNav() {
  const nav = document.createElement("div");
  nav.className = "admin-dashboard-nav";
  const buttons = [
    ["overview", "Overview", "All wards and leader access"],
    ["ward-management", "Ward Management", "Create wards and assign bishops"]
  ];

  nav.innerHTML = buttons.map(([view, label, meta]) => `
    <button class="admin-nav-button${activeAdminDashboardView === view ? " active" : ""}" type="button" data-admin-view="${view}">
      <strong>${label}</strong>
      <span>${meta}</span>
    </button>
  `).join("");
  nav.querySelectorAll("[data-admin-view]").forEach((button) => {
    button.addEventListener("click", () => setActiveAdminDashboardView(button.dataset.adminView));
  });
  return nav;
}

function buildWardManagementView() {
  const section = document.createElement("section");
  section.className = "admin-overview-section";
  const wardOptions = state.wards
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((ward) => `<option value="${escapeHtml(ward.name)}">${escapeHtml(ward.name)}</option>`)
    .join("");
  const bishopOptions = getBishopOptions()
    .map((bishop) => `<option value="${bishop.id}">${escapeHtml(bishop.name)} (${escapeHtml(bishop.ward || "No ward")})</option>`)
    .join("");
  const wardRows = getWardOverviewRows();

  section.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="eyebrow">Administrator</p>
        <h3>Ward management</h3>
      </div>
      <div class="session-badge">${state.wards.length} wards</div>
    </div>
    <div class="admin-management-grid">
      <form class="form-card inline-form" id="createAdminWardForm">
        <h3>Create ward</h3>
        <label>Ward name
          <input name="wardName" type="text" placeholder="Cedar Ridge Ward" required>
        </label>
        <label>Stake name
          <input name="stakeName" type="text" placeholder="Mapleton Stake" required>
        </label>
        <button type="submit">Create Ward</button>
      </form>
      <form class="form-card inline-form" id="createAdminBishopForm">
        <h3>Create bishop profile</h3>
        <label>Bishop name
          <input name="bishopName" type="text" placeholder="Bishop Anderson" required>
        </label>
        <label>Email
          <input name="bishopEmail" type="email" placeholder="bishop@example.com" required>
        </label>
        <label>Password
          <input name="bishopPassword" type="password" required>
        </label>
        <label>Assigned ward
          <select name="bishopWard" required>${wardOptions}</select>
        </label>
        <button type="submit"${wardOptions ? "" : " disabled"}>Create Bishop</button>
      </form>
      <form class="form-card inline-form" id="assignAdminBishopWardForm">
        <h3>Assign bishop to ward</h3>
        <label>Bishop
          <select name="assignBishopId" required>${bishopOptions}</select>
        </label>
        <label>Ward
          <select name="assignWardName" required>${wardOptions}</select>
        </label>
        <button type="submit"${bishopOptions && wardOptions ? "" : " disabled"}>Assign Bishop</button>
      </form>
    </div>
    <div class="admin-ward-list">
      ${wardRows.map((ward) => `
        <section class="form-card admin-ward-card">
          <div class="panel-header">
            <div>
              <p class="eyebrow">${escapeHtml(ward.stakeName)}</p>
              <h3>${escapeHtml(ward.wardName)}</h3>
            </div>
            <div class="session-badge">${ward.bishops.length} bishops</div>
          </div>
          <div class="admin-ward-grid">
            <div>
              <h4>Bishops</h4>
              ${formatAdminNameList(ward.bishops)}
            </div>
            <div>
              <h4>Assigned people</h4>
              <span class="admin-person-line">${ward.leaders.length} Youth leaders</span>
              <span class="admin-person-line">${ward.parents.length} parents</span>
              <span class="admin-person-line">${ward.youth.length} youth</span>
            </div>
          </div>
        </section>
      `).join("") || "<section class=\"form-card goal-list-empty\"><h3>No wards yet</h3><p class=\"subgoal-meta\">Create the first ward to begin assigning bishops.</p></section>"}
    </div>
  `;

  section.querySelector("#createAdminWardForm")?.addEventListener("submit", createAdminWard);
  section.querySelector("#createAdminBishopForm")?.addEventListener("submit", createAdminBishop);
  section.querySelector("#assignAdminBishopWardForm")?.addEventListener("submit", assignAdminBishopWard);
  return section;
}

function renderAdministratorDashboard(sessionUser) {
  const wardRows = getWardOverviewRows();
  const bishops = state.users.filter((user) => user.role === "bishop");
  const leaders = state.users.filter((user) => user.role === "youth_leader");
  const parents = state.users.filter((user) => user.role === "parent");
  const youth = state.users.filter((user) => user.role === "youth");
  const pendingLeaders = leaders.filter((user) => user.approvalStatus !== "approved");

  elements.dashboardTitle.textContent = `${sessionUser.name}'s administrator overview`;
  elements.leaderDashboard.innerHTML = "";
  elements.leaderDashboard.appendChild(buildAdministratorDashboardNav());

  if (activeAdminDashboardView === "ward-management") {
    elements.leaderDashboard.appendChild(buildWardManagementView());
    return;
  }

  const summary = document.createElement("section");
  summary.className = "admin-overview-summary";
  summary.innerHTML = `
    <article class="leader-summary"><strong>${wardRows.length}</strong><br>wards</article>
    <article class="leader-summary"><strong>${bishops.length}</strong><br>bishops</article>
    <article class="leader-summary"><strong>${leaders.length}</strong><br>Youth leaders</article>
    <article class="leader-summary"><strong>${pendingLeaders.length}</strong><br>leaders pending or disabled</article>
    <article class="leader-summary"><strong>${parents.length}</strong><br>parents</article>
    <article class="leader-summary"><strong>${youth.length}</strong><br>youth</article>
  `;
  elements.leaderDashboard.appendChild(summary);

  const wardList = document.createElement("div");
  wardList.className = "admin-ward-list";

  if (!wardRows.length) {
    const empty = document.createElement("section");
    empty.className = "form-card goal-list-empty";
    empty.innerHTML = "<h3>No wards yet</h3><p class=\"subgoal-meta\">Wards will appear here after bishops, Youth leaders, parents, or youth are created.</p>";
    elements.leaderDashboard.appendChild(empty);
    return;
  }

  wardRows.forEach((ward) => {
    const approvedLeaders = ward.leaders.filter((leader) => leader.approvalStatus === "approved");
    const pendingWardLeaders = ward.leaders.filter((leader) => leader.approvalStatus !== "approved");
    const card = document.createElement("section");
    card.className = "form-card admin-ward-card";
    card.innerHTML = `
      <div class="panel-header">
        <div>
          <p class="eyebrow">Ward</p>
          <h3>${escapeHtml(ward.wardName)}</h3>
        </div>
        <div class="session-badge">${ward.youth.length} youth</div>
      </div>
      <div class="admin-ward-grid">
        <div>
          <h4>Bishops</h4>
          ${formatAdminNameList(ward.bishops)}
        </div>
        <div>
          <h4>Approved Youth Leaders</h4>
          ${formatAdminNameList(approvedLeaders)}
        </div>
        <div>
          <h4>Pending / Disabled Leaders</h4>
          ${formatAdminNameList(pendingWardLeaders)}
        </div>
        <div>
          <h4>Counts</h4>
          <span class="admin-person-line">${ward.parents.length} parents</span>
          <span class="admin-person-line">${ward.goals.length} goals</span>
        </div>
      </div>
    `;
    wardList.appendChild(card);
  });

  elements.leaderDashboard.appendChild(wardList);
}

function buildTemplateWorkspace(template) {
  const sessionUser = getSessionUser();
  const isCreatingTemplate = activeTemplateId === NEW_TEMPLATE_ID;
  const canAssignTemplate = Boolean(template && template.templateApproved !== false && sessionUser && isWardAdmin(sessionUser));
  const canApproveTemplate = Boolean(template && template.templateApproved === false && sessionUser && isWardAdmin(sessionUser));
  const managedYouthOptions = canAssignTemplate
    ? getManagedYouth(sessionUser).map((user) => `<option value="${user.id}">${user.name} (${getOrganizationLabel(user.organization)})</option>`).join("")
    : "";
  const card = document.createElement("section");
  card.className = "template-workspace";
  const templateListMarkup = state.templates.map((item) => `
    <button class="template-list-item${template && item.id === template.id ? " active" : ""}" type="button" data-template-id="${item.id}">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${item.subGoals.length} checklist item${item.subGoals.length === 1 ? "" : "s"} - ${item.templateApproved === false ? "Pending review" : "Approved"}</span>
    </button>
  `).join("");
  const createTemplateMarkup = `
    <form class="inline-form template-create-form" id="createTemplateForm">
      <div class="panel-header">
        <div>
          <p class="eyebrow">New Template</p>
          <h3>Create A Goal Template</h3>
        </div>
      </div>
      <label>
        <span>Template title</span>
        <input name="templateTitle" type="text" placeholder="Example: 90-day reading challenge" required>
      </label>
      <label>
        <span>Template summary</span>
        <textarea name="templateSummary" placeholder="Describe what this goal template is for." required></textarea>
      </label>
      <label>
        <span>Default category</span>
        <select name="templateCategory">${buildCategoryOptions("spiritual")}</select>
      </label>
      <label>
        <span>Default difficulty</span>
        <select name="templateDifficulty">${buildDifficultyOptions("medium")}</select>
      </label>
      <div class="draft-builder">
        <div class="draft-builder-grid">
          <label>
            <span>Checklist item description</span>
            <input name="newSubGoalTitle" type="text" placeholder="Example: Read 20 minutes a day">
          </label>
          <label>
            <span>Quantity</span>
            <input name="newSubGoalRepeatCount" type="number" min="1" step="1" value="1">
          </label>
        </div>
        <button class="secondary-button" type="button" id="addTemplateChecklistItemButton">Add Checklist Item</button>
        <input name="goalSubGoalsData" type="hidden" value="[]">
        <div class="draft-checklist-list"></div>
      </div>
      <button class="primary-button" type="submit">Save Template</button>
    </form>
  `;
  const editorMarkup = isCreatingTemplate ? createTemplateMarkup : template ? `
    <form class="inline-form template-edit-form">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Template Editor</p>
          <h3>${escapeHtml(template.title)}</h3>
        </div>
        <div class="session-badge">${template.templateApproved === false ? "Pending Review" : "Approved"}</div>
      </div>
      ${template.templateApproved === false ? `<p class="subgoal-meta">This optional goal can be edited now, but youth cannot use it until a bishop or Youth leader approves it.</p>` : ""}
      <label>
        <span>Template title</span>
        <input name="editTemplateTitle" type="text" value="${template.title.replace(/"/g, "&quot;")}">
      </label>
      <label>
        <span>Template summary</span>
        <textarea name="editTemplateSummary">${template.summary}</textarea>
      </label>
      <label>
        <span>Default category</span>
        <select name="editTemplateCategory">${buildCategoryOptions(template.category)}</select>
      </label>
      <label>
        <span>Default difficulty</span>
        <select name="editTemplateDifficulty">${buildDifficultyOptions(template.difficulty)}</select>
      </label>
      <div class="editable-subgoal-list">
        ${buildEditableSubgoalRows(template.subGoals)}
      </div>
      ${canAssignTemplate ? `
      <div class="draft-builder-grid">
        <label>
          <span>Copy template to youth</span>
          <select class="template-user-select" name="templateAssignTarget">
            <option value="">Choose youth</option>
            ${managedYouthOptions}
          </select>
        </label>
        <div class="template-action-wrap">
          <button class="secondary-button" type="button" data-action="assign-template">Copy Goal To Youth</button>
        </div>
      </div>
      ` : ""}
      ${canApproveTemplate ? `<button class="secondary-button" type="button" data-action="approve-template">Approve Optional Goal</button>` : ""}
      <button class="primary-button" type="submit">Save Template Changes</button>
    </form>
  ` : `
    <div class="template-empty-state">
      <p class="eyebrow">Template Editor</p>
      <h3>No template selected</h3>
      <p>Select a template from the list to edit it, or choose Create New Template.</p>
    </div>
  `;

  card.innerHTML = `
    <div class="form-card template-editor-card">
      ${editorMarkup}
    </div>
    <aside class="form-card template-sidebar">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Existing Templates</p>
          <h3>Template List</h3>
        </div>
        <button class="secondary-button" type="button" data-action="new-template">Create New Template</button>
      </div>
      <div class="template-list">
        ${templateListMarkup}
      </div>
    </aside>
  `;

  const form = card.querySelector(".template-edit-form");
  if (form && template) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      updateTemplateDetails(template.id, form);
    });
    form.querySelector("[data-action='assign-template']")?.addEventListener("click", () => {
      assignTemplateToUser(template.id, form.elements.templateAssignTarget.value);
    });
    form.querySelector("[data-action='approve-template']")?.addEventListener("click", () => {
      approveTemplateForUse(template.id);
    });
  }
  const createForm = card.querySelector("#createTemplateForm");
  if (createForm) {
    createForm.addEventListener("submit", createTemplate);
    createForm.querySelector("#addTemplateChecklistItemButton").addEventListener("click", () => addDraftChecklistItem(createForm));
    renderDraftChecklistItems(createForm);
  }
  card.querySelector("[data-action='new-template']").addEventListener("click", () => {
    activeTemplateId = NEW_TEMPLATE_ID;
    render();
  });
  card.querySelectorAll("[data-template-id]").forEach((button) => {
    button.addEventListener("click", () => {
      activeTemplateId = button.dataset.templateId;
      render();
    });
  });

  return card;
}

function buildAdminDashboardNav(sessionUser, counts = {}) {
  const nav = document.createElement("div");
  nav.className = "admin-dashboard-nav";
  const buttons = [
    ["overview", "Overview", "Youth progress cards"],
    ["create-goal", "Create Goal For Youth", "Assign a new goal"],
    ["create-youth", "Create Youth Account", "Add a youth"],
    ["import-youth", "Import Ward List", "Create youth from CSV"],
    ["create-template", "Create Goal Template", "Start a reusable goal"],
    ["templates", "Template Editor", "Edit and assign templates"],
    ["goals", "Review Goals", `${counts.readyCount || 0} ready, ${counts.pendingPlanCount || 0} plans`]
  ];

  if (sessionUser.role === "bishop") {
    buttons.push(["required-goals", "Required Goals & Levels", "Set required goals and counts"]);
    buttons.push(["ward-approval", "Ward Approval", `${counts.pendingLeaderCount || 0} leaders waiting`]);
  }

  nav.innerHTML = buttons.map(([view, label, meta]) => `
    <button class="admin-nav-button${activeAdminDashboardView === view ? " active" : ""}" type="button" data-admin-view="${view}">
      <strong>${label}</strong>
      <span>${meta}</span>
    </button>
  `).join("");
  nav.querySelectorAll("[data-admin-view]").forEach((button) => {
    button.addEventListener("click", () => setActiveAdminDashboardView(button.dataset.adminView));
  });
  return nav;
}

function buildManagedYouthOverview(sessionUser, managedYouth) {
  const section = document.createElement("section");
  section.className = "admin-overview-section";
  const title = sessionUser.role === "bishop" ? "Youth in this ward" : "Youth you serve";

  section.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="eyebrow">Dashboard</p>
        <h3>${title}</h3>
      </div>
      <div class="session-badge">${managedYouth.length}</div>
    </div>
    <div class="managed-youth-grid"></div>
  `;

  const grid = section.querySelector(".managed-youth-grid");
  if (!managedYouth.length) {
    grid.innerHTML = `<div class="empty-state">No youth accounts are available yet.</div>`;
    return section;
  }

  managedYouth.forEach((youth) => {
    const youthGoals = getOrderedYouthGoals(youth.id);
    const levelProgress = getYouthLevelProgress(youth);
    const parentLinks = getParentsForYouth(youth.id);
    const parentSummary = parentLinks.length
      ? parentLinks.map(({ parent }) => parent.name).join(", ")
      : "No parents linked";
    const loginLabel = youth.loginStatus === "not_invited"
      ? "Login not set up"
      : youth.loginStatus === "invitation_ready"
        ? "Email ready"
        : "Login ready";
    const quickActions = [
      !parentLinks.length ? `<button class="secondary-button compact-card-button" type="button" data-link-parent-id="${youth.id}">Link Parent</button>` : "",
      youth.loginStatus !== "verified"
        ? `<button class="secondary-button compact-card-button" type="button" data-add-email-id="${youth.id}">${youth.email ? "Manage Email" : "Add Email"}</button>`
        : ""
    ].filter(Boolean).join("");
    const card = document.createElement("article");
    card.className = "managed-youth-card";
    card.innerHTML = `
      <div class="managed-youth-card-header">
        <div>
          <h4>${escapeHtml(youth.name)}</h4>
          <p class="subgoal-meta">${getOrganizationLabel(youth.organization)} · ${loginLabel}</p>
          <p class="subgoal-meta">Parents: ${escapeHtml(parentSummary)}</p>
        </div>
        <div class="session-badge">${youthGoals.length} goals</div>
      </div>
      <div class="managed-youth-card-actions">
        ${quickActions}
        <button class="secondary-button compact-card-button" type="button" data-edit-youth-id="${youth.id}">Edit Youth Account</button>
      </div>
      <div class="youth-level-progress">
        <div class="youth-level-progress-header">
          <div>
            <span class="subgoal-meta">Current level</span>
            <strong>${escapeHtml(levelProgress.currentLevelLabel)}</strong>
          </div>
          <span class="session-badge">${levelProgress.difficultyCounts.total} goals</span>
        </div>
        <div class="youth-level-progress-next">
          <span class="subgoal-meta">Next: ${escapeHtml(levelProgress.nextLevelLabel)}</span>
          <span class="subgoal-meta">${escapeHtml(levelProgress.nextProgressLabel)}</span>
        </div>
        ${levelProgress.requiredGoalProgress.requiredCount ? `
          <div class="youth-level-progress-next">
            <span class="subgoal-meta">Required goals</span>
            <span class="subgoal-meta">${levelProgress.requiredGoalProgress.completedCount}/${levelProgress.requiredGoalProgress.requiredCount} complete</span>
          </div>
        ` : ""}
        <div class="mini-progress-bar youth-level-progress-bar" aria-label="${levelProgress.nextPercent}% toward ${escapeHtml(levelProgress.nextLevelLabel)}">
          <div class="mini-progress-fill" style="width:${levelProgress.nextPercent}%"></div>
        </div>
      </div>
      <div class="youth-goal-progress-list">
        ${youthGoals.length ? youthGoals.map((goal, index) => {
          const progress = getGoalProgress(goal);
          const status = getGoalStatus(goal);
          const canApprovePlan = !goal.goalApproved && !isGoalClosed(goal);
          return `
            <div class="youth-goal-progress-row">
              <div class="youth-goal-progress-copy">
                <strong><span class="goal-number-chip">${index + 1}</span><span class="goal-progress-title">${escapeHtml(goal.title)}</span></strong>
                <span class="subgoal-meta">${status.label}</span>
              </div>
              <div class="youth-goal-progress-controls">
                <div class="mini-progress-wrap" aria-label="${progress}% complete">
                  <div class="mini-progress-bar"><div class="mini-progress-fill" style="width:${progress}%"></div></div>
                  <span>${progress}%</span>
                </div>
                ${canApprovePlan ? `<button class="secondary-button compact-card-button" type="button" data-approve-card-goal-id="${goal.id}">Approve Goal</button>` : ""}
                <button class="ghost-button compact-card-button" type="button" data-edit-card-goal-id="${goal.id}">Edit Goal</button>
              </div>
            </div>
          `;
        }).join("") : `<p class="subgoal-meta">No goals assigned yet.</p>`}
      </div>
    `;
    card.querySelector("[data-edit-youth-id]").addEventListener("click", () => openYouthAccountEditor(youth.id));
    card.querySelector("[data-link-parent-id]")?.addEventListener("click", () => openYouthAccountEditor(youth.id));
    card.querySelector("[data-add-email-id]")?.addEventListener("click", () => openYouthAccountEditor(youth.id));
    card.querySelectorAll("[data-approve-card-goal-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const pendingGoal = state.goals.find((item) => item.id === button.dataset.approveCardGoalId);
        approveGoalPlan(button.dataset.approveCardGoalId, pendingGoal ? pendingGoal.difficulty : "medium");
      });
    });
    card.querySelectorAll("[data-edit-card-goal-id]").forEach((button) => {
      button.addEventListener("click", () => openGoalEditor(button.dataset.editCardGoalId));
    });
    grid.appendChild(card);
  });

  return section;
}

function buildAdminSummaryCards(sessionUser, goals, managedYouth, approvedLeaders = [], pendingLeaders = []) {
  const approvedCount = goals.filter((goal) => goal.leaderApproved).length;
  const readyCount = goals.filter((goal) => goal.goalApproved && getGoalProgress(goal) === 100 && !goal.leaderApproved).length;
  const pendingPlanCount = goals.filter((goal) => !goal.goalApproved).length;
  const requiredGoalCount = (state.requiredLevelGoals || []).filter((goal) => isSameWard(goal.ward, sessionUser.ward)).length;
  const wrap = document.createElement("div");
  wrap.className = "admin-summary-grid";
  const wardCard = sessionUser.role === "bishop"
    ? `
      <section class="leader-summary">
        <strong>${managedYouth.length}</strong> youth in ${sessionUser.ward}
        <br>
        <strong>${approvedLeaders.length}</strong> approved Youth leaders
        <br>
        <strong>${pendingLeaders.length}</strong> Youth leaders waiting for bishop approval
      </section>
      <section class="leader-summary">
        <strong>${requiredGoalCount}</strong> required level goals
        <br>
        <span>Set required goals and level counts by Physical, Spiritual, Intellectual, and Social.</span>
        <br>
        <button class="secondary-button" type="button" data-action="open-required-goals">Manage Required Goals</button>
      </section>
    `
    : "";
  wrap.innerHTML = `
    ${wardCard}
    <section class="leader-summary">
      <strong>${approvedCount}</strong> goals approved
      <br>
      <strong>${readyCount}</strong> goals waiting for Youth leader sign-off
      <br>
      <strong>${pendingPlanCount}</strong> goals waiting for goal approval
    </section>
  `;
  wrap.querySelector("[data-action='open-required-goals']")?.addEventListener("click", () => setActiveAdminDashboardView("required-goals"));
  return wrap;
}

function buildManagedGoalForm(youthOptions, templateOptions) {
  const managedGoalForm = document.createElement("section");
  managedGoalForm.className = "form-card admin-workflow-card";
  managedGoalForm.innerHTML = `
    <h3>Create a goal for youth</h3>
    <form class="inline-form" id="createManagedGoalForm">
      <label>
        <span>Youth</span>
        <select name="targetYouthId">
          <option value="">Choose a youth</option>
          ${youthOptions}
        </select>
      </label>
      <div class="draft-builder-grid">
        <label>
          <span>Start from template</span>
          <select name="goalTemplateId">
            <option value="">Blank goal</option>
            ${templateOptions}
          </select>
        </label>
        <div class="template-action-wrap">
          <button class="secondary-button" type="button" id="copyFromTemplateButton">Copy From Template</button>
        </div>
      </div>
      <label>
        <span>Goal title</span>
        <input name="goalTitle" type="text" placeholder="Example: 60-day service challenge" required>
      </label>
      <label>
        <span>Goal summary</span>
        <textarea name="goalSummary" placeholder="Describe what success looks like." required></textarea>
      </label>
      <label>
        <span>Category</span>
        <select name="goalCategory">${buildCategoryOptions("spiritual")}</select>
      </label>
      <label>
        <span>Difficulty</span>
        <select name="goalDifficulty">${buildDifficultyOptions("medium")}</select>
      </label>
      <label>
        <span>Deadline</span>
        <input name="goalDeadline" type="date" value="${getDefaultGoalDeadline()}" min="${getTodayDateString()}" required>
      </label>
      <div class="draft-builder">
        <div class="draft-builder-grid">
          <label>
            <span>Checklist item description</span>
            <input name="newSubGoalTitle" type="text" placeholder="Example: Offer daily prayer">
          </label>
          <label>
            <span>Quantity</span>
            <input name="newSubGoalRepeatCount" type="number" min="1" step="1" value="1">
          </label>
        </div>
        <button class="secondary-button" type="button" id="addManagedGoalChecklistItemButton">Add Checklist Item</button>
        <input name="goalSubGoalsData" type="hidden" value="[]">
        <div class="draft-checklist-list"></div>
      </div>
      <button class="primary-button" type="submit">Create Goal For Youth</button>
    </form>
  `;
  const createManagedGoalForm = managedGoalForm.querySelector("#createManagedGoalForm");
  createManagedGoalForm.addEventListener("submit", createManagedGoal);
  createManagedGoalForm.querySelector("#copyFromTemplateButton").addEventListener("click", () => {
    syncGoalFormFromTemplate(createManagedGoalForm, createManagedGoalForm.elements.goalTemplateId.value);
  });
  createManagedGoalForm.querySelector("#addManagedGoalChecklistItemButton").addEventListener("click", () => addDraftChecklistItem(createManagedGoalForm));
  renderDraftChecklistItems(createManagedGoalForm);
  return managedGoalForm;
}

function buildYouthAccountForm(organizationOptions) {
  const youthAccountForm = document.createElement("section");
  youthAccountForm.className = "form-card admin-workflow-card";
  youthAccountForm.innerHTML = `
    <h3>Create a youth account</h3>
    <form class="inline-form" id="createYouthAccountForm">
      <label>
        <span>Youth full name</span>
        <input name="youthName" type="text" placeholder="Enter youth full name" required>
      </label>
      <label>
        <span>Youth email optional</span>
        <input name="youthEmail" type="email" placeholder="Add later if needed">
      </label>
      <label>
        <span>Organization</span>
        <select name="youthOrganization">
          ${organizationOptions}
        </select>
      </label>
      <label class="checkbox-label">
        <input name="youthCompetitionOptIn" type="checkbox" checked>
        <span>Include on ward and stake leaderboards</span>
      </label>
      <label>
        <span>Temporary password optional</span>
        <input name="youthPassword" type="password" placeholder="Only needed if creating login now">
      </label>
      <p class="subgoal-meta">Youth profiles can be created without login credentials. Add an email later when you are ready to invite them.</p>
      <button class="primary-button" type="submit">Create Youth Account</button>
    </form>
  `;
  youthAccountForm.querySelector("#createYouthAccountForm").addEventListener("submit", createYouthAccount);
  return youthAccountForm;
}

function buildYouthRosterImportForm(organizationOptions) {
  const importForm = document.createElement("section");
  importForm.className = "form-card admin-workflow-card";
  importForm.innerHTML = `
    <h3>Import ward list</h3>
    <form class="inline-form" id="importYouthRosterForm">
      <label>
        <span>CSV file</span>
        <input name="rosterFile" type="file" accept=".csv,.txt,text/csv,text/plain">
      </label>
      <label>
        <span>Default organization</span>
        <select name="defaultOrganization">
          ${organizationOptions}
        </select>
      </label>
      <label>
        <span>Roster rows</span>
        <textarea name="rosterData" class="roster-import-textarea" placeholder="Name,Email,Organization&#10;Avery Young,,Young Men&#10;Lena Smith,lena@example.com,Young Women" required></textarea>
      </label>
      <p class="subgoal-meta">Accepted columns include Name, Full Name, Preferred Name, First Name, Last Name, Email, Organization, Gender, or Sex. Rows without email are created as profiles only.</p>
      <button class="primary-button" type="submit">Import Youth Profiles</button>
    </form>
  `;

  const form = importForm.querySelector("#importYouthRosterForm");
  form.addEventListener("submit", importYouthRoster);
  form.elements.rosterFile.addEventListener("change", () => {
    const file = form.elements.rosterFile.files?.[0];
    if (!file) {
      return;
    }
    if (!/\.csv$|\.txt$/i.test(file.name)) {
      window.alert("Please save the ward list as CSV before importing.");
      form.elements.rosterFile.value = "";
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      form.elements.rosterData.value = String(reader.result || "");
    });
    reader.readAsText(file);
  });
  return importForm;
}

async function assignRequiredGoalDefinitionToArrivedYouth(requiredGoal, sessionUser) {
  const managedYouth = getManagedYouth(sessionUser).filter((youth) => isSameWard(youth.ward, requiredGoal.ward));
  for (const youth of managedYouth) {
    const currentLevel = Math.min(getYouthCompletedAttainmentLevels(youth) + 1, LEVEL_POINT_REQUIREMENTS.length);
    if (currentLevel === Number(requiredGoal.level)) {
      await assignMissingRequiredGoalsForYouth(youth, requiredGoal.level, sessionUser.id);
    }
  }
}

async function backfillRequiredGoalsForManagedYouth() {
  const sessionUser = getSessionUser();
  if (!sessionUser || sessionUser.role !== "bishop") {
    return;
  }

  let assignedCount = 0;
  for (const youth of getManagedYouth(sessionUser)) {
    assignedCount += await assignRequiredGoalsForCurrentAttainment(youth, sessionUser.id);
  }
  window.alert(`Assigned ${assignedCount} missing required goal${assignedCount === 1 ? "" : "s"}.`);
  render();
}

async function createRequiredLevelGoal(event) {
  event.preventDefault();
  const sessionUser = getSessionUser();
  if (!sessionUser || sessionUser.role !== "bishop") {
    return;
  }

  const form = event.currentTarget;
  const subGoals = readDraftChecklistItems(form);
  const requiredGoal = {
    id: createId("required-goal"),
    ward: sessionUser.ward,
    level: Number(form.elements.requiredGoalLevel.value),
    title: form.elements.requiredGoalTitle.value.trim(),
    summary: form.elements.requiredGoalSummary.value.trim(),
    points: 0,
    category: normalizeGoalCategory(form.elements.requiredGoalCategory?.value || "spiritual"),
    difficulty: normalizeDifficulty(form.elements.requiredGoalDifficulty?.value || "medium"),
    deadlineDays: Math.max(1, Number(form.elements.requiredGoalDeadlineDays.value || 30)),
    subGoals: subGoals.map((item) => ({
      id: createId("required-subgoal"),
      title: item.title,
      repeatCount: item.repeatCount
    }))
  };

  if (!requiredGoal.title || !requiredGoal.summary || !requiredGoal.subGoals.length) {
    window.alert("Required goals need a title, summary, and at least one checklist item.");
    return;
  }

  const nextState = await backendClient.createRequiredLevelGoal(STORAGE_KEY, state, {
    requiredGoal,
    createdBy: sessionUser.id,
    fallbackState: getFallbackState()
  });
  applyBackendState(nextState);
  await assignRequiredGoalDefinitionToArrivedYouth(requiredGoal, sessionUser);
  saveState();
  form.reset();
  writeDraftChecklistItems(form, []);
  activeAdminDashboardView = "required-goals";
  render();
}

async function updateRequiredLevelGoal(requiredGoalId, form) {
  const sessionUser = getSessionUser();
  if (!sessionUser || sessionUser.role !== "bishop") {
    return;
  }

  const requiredGoal = (state.requiredLevelGoals || []).find((goal) => goal.id === requiredGoalId && isSameWard(goal.ward, sessionUser.ward));
  if (!requiredGoal) {
    return;
  }

  const subGoals = Array.from(form.querySelectorAll(".editable-subgoal-row")).map((row, index) => ({
    id: requiredGoal.subGoals[index]?.id || createId("required-subgoal"),
    title: row.querySelector("[name='editableSubGoalTitle']").value.trim(),
    repeatCount: parseRepeatCount(row.querySelector("[name='editableSubGoalRepeatCount']").value)
  })).filter((item) => item.title);

  const title = form.elements.editRequiredGoalTitle.value.trim();
  const summary = form.elements.editRequiredGoalSummary.value.trim();
  if (!title || !summary || !subGoals.length) {
    window.alert("Required goals need a title, summary, and at least one checklist item.");
    return;
  }

  requiredGoal.level = Number(form.elements.editRequiredGoalLevel.value);
  requiredGoal.title = title;
  requiredGoal.summary = summary;
  requiredGoal.points = 0;
  requiredGoal.category = normalizeGoalCategory(form.elements.editRequiredGoalCategory?.value || requiredGoal.category);
  requiredGoal.difficulty = normalizeDifficulty(form.elements.editRequiredGoalDifficulty?.value || requiredGoal.difficulty);
  requiredGoal.deadlineDays = Math.max(1, Number(form.elements.editRequiredGoalDeadlineDays.value || 30));
  requiredGoal.subGoals = subGoals;
  const nextState = await backendClient.updateRequiredLevelGoal(STORAGE_KEY, state, {
    requiredGoal,
    updatedBy: sessionUser.id,
    fallbackState: getFallbackState()
  });
  applyBackendState(nextState);
  await assignRequiredGoalDefinitionToArrivedYouth(requiredGoal, sessionUser);
  saveState();
  render();
}

function deleteRequiredLevelGoal(requiredGoalId) {
  const sessionUser = getSessionUser();
  if (!sessionUser || sessionUser.role !== "bishop") {
    return;
  }

  backendClient.deleteRequiredLevelGoal(STORAGE_KEY, state, {
    requiredGoalId,
    deletedBy: sessionUser.id,
    fallbackState: getFallbackState()
  }).then((nextState) => {
    applyBackendState(nextState);
    saveState();
    render();
  }).catch((error) => {
    console.warn("Required goal deletion failed.", error);
    window.alert(error?.message || "The required goal could not be deleted right now.");
  });
}

async function updateLevelGoalRequirements(event) {
  event.preventDefault();
  const sessionUser = getSessionUser();
  if (!sessionUser || sessionUser.role !== "bishop") {
    return;
  }

  const form = event.currentTarget;
  const levelGoalRequirements = getLevelGoalRequirements().map((requirement) => ({
    level: requirement.level,
    categories: CATEGORY_ORDER.reduce((categories, category) => {
      categories[category] = DIFFICULTY_ORDER.reduce((counts, difficulty) => {
        const fieldName = `level${requirement.level}${category}${difficulty}`;
        counts[difficulty] = Math.max(0, Math.floor(Number(form.elements[fieldName]?.value || 0)));
        return counts;
      }, {});
      return categories;
    }, {})
  }));
  const nextState = backendClient.updateLevelGoalRequirements
    ? await backendClient.updateLevelGoalRequirements(STORAGE_KEY, state, {
      levelGoalRequirements,
      updatedBy: sessionUser.id,
      fallbackState: getFallbackState()
    })
    : { ...state, levelGoalRequirements };
  applyBackendState(nextState);
  saveState();
  render();
}

function buildRequiredLevelGoalsView(sessionUser) {
  const section = document.createElement("section");
  section.className = "admin-overview-section";
  const requiredGoals = (state.requiredLevelGoals || [])
    .filter((goal) => isSameWard(goal.ward, sessionUser.ward))
    .sort((left, right) => Number(left.level) - Number(right.level) || left.title.localeCompare(right.title));
  const levelOptions = getLevelGoalMilestones()
    .map((level) => `<option value="${level.index}">${getLevelLabel(level.index)}</option>`)
    .join("");

  section.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="eyebrow">Bishop Only</p>
        <h3>Required Goals & Level Requirements</h3>
        <p class="subgoal-meta">Create required goals for each level and set how many Physical, Spiritual, Intellectual, and Social goals are needed by difficulty.</p>
      </div>
      <div class="admin-action-row">
        <button class="secondary-button" type="button" data-action="backfill-required-goals">Assign Missing To Current Youth</button>
        <div class="session-badge">${requiredGoals.length} required</div>
      </div>
    </div>
    <form class="form-card inline-form" id="createRequiredLevelGoalForm">
      <h3>Create Required Level Goal</h3>
      <p class="subgoal-meta">These goals are automatically assigned to youth when they enter the selected level.</p>
      <label>
        <span>Level</span>
        <select name="requiredGoalLevel">${levelOptions}</select>
      </label>
      <label>
        <span>Category</span>
        <select name="requiredGoalCategory">${buildCategoryOptions("spiritual")}</select>
      </label>
      <label>
        <span>Difficulty</span>
        <select name="requiredGoalDifficulty">${buildDifficultyOptions("medium")}</select>
      </label>
      <label>
        <span>Goal title</span>
        <input name="requiredGoalTitle" type="text" placeholder="Required level goal" required>
      </label>
      <label>
        <span>Goal summary</span>
        <textarea name="requiredGoalSummary" placeholder="Describe the required goal." required></textarea>
      </label>
      <label>
        <span>Days to complete after assignment</span>
        <input name="requiredGoalDeadlineDays" type="number" min="1" step="1" value="30" required>
      </label>
      <div class="draft-builder">
        <div class="draft-builder-grid">
          <label>
            <span>Checklist item description</span>
            <input name="newSubGoalTitle" type="text" placeholder="Example: Meet with the bishop">
          </label>
          <label>
            <span>Quantity</span>
            <input name="newSubGoalRepeatCount" type="number" min="1" step="1" value="1">
          </label>
        </div>
        <button class="secondary-button" type="button" id="addRequiredGoalChecklistItemButton">Add Checklist Item</button>
        <input name="goalSubGoalsData" type="hidden" value="[]">
        <div class="draft-checklist-list"></div>
      </div>
      <button class="primary-button" type="submit">Create Required Goal</button>
    </form>
    <form class="form-card inline-form" id="levelGoalRequirementsForm">
      <h3>Required Counts By Level</h3>
      <p class="subgoal-meta">Set how many approved completed goals are required in each category and difficulty for each level. Required level goals are still separate.</p>
      <div class="level-requirement-grid">
        ${getLevelGoalRequirements().map((requirement) => `
          <section class="level-requirement-card">
            <h4>${getLevelLabel(requirement.level)}</h4>
            ${CATEGORY_ORDER.map((category) => `
              <div class="level-requirement-category">
                <strong>${GOAL_CATEGORIES[category].label}</strong>
                ${DIFFICULTY_ORDER.map((difficulty) => `
                  <label>
                    <span>${getDifficultyLabel(difficulty)}</span>
                    <input name="level${requirement.level}${category}${difficulty}" type="number" min="0" step="1" value="${requirement.categories[category][difficulty]}">
                  </label>
                `).join("")}
              </div>
            `).join("")}
          </section>
        `).join("")}
      </div>
      <button class="primary-button" type="submit">Save Level Requirements</button>
    </form>
    <div class="required-goal-list">
      ${requiredGoals.map((goal) => `
        <form class="form-card inline-form required-goal-card" data-required-goal-id="${goal.id}">
          <div class="panel-header">
            <div>
              <p class="eyebrow">${getLevelLabel(goal.level)}</p>
              <h3>${escapeHtml(goal.title)}</h3>
            </div>
            <div class="session-badge">Required</div>
          </div>
          <label>
            <span>Level</span>
            <select name="editRequiredGoalLevel">
              ${getLevelGoalMilestones().map((level) => `<option value="${level.index}"${Number(goal.level) === level.index ? " selected" : ""}>${getLevelLabel(level.index)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Category</span>
            <select name="editRequiredGoalCategory">${buildCategoryOptions(goal.category)}</select>
          </label>
          <label>
            <span>Difficulty</span>
            <select name="editRequiredGoalDifficulty">${buildDifficultyOptions(goal.difficulty)}</select>
          </label>
          <label>
            <span>Goal title</span>
            <input name="editRequiredGoalTitle" type="text" value="${escapeHtml(goal.title)}" required>
          </label>
          <label>
            <span>Goal summary</span>
            <textarea name="editRequiredGoalSummary" required>${escapeHtml(goal.summary)}</textarea>
          </label>
          <label>
            <span>Days to complete after assignment</span>
            <input name="editRequiredGoalDeadlineDays" type="number" min="1" step="1" value="${goal.deadlineDays}" required>
          </label>
          <div class="editable-subgoal-list">
            ${buildEditableSubgoalRows(goal.subGoals)}
          </div>
          <div class="admin-action-row">
            <button class="danger-button" type="button" data-action="delete-required-goal">Delete</button>
            <button class="primary-button" type="submit">Save Required Goal</button>
          </div>
        </form>
      `).join("") || `<section class="form-card"><h3>No required goals yet</h3><p class="subgoal-meta">Create ${getLevelLabel(1)} goals before adding new youth if you want them assigned immediately.</p></section>`}
    </div>
  `;

  const form = section.querySelector("#createRequiredLevelGoalForm");
  section.querySelector("#levelGoalRequirementsForm").addEventListener("submit", updateLevelGoalRequirements);
  form.addEventListener("submit", createRequiredLevelGoal);
  form.querySelector("#addRequiredGoalChecklistItemButton").addEventListener("click", () => addDraftChecklistItem(form));
  renderDraftChecklistItems(form);
  section.querySelector("[data-action='backfill-required-goals']").addEventListener("click", backfillRequiredGoalsForManagedYouth);
  section.querySelectorAll(".required-goal-card").forEach((card) => {
    const requiredGoalId = card.dataset.requiredGoalId;
    card.addEventListener("submit", (event) => {
      event.preventDefault();
      updateRequiredLevelGoal(requiredGoalId, card);
    });
    card.querySelector("[data-action='delete-required-goal']").addEventListener("click", () => deleteRequiredLevelGoal(requiredGoalId));
  });
  return section;
}

function buildYouthAccountEditor(youth, organizationOptions) {
  const editor = document.createElement("section");
  editor.className = "form-card admin-workflow-card";

  if (!youth) {
    editor.innerHTML = `
      <h3>Edit youth account</h3>
      <p class="leader-summary">Choose a youth from the overview to edit their account.</p>
      <button class="secondary-button" type="button" data-action="back-overview">Back To Overview</button>
    `;
    editor.querySelector("[data-action='back-overview']").addEventListener("click", () => setActiveAdminDashboardView("overview"));
    return editor;
  }

  const loginLabel = youth.loginStatus === "not_invited"
    ? "Login not set up"
    : youth.loginStatus === "invitation_ready"
      ? "Email ready"
      : "Login ready";
  const linkedParents = getParentsForYouth(youth.id);

  editor.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="eyebrow">Youth Account</p>
        <h3>Edit ${escapeHtml(youth.name)}</h3>
      </div>
      <div class="session-badge">${loginLabel}</div>
    </div>
    <form class="inline-form" id="editYouthAccountForm">
      <input name="youthId" type="hidden" value="${escapeHtml(youth.id)}">
      <label>
        <span>Youth full name</span>
        <input name="youthName" type="text" value="${escapeHtml(youth.name)}" required>
      </label>
      <label>
        <span>Youth email optional</span>
        <input name="youthEmail" type="email" value="${escapeHtml(youth.email)}" placeholder="Add later if needed">
      </label>
      <label>
        <span>Organization</span>
        <select name="youthOrganization">
          ${organizationOptions}
        </select>
      </label>
      <p class="subgoal-meta">Adding an email marks this youth as ready for a future login invite. Sending the invite comes in the next buildout.</p>
      <div class="admin-action-row">
        <button class="secondary-button" type="button" data-action="back-overview">Back To Overview</button>
        <button class="primary-button" type="submit">Save Youth Account</button>
      </div>
    </form>
    <div class="parent-link-panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Parents</p>
          <h3>Linked Parents</h3>
        </div>
        <div class="session-badge">${linkedParents.length}</div>
      </div>
      <div class="parent-link-list">
        ${linkedParents.length ? linkedParents.map(({ parent, link }) => `
          <div class="parent-link-row">
            <div>
              <strong>${escapeHtml(parent.name)}</strong>
              <span class="subgoal-meta">${escapeHtml(link.relationship)} - ${getParentLoginLabel(parent)}</span>
              ${parent.email ? `<span class="subgoal-meta">${escapeHtml(parent.email)}</span>` : ""}
            </div>
            <button class="ghost-button" type="button" data-unlink-parent-id="${escapeHtml(parent.id)}">Unlink</button>
          </div>
        `).join("") : `<p class="subgoal-meta">No parents linked yet.</p>`}
      </div>
      <form class="inline-form parent-create-form" id="createParentForYouthForm">
        <input name="youthId" type="hidden" value="${escapeHtml(youth.id)}">
        <div class="draft-builder-grid">
          <label>
            <span>Parent name</span>
            <input name="parentName" type="text" placeholder="Enter parent or guardian name" required>
          </label>
          <label>
            <span>Relationship</span>
            <input name="parentRelationship" type="text" placeholder="Parent" value="Parent">
          </label>
        </div>
        <label>
          <span>Parent email optional</span>
          <input name="parentEmail" type="email" placeholder="Add later if needed">
        </label>
        <label>
          <span>Temporary password optional</span>
          <input name="parentPassword" type="password" placeholder="Only needed if creating login now">
        </label>
        <button class="secondary-button" type="submit">Add Parent To Youth</button>
      </form>
    </div>
  `;

  const form = editor.querySelector("#editYouthAccountForm");
  form.elements.youthOrganization.value = youth.organization;
  form.addEventListener("submit", updateYouthAccount);
  editor.querySelector("[data-action='back-overview']").addEventListener("click", () => setActiveAdminDashboardView("overview"));
  editor.querySelector("#createParentForYouthForm").addEventListener("submit", createParentForYouth);
  editor.querySelectorAll("[data-unlink-parent-id]").forEach((button) => {
    button.addEventListener("click", () => unlinkParentFromYouth(button.dataset.unlinkParentId, youth.id));
  });
  return editor;
}

function buildCreateTemplateForm() {
  const templateForm = document.createElement("section");
  templateForm.className = "form-card admin-workflow-card";
  templateForm.innerHTML = `
    <h3>Create a goal template</h3>
    <form class="inline-form" id="createTemplateForm">
      <label>
        <span>Template title</span>
        <input name="templateTitle" type="text" placeholder="Example: 90-day reading challenge" required>
      </label>
      <label>
        <span>Template summary</span>
        <textarea name="templateSummary" placeholder="Describe what this goal template is for." required></textarea>
      </label>
      <label>
        <span>Default category</span>
        <select name="templateCategory">${buildCategoryOptions("spiritual")}</select>
      </label>
      <label>
        <span>Default difficulty</span>
        <select name="templateDifficulty">${buildDifficultyOptions("medium")}</select>
      </label>
      <div class="draft-builder">
        <div class="draft-builder-grid">
          <label>
            <span>Checklist item description</span>
            <input name="newSubGoalTitle" type="text" placeholder="Example: Read 20 minutes a day">
          </label>
          <label>
            <span>Quantity</span>
            <input name="newSubGoalRepeatCount" type="number" min="1" step="1" value="1">
          </label>
        </div>
        <button class="secondary-button" type="button" id="addTemplateChecklistItemButton">Add Checklist Item</button>
        <input name="goalSubGoalsData" type="hidden" value="[]">
        <div class="draft-checklist-list"></div>
      </div>
      <button class="primary-button" type="submit">Save Template</button>
    </form>
  `;

  const createTemplateForm = templateForm.querySelector("#createTemplateForm");
  createTemplateForm.addEventListener("submit", createTemplate);
  createTemplateForm.querySelector("#addTemplateChecklistItemButton").addEventListener("click", () => addDraftChecklistItem(createTemplateForm));
  renderDraftChecklistItems(createTemplateForm);
  return templateForm;
}

function buildTemplateEditorView() {
  const activeTemplate = getActiveTemplate();
  const templatesWrap = document.createElement("div");
  templatesWrap.className = "template-grid";
  templatesWrap.appendChild(buildTemplateWorkspace(activeTemplate));
  return templatesWrap;
}

function buildWardApprovalView(sessionUser, pendingLeaders, accessUsers = []) {
  const fragment = document.createDocumentFragment();
  const info = document.createElement("section");
  info.className = "form-card";
  info.innerHTML = `
    <h3>Ward approval</h3>
    <p class="leader-summary">Ward is required for every account. Youth leaders and parents only gain access inside this ward while their access is enabled. Automatic Church website verification is not enabled in this browser-only version.</p>
  `;
  fragment.appendChild(info);

  const accessPanel = document.createElement("section");
  accessPanel.className = "form-card";
  accessPanel.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="eyebrow">Access Review</p>
        <h3>Youth Leaders And Parents</h3>
      </div>
      <div class="session-badge">${accessUsers.length}</div>
    </div>
    <div class="access-review-list"></div>
  `;
  const accessList = accessPanel.querySelector(".access-review-list");

  if (!accessUsers.length) {
    accessList.innerHTML = `<div class="empty-state">No Youth leader or parent profiles are available in this ward yet.</div>`;
    fragment.appendChild(accessPanel);
    return fragment;
  }

  accessUsers.forEach((user) => {
    const card = document.createElement("section");
    card.className = "access-review-card";
    const disabled = user.approvalStatus === "rejected";
    const waiting = user.role === "youth_leader" && user.approvalStatus !== "approved" && !disabled;
    const primaryAction = disabled
      ? ["Enable Access", getEnabledStatusForRole(user.role), "primary-button"]
      : waiting
        ? ["Approve Access", "approved", "primary-button"]
        : ["Disable Access", "rejected", "secondary-button"];
    const roleOptions = ["youth", "youth_leader", "parent"]
      .map((role) => `<option value="${role}"${user.role === role ? " selected" : ""}>${getAccountRoleLabel(role)}</option>`)
      .join("");
    const organizationOptions = ["young_men", "young_women"]
      .map((organization) => `<option value="${organization}"${user.organization === organization ? " selected" : ""}>${getOrganizationLabel(organization)}</option>`)
      .join("");
    card.innerHTML = `
      <div class="panel-header">
        <div>
          <p class="eyebrow">${getAccountRoleLabel(user.role)}</p>
          <h3>${escapeHtml(user.name)}</h3>
          <p class="subgoal-meta">${escapeHtml(user.email || "No email set")}${user.role === "parent" ? "" : ` - ${getOrganizationLabel(user.organization)}`}</p>
        </div>
        <div class="session-badge">${getAccessStatusLabel(user)}</div>
      </div>
      <form class="account-type-form" data-account-type-form>
        <input name="userId" type="hidden" value="${escapeHtml(user.id)}">
        <label>
          Account Type
          <select name="accountRole">${roleOptions}</select>
        </label>
        <label>
          Organization
          <select name="accountOrganization">${organizationOptions}</select>
        </label>
        <button class="ghost-button" type="submit">Save Account Type</button>
      </form>
      <div class="admin-action-row"></div>
    `;
    card.querySelector("[data-account-type-form]").addEventListener("submit", (event) => {
      event.preventDefault();
      updateWardAccountType(event.currentTarget);
    });
    const actionRow = card.querySelector(".admin-action-row");
    if (user.role === "youth_leader" || user.role === "parent") {
      const primaryButton = document.createElement("button");
      primaryButton.type = "button";
      primaryButton.className = primaryAction[2];
      primaryButton.textContent = primaryAction[0];
      primaryButton.addEventListener("click", () => updateWardAccessStatus(user.id, primaryAction[1]));
      actionRow.appendChild(primaryButton);

      if (waiting) {
        const disableButton = document.createElement("button");
        disableButton.type = "button";
        disableButton.className = "secondary-button";
        disableButton.textContent = "Disable Access";
        disableButton.addEventListener("click", () => updateWardAccessStatus(user.id, "rejected"));
        actionRow.appendChild(disableButton);
      }
    } else {
      actionRow.innerHTML = `<span class="subgoal-meta">Youth accounts are enabled by default.</span>`;
    }

    accessList.appendChild(card);
  });
  fragment.appendChild(accessPanel);

  return fragment;
}

function renderLeaderDashboard(sessionUser) {
  const goals = state.goals
    .filter((goal) => {
      const owner = state.users.find((user) => user.id === goal.userId);
      return owner && canManageYouth(sessionUser, owner);
    })
    .sort((a, b) => getGoalProgress(b) - getGoalProgress(a));
  const approvedCount = goals.filter((goal) => goal.leaderApproved).length;
  const readyCount = goals.filter((goal) => goal.goalApproved && getGoalProgress(goal) === 100 && !goal.leaderApproved).length;
  const pendingPlanCount = goals.filter((goal) => !goal.goalApproved).length;
  const managedYouth = getManagedYouth(sessionUser);
  const pendingLeaders = sessionUser.role === "bishop" ? getPendingWardLeaders(sessionUser.ward) : [];
  const accessUsers = sessionUser.role === "bishop" ? getWardAccessUsers(sessionUser.ward) : [];
  const approvedLeaders = sessionUser.role === "bishop"
    ? state.users.filter((user) => user.role === "youth_leader" && isSameWard(user.ward, sessionUser.ward) && user.approvalStatus === "approved")
    : [];
  const youthOptions = managedYouth.map((user) => `<option value="${user.id}">${user.name} (${getOrganizationLabel(user.organization)})</option>`).join("");
  const allowedOrganizations = getAllowedOrganizationsForManager(sessionUser);
  const organizationOptions = allowedOrganizations
    .map((organization) => `<option value="${organization}">${getOrganizationLabel(organization)}</option>`)
    .join("");
  const templateOptions = state.templates
    .filter((template) => template.templateApproved !== false)
    .map((template) => `<option value="${template.id}">${template.title}</option>`)
    .join("");

  elements.dashboardTitle.textContent = sessionUser.role === "bishop" ? `${sessionUser.name}'s ward board` : `${sessionUser.name}'s youth board`;
  elements.leaderDashboard.innerHTML = "";

  elements.leaderDashboard.appendChild(buildAdminDashboardNav(sessionUser, { readyCount, pendingPlanCount, pendingLeaderCount: pendingLeaders.length }));

  if (activeAdminDashboardView === "overview") {
    elements.leaderDashboard.appendChild(buildAdminSummaryCards(sessionUser, goals, managedYouth, approvedLeaders, pendingLeaders));
    elements.leaderDashboard.appendChild(buildWeeklyProgressEmailCard(sessionUser));
    elements.leaderDashboard.appendChild(buildManagedYouthOverview(sessionUser, managedYouth));
    return;
  }

  if (activeAdminDashboardView === "create-goal") {
    elements.leaderDashboard.appendChild(buildManagedGoalForm(youthOptions, templateOptions));
    return;
  }

  if (activeAdminDashboardView === "create-youth") {
    elements.leaderDashboard.appendChild(buildYouthAccountForm(organizationOptions));
    return;
  }

  if (activeAdminDashboardView === "import-youth") {
    elements.leaderDashboard.appendChild(buildYouthRosterImportForm(organizationOptions));
    return;
  }

  if (activeAdminDashboardView === "edit-youth") {
    const editingYouth = managedYouth.find((user) => user.id === activeEditingYouthId) || null;
    elements.leaderDashboard.appendChild(buildYouthAccountEditor(editingYouth, organizationOptions));
    return;
  }

  if (activeAdminDashboardView === "create-template") {
    elements.leaderDashboard.appendChild(buildCreateTemplateForm());
    return;
  }

  if (activeAdminDashboardView === "templates") {
    elements.leaderDashboard.appendChild(buildTemplateEditorView());
    return;
  }

  if (activeAdminDashboardView === "required-goals" && sessionUser.role === "bishop") {
    elements.leaderDashboard.appendChild(buildRequiredLevelGoalsView(sessionUser));
    return;
  }

  if (activeAdminDashboardView === "ward-approval" && sessionUser.role === "bishop") {
    elements.leaderDashboard.appendChild(buildWardApprovalView(sessionUser, pendingLeaders, accessUsers));
    return;
  }

  goals.forEach((goal) => {
    elements.leaderDashboard.appendChild(buildGoalCard(goal, sessionUser.role === "bishop" ? "bishop" : "youth_leader"));
  });
}

function renderBishopDashboard(sessionUser) {
  renderLeaderDashboard(sessionUser);
}

function render() {
  try {
  document.querySelectorAll(".goal-editor-overlay").forEach((overlay) => overlay.remove());
  if (!bootstrappedState) {
    elements.dashboardTitle.textContent = "Loading goal tracker";
    elements.emptyState.classList.remove("hidden");
    elements.emptyState.innerHTML = "<h3>Loading data</h3><p>Preparing the current app state and backend mode.</p>";
    elements.userDashboard.classList.add("hidden");
    elements.leaderDashboard.classList.add("hidden");
    renderSessionProgressTracker(null);
    return;
  }

  const sessionUser = getSessionUser();
  const loggedIn = Boolean(sessionUser);

  elements.loginView.classList.toggle("hidden", loggedIn);
  elements.sessionView.classList.toggle("hidden", !loggedIn);
  elements.accountMenu?.classList.toggle("hidden", !loggedIn);
  elements.authPanel?.classList.toggle("hidden", loggedIn);
  elements.appGrid?.classList.toggle("is-logged-in", loggedIn);
  elements.emptyState.classList.toggle("hidden", loggedIn);
  elements.userDashboard.classList.add("hidden");
  elements.leaderDashboard.classList.add("hidden");
  elements.userDashboard.innerHTML = "";
  elements.leaderDashboard.innerHTML = "";

  if (!loggedIn) {
    elements.dashboardTitle.textContent = "Choose a login to get started";
    closeAccountMenu();
    renderSessionProgressTracker(null);
    renderRegisterWardOptions();
    return;
  }

  elements.accountMenuButton.textContent = getInitials(sessionUser.name);
  elements.sessionTitle.textContent = sessionUser.name;
  elements.sessionDescription.textContent = sessionUser.role === "bishop"
    ? "Approve Youth leaders in your ward and oversee ward access."
    : sessionUser.role === "youth_leader"
      ? "Create youth accounts, manage templates, and sign off completed goals for youth in your ward."
      : sessionUser.role === "administrator"
        ? "Review wards, bishops, Youth leaders, parents, and youth across the whole program."
      : sessionUser.role === "parent"
        ? "Review the goals, progress, and deadlines for your linked youth."
      : "Check off sub-goals as you finish them and the overall progress bar will update automatically.";

  elements.sessionBadge.textContent =
    sessionUser.role === "bishop" ? "Bishop Session" :
    sessionUser.role === "youth_leader" ? "Youth Leader Session" :
    sessionUser.role === "administrator" ? "Admin Session" :
    sessionUser.role === "parent" ? "Parent Session" :
    "Youth Session";
  renderSessionProgressTracker(sessionUser);

  if (sessionUser.role === "administrator") {
    elements.leaderDashboard.classList.remove("hidden");
    renderAdministratorDashboard(sessionUser);
  } else if (sessionUser.role === "bishop") {
    elements.leaderDashboard.classList.remove("hidden");
    renderBishopDashboard(sessionUser);
  } else if (sessionUser.role === "youth_leader") {
    elements.leaderDashboard.classList.remove("hidden");
    renderLeaderDashboard(sessionUser);
  } else if (sessionUser.role === "parent") {
    elements.userDashboard.classList.remove("hidden");
    renderParentDashboard(sessionUser);
  } else {
    elements.userDashboard.classList.remove("hidden");
    renderUserDashboard(sessionUser);
  }

  const editorOverlay = buildGoalEditorOverlay(sessionUser);
  if (editorOverlay) {
    document.body.appendChild(editorOverlay);
  }
  } catch (error) {
    console.warn("Render failed.", error);
    elements.dashboardTitle.textContent = "Something went wrong";
    elements.emptyState.classList.remove("hidden");
    elements.emptyState.innerHTML = "<h3>Dashboard error</h3><p>The page hit an unexpected error while rendering. Please refresh and try again.</p>";
    elements.userDashboard.classList.add("hidden");
    elements.leaderDashboard.classList.add("hidden");
    renderSessionProgressTracker(null);
  }
}

elements.userTab.addEventListener("click", () => setActiveRole("youth"));
elements.parentTab?.addEventListener("click", () => setActiveRole("parent"));
elements.leaderTab.addEventListener("click", () => setActiveRole("youth_leader"));
elements.bishopTab.addEventListener("click", () => setActiveRole("bishop"));
elements.adminTab?.addEventListener("click", () => setActiveRole("administrator"));
elements.signInModeButton.addEventListener("click", () => setUserAuthMode("signin"));
elements.createAccountModeButton.addEventListener("click", () => setUserAuthMode("create"));
elements.loginForm.addEventListener("submit", login);
elements.registerForm.addEventListener("submit", registerUser);
elements.registerWard?.addEventListener("change", updateRegisterNewWardVisibility);
elements.logoutButton.addEventListener("click", logout);
elements.accountMenuButton?.addEventListener("click", toggleAccountMenu);

setActiveRole("youth");
renderRuntimeBanner();
render();
Promise.race([
  loadState().then((loadedState) => {
    state = loadedState;
    return authClient.hydrateSession(state);
  }),
  createTimeoutPromise("App bootstrap", BOOTSTRAP_TIMEOUT_MS)
]).then((result) => {
  if (result?.appState) {
    state = normalizeState(result.appState);
  }
  if (typeof result?.session !== "undefined") {
    state.session = result.session;
  }
  bootstrappedState = true;
  render();
}).catch((error) => {
  console.warn("App bootstrap failed; falling back to cached local state.", error);
  state = loadCachedState();
  bootstrappedState = true;
  render();
});

