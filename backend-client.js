(function attachGoalTrackerBackendClient(globalScope) {
  const runtime = globalScope.BishopGoalTrackerBackend || {
    runtimeMode: "demo-local",
    canBootSupabase: false,
    supabase: {
      snapshotTable: "app_runtime_snapshots",
      snapshotScope: "default"
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizePointValue(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }
    return Math.floor(parsed);
  }

  function normalizeDifficulty(value, fallbackPoints = 0) {
    const normalized = String(value || "").trim().toLowerCase();
    if (["easy", "medium", "hard"].includes(normalized)) {
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

  function normalizeGoalCategory(value) {
    const normalized = String(value || "").trim().toLowerCase().replace(/\s+/g, "_");
    return ["physical", "spiritual", "intellectual", "social"].includes(normalized) ? normalized : "spiritual";
  }

  function normalizeWardKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/\bward\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isSameWard(left, right) {
    return normalizeWardKey(left) === normalizeWardKey(right);
  }

  function getEnabledStatusForBackendRole(role) {
    return role === "youth_leader" ? "approved" : "verified";
  }

function mergeSnapshotProgressData(relationalState, snapshotState) {
    const nextState = clone(relationalState);
    const snapshotGoalsById = new Map((snapshotState?.goals || []).map((goal) => [goal.id, goal]));
    const snapshotTemplatesById = new Map((snapshotState?.templates || []).map((template) => [template.id, template]));

    nextState.goals = nextState.goals.map((goal) => {
      const snapshotGoal = snapshotGoalsById.get(goal.id);
      return {
        ...goal,
        points: normalizePointValue(snapshotGoal?.points ?? goal.points),
        difficulty: normalizeDifficulty(snapshotGoal?.difficulty ?? goal.difficulty, snapshotGoal?.points ?? goal.points),
        category: normalizeGoalCategory(snapshotGoal?.category ?? goal.category),
        priorityOrder: Number(snapshotGoal?.priorityOrder ?? goal.priorityOrder ?? 0),
        sourceTemplateId: snapshotGoal?.sourceTemplateId ?? goal.sourceTemplateId ?? null,
        sourceGoalId: snapshotGoal?.sourceGoalId ?? goal.sourceGoalId ?? null,
        requiredGoalDefinitionId: snapshotGoal?.requiredGoalDefinitionId ?? goal.requiredGoalDefinitionId ?? null,
        requiredGoalLevel: snapshotGoal?.requiredGoalLevel ?? goal.requiredGoalLevel ?? null,
        goalApproved: Boolean(snapshotGoal?.goalApproved ?? goal.goalApproved),
        goalApprovedBy: snapshotGoal?.goalApprovedBy ?? goal.goalApprovedBy ?? null,
        goalApprovedAt: snapshotGoal?.goalApprovedAt ?? goal.goalApprovedAt ?? null,
        leaderApproved: Boolean(snapshotGoal?.leaderApproved ?? goal.leaderApproved),
        leaderApprovedBy: snapshotGoal?.leaderApprovedBy ?? goal.leaderApprovedBy ?? null,
        completedAt: snapshotGoal?.completedAt ?? goal.completedAt ?? null
      };
    });

    nextState.templates = nextState.templates.map((template) => {
      const snapshotTemplate = snapshotTemplatesById.get(template.id);
      return {
        ...template,
        points: normalizePointValue(snapshotTemplate?.points ?? template.points),
        difficulty: normalizeDifficulty(snapshotTemplate?.difficulty ?? template.difficulty, snapshotTemplate?.points ?? template.points),
        category: normalizeGoalCategory(snapshotTemplate?.category ?? template.category),
        templateApproved: snapshotTemplate?.templateApproved ?? template.templateApproved ?? true,
        templateApprovedBy: snapshotTemplate?.templateApprovedBy ?? template.templateApprovedBy ?? null,
        templateApprovedAt: snapshotTemplate?.templateApprovedAt ?? template.templateApprovedAt ?? null
      };
    });

    nextState.requiredLevelGoals = snapshotState?.requiredLevelGoals || nextState.requiredLevelGoals || [];
    nextState.notifications = nextState.notifications?.length ? nextState.notifications : (snapshotState?.notifications || []);

    return nextState;
  }

  function mergeGoalIntoState(appState, goal, options = {}) {
    const nextState = clone(appState);
    const goalIndex = nextState.goals.findIndex((item) => item.id === goal.id);
    if (goalIndex >= 0) {
      nextState.goals[goalIndex] = {
        ...nextState.goals[goalIndex],
        points: normalizePointValue(goal.points),
        difficulty: normalizeDifficulty(goal.difficulty, goal.points),
        category: normalizeGoalCategory(goal.category),
        priorityOrder: Number(goal.priorityOrder || 0),
        goalApproved: Boolean(goal.goalApproved),
        goalApprovedBy: goal.goalApprovedBy || null,
        goalApprovedAt: goal.goalApprovedAt || null,
        leaderApproved: Boolean(goal.leaderApproved),
        leaderApprovedBy: goal.leaderApprovedBy || null,
        completedAt: goal.completedAt || null
      };
    } else if (options.insert) {
      nextState.goals.unshift({
        ...goal,
        points: normalizePointValue(goal.points),
        difficulty: normalizeDifficulty(goal.difficulty, goal.points),
        category: normalizeGoalCategory(goal.category)
      });
    }
    return nextState;
  }

  function mergeTemplateIntoState(appState, template, options = {}) {
    const nextState = clone(appState);
    const templateIndex = nextState.templates.findIndex((item) => item.id === template.id);
    if (templateIndex >= 0) {
      nextState.templates[templateIndex] = {
        ...nextState.templates[templateIndex],
        points: normalizePointValue(template.points),
        difficulty: normalizeDifficulty(template.difficulty, template.points),
        category: normalizeGoalCategory(template.category),
        templateApproved: template.templateApproved !== false,
        templateApprovedBy: template.templateApprovedBy || null,
        templateApprovedAt: template.templateApprovedAt || null
      };
    } else if (options.insert) {
      nextState.templates.unshift({
        ...template,
        points: normalizePointValue(template.points),
        difficulty: normalizeDifficulty(template.difficulty, template.points),
        category: normalizeGoalCategory(template.category),
        templateApproved: template.templateApproved !== false,
        templateApprovedBy: template.templateApprovedBy || null,
        templateApprovedAt: template.templateApprovedAt || null
      });
    }
    return nextState;
  }

  function createSupabaseClient() {
    return globalScope.supabase.createClient(runtime.supabase.url, runtime.supabase.anonKey);
  }

  function getAdminUserManagementFunctionName() {
    return runtime.supabase.adminUserManagementFunction || "admin-user-management";
  }

  async function invokeAdminUserManagement(client, action, payload) {
    if (!runtime.canBootSupabase) {
      throw new Error("Supabase mode is selected, but the browser SDK or credentials are not ready yet.");
    }

    const functionName = getAdminUserManagementFunctionName();
    const result = await client.functions.invoke(functionName, {
      body: {
        action,
        ...payload
      }
    });

    if (result.error) {
      throw result.error;
    }

    if (result.data?.error) {
      throw new Error(result.data.error);
    }

    return result.data || {};
  }

  function buildGoalSubGoals(checklistItems, checklistUnits, goalId) {
    const items = checklistItems
      .filter((item) => item.goal_id === goalId)
      .sort((left, right) => left.sort_order - right.sort_order);

    return items.map((item) => {
      const units = checklistUnits
        .filter((unit) => unit.checklist_item_id === item.id)
        .sort((left, right) => left.unit_index - right.unit_index);
      const completedUnits = Array.from({ length: item.repeat_count }, (_, index) => {
        const match = units.find((unit) => unit.unit_index === index);
        return match?.completed_at ? String(match.completed_at).slice(0, 10) : null;
      });

      return {
        id: item.id,
        title: item.title,
        repeatCount: item.repeat_count,
        completedUnits
      };
    });
  }

  function buildTemplateSubGoals(templateItems, templateId) {
    return templateItems
      .filter((item) => item.template_id === templateId)
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((item) => ({
        id: item.id,
        title: item.title,
        repeatCount: item.repeat_count
      }));
  }

  function buildRequiredGoalSubGoals(requiredItems, requiredGoalId) {
    return requiredItems
      .filter((item) => item.required_goal_id === requiredGoalId)
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((item) => ({
        id: item.id,
        title: item.title,
        repeatCount: item.repeat_count
      }));
  }

  function ensureArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function getCompletedCount(subGoal) {
    return ensureArray(subGoal.completedUnits).filter(Boolean).length;
  }

  function getGoalProgress(goal) {
    const totalChecks = ensureArray(goal.subGoals).reduce((sum, subGoal) => sum + subGoal.repeatCount, 0);
    const completedChecks = ensureArray(goal.subGoals).reduce((sum, subGoal) => sum + getCompletedCount(subGoal), 0);
    return totalChecks ? Math.round((completedChecks / totalChecks) * 100) : 0;
  }

  function getTodayDateString() {
    return new Date().toISOString().slice(0, 10);
  }

  function isGoalClosed(goal) {
    return Boolean(goal.deadline && getTodayDateString() > goal.deadline && !goal.leaderApproved);
  }

  function findMostRecentCompletedIndex(subGoal) {
    let latestIndex = -1;
    let latestValue = "";
    ensureArray(subGoal.completedUnits).forEach((value, index) => {
      if (value && value >= latestValue) {
        latestIndex = index;
        latestValue = value;
      }
    });
    return latestIndex;
  }

  async function reloadSupabaseAppState(storageKey, fallbackState) {
    return supabaseRelationalProvider.loadAppState(storageKey, fallbackState);
  }

  async function upsertGoalChecklist(client, goalId, subGoals) {
    const existingItemsResult = await client
      .from("goal_checklist_items")
      .select("id, goal_id")
      .eq("goal_id", goalId);

    if (existingItemsResult.error) {
      throw existingItemsResult.error;
    }

    const existingItems = existingItemsResult.data || [];
    const keepIds = subGoals.map((subGoal) => subGoal.id).filter(Boolean);
    const deleteIds = existingItems.map((item) => item.id).filter((id) => !keepIds.includes(id));
    if (deleteIds.length) {
      const deleteResult = await client.from("goal_checklist_items").delete().in("id", deleteIds);
      if (deleteResult.error) {
        throw deleteResult.error;
      }
    }

    for (let index = 0; index < subGoals.length; index += 1) {
      const subGoal = subGoals[index];
      const itemPayload = {
        id: subGoal.id,
        goal_id: goalId,
        title: subGoal.title,
        repeat_count: subGoal.repeatCount,
        sort_order: index
      };
      const itemResult = await client.from("goal_checklist_items").upsert(itemPayload).select("id").single();
      if (itemResult.error) {
        throw itemResult.error;
      }

      const checklistItemId = itemResult.data.id;
      const unitRows = Array.from({ length: subGoal.repeatCount }, (_, unitIndex) => ({
        checklist_item_id: checklistItemId,
        unit_index: unitIndex,
        completed_at: subGoal.completedUnits?.[unitIndex] ? `${subGoal.completedUnits[unitIndex]}T00:00:00.000Z` : null
      }));
      const unitsResult = await client.from("goal_checklist_units").upsert(unitRows);
      if (unitsResult.error) {
        throw unitsResult.error;
      }

      const staleUnitsResult = await client
        .from("goal_checklist_units")
        .delete()
        .eq("checklist_item_id", checklistItemId)
        .gte("unit_index", subGoal.repeatCount);
      if (staleUnitsResult.error) {
        throw staleUnitsResult.error;
      }
    }
  }

  async function upsertTemplateChecklist(client, templateId, subGoals) {
    const existingItemsResult = await client
      .from("template_checklist_items")
      .select("id")
      .eq("template_id", templateId);
    if (existingItemsResult.error) {
      throw existingItemsResult.error;
    }

    const existingItems = existingItemsResult.data || [];
    const keepIds = subGoals.map((subGoal) => subGoal.id).filter(Boolean);
    const deleteIds = existingItems.map((item) => item.id).filter((id) => !keepIds.includes(id));
    if (deleteIds.length) {
      const deleteResult = await client.from("template_checklist_items").delete().in("id", deleteIds);
      if (deleteResult.error) {
        throw deleteResult.error;
      }
    }

    for (let index = 0; index < subGoals.length; index += 1) {
      const subGoal = subGoals[index];
      const result = await client.from("template_checklist_items").upsert({
        id: subGoal.id,
        template_id: templateId,
        title: subGoal.title,
        repeat_count: subGoal.repeatCount,
        sort_order: index
      });
      if (result.error) {
        throw result.error;
      }
    }
  }

  async function upsertRequiredGoalChecklist(client, requiredGoalId, subGoals) {
    const existingItemsResult = await client
      .from("required_level_goal_checklist_items")
      .select("id")
      .eq("required_goal_id", requiredGoalId);
    if (existingItemsResult.error) {
      throw existingItemsResult.error;
    }

    const existingItems = existingItemsResult.data || [];
    const keepIds = subGoals.map((subGoal) => subGoal.id).filter(Boolean);
    const deleteIds = existingItems.map((item) => item.id).filter((id) => !keepIds.includes(id));
    if (deleteIds.length) {
      const deleteResult = await client.from("required_level_goal_checklist_items").delete().in("id", deleteIds);
      if (deleteResult.error) {
        throw deleteResult.error;
      }
    }

    for (let index = 0; index < subGoals.length; index += 1) {
      const subGoal = subGoals[index];
      const result = await client.from("required_level_goal_checklist_items").upsert({
        id: subGoal.id,
        required_goal_id: requiredGoalId,
        title: subGoal.title,
        repeat_count: subGoal.repeatCount,
        sort_order: index
      });
      if (result.error) {
        throw result.error;
      }
    }
  }

  async function findProfileIdByName(client, fullName) {
    if (!fullName) {
      return null;
    }
    const result = await client.from("profiles").select("id").eq("full_name", fullName).maybeSingle();
    return result.data?.id || null;
  }

  const localStorageProvider = {
    async loadAppState(storageKey, fallbackState) {
      const raw = globalScope.localStorage.getItem(`demo-local:${storageKey}`);
      if (!raw) {
        globalScope.localStorage.setItem(`demo-local:${storageKey}`, JSON.stringify(fallbackState));
        return clone(fallbackState);
      }

      try {
        return JSON.parse(raw);
      } catch (error) {
        globalScope.localStorage.setItem(`demo-local:${storageKey}`, JSON.stringify(fallbackState));
        return clone(fallbackState);
      }
    },
    async saveAppState(storageKey, nextState) {
      globalScope.localStorage.setItem(`demo-local:${storageKey}`, JSON.stringify(nextState));
      return true;
    },
    async createGoal(storageKey, appState, payload) {
      const nextState = clone(appState);
      nextState.goals.unshift(payload.goal);
      return nextState;
    },
    async updateGoal(storageKey, appState, payload) {
      const nextState = clone(appState);
      const goalIndex = nextState.goals.findIndex((goal) => goal.id === payload.goal.id);
      if (goalIndex >= 0) {
        nextState.goals[goalIndex] = payload.goal;
      }
      return nextState;
    },
    async createTemplate(storageKey, appState, payload) {
      const nextState = clone(appState);
      nextState.templates.unshift(payload.template);
      return nextState;
    },
    async updateTemplate(storageKey, appState, payload) {
      const nextState = clone(appState);
      const templateIndex = nextState.templates.findIndex((template) => template.id === payload.template.id);
      if (templateIndex >= 0) {
        nextState.templates[templateIndex] = payload.template;
      }
      return nextState;
    },
    async deleteTemplate(storageKey, appState, payload) {
      const nextState = clone(appState);
      nextState.templates = (nextState.templates || []).filter((template) => template.id !== payload.templateId);
      return nextState;
    },
    async updateLevelGoalRequirements(storageKey, appState, payload) {
      const nextState = clone(appState);
      const targetWard = String(payload.ward || "").trim();
      const preservedRequirements = (nextState.levelGoalRequirements || []).filter((requirement) =>
        !targetWard || !requirement.ward || !isSameWard(requirement.ward, targetWard)
      );
      nextState.levelGoalRequirements = [
        ...preservedRequirements,
        ...(payload.levelGoalRequirements || []).map((requirement) => ({
          ...requirement,
          ward: requirement.ward || targetWard
        }))
      ];
      return nextState;
    },
    async createRequiredLevelGoal(storageKey, appState, payload) {
      const nextState = clone(appState);
      nextState.requiredLevelGoals = [payload.requiredGoal, ...(nextState.requiredLevelGoals || [])];
      return nextState;
    },
    async updateRequiredLevelGoal(storageKey, appState, payload) {
      const nextState = clone(appState);
      nextState.requiredLevelGoals = (nextState.requiredLevelGoals || []).map((goal) =>
        goal.id === payload.requiredGoal.id ? payload.requiredGoal : goal
      );
      return nextState;
    },
    async deleteRequiredLevelGoal(storageKey, appState, payload) {
      const nextState = clone(appState);
      nextState.requiredLevelGoals = (nextState.requiredLevelGoals || []).filter((goal) => goal.id !== payload.requiredGoalId);
      return nextState;
    },
    async dispatchNotifications(storageKey, appState, payload) {
      return { ok: true, dispatched: 0, queued: payload.notifications?.length || 0 };
    },
    async createYouthAccount(storageKey, appState, payload) {
      const nextState = clone(appState);
      nextState.users.push(payload.user);
      return nextState;
    },
    async updateYouthAccount(storageKey, appState, payload) {
      const nextState = clone(appState);
      const userIndex = nextState.users.findIndex((user) => user.id === payload.user.id);
      if (userIndex >= 0) {
        nextState.users[userIndex] = payload.user;
      }
      return nextState;
    },
    async updateCompetitionPreference(storageKey, appState, payload) {
      const nextState = clone(appState);
      const userIndex = nextState.users.findIndex((user) => user.id === payload.user.id);
      if (userIndex >= 0) {
        nextState.users[userIndex] = {
          ...nextState.users[userIndex],
          competitionOptIn: payload.user.competitionOptIn !== false
        };
      }
      return nextState;
    },
    async updateNotificationPreferences(storageKey, appState, payload) {
      const nextState = clone(appState);
      const userIndex = nextState.users.findIndex((user) => user.id === payload.user.id);
      if (userIndex >= 0) {
        nextState.users[userIndex] = payload.user;
      }
      return nextState;
    },
    async registerPushToken(storageKey, appState, payload) {
      const nextState = clone(appState);
      const userIndex = nextState.users.findIndex((user) => user.id === payload.userId);
      if (userIndex >= 0) {
        nextState.users[userIndex] = {
          ...nextState.users[userIndex],
          pushToken: payload.token || nextState.users[userIndex].pushToken || ""
        };
      }
      return nextState;
    },
    async recordUserActivity(storageKey, appState, payload) {
      const nextState = clone(appState);
      const userIndex = nextState.users.findIndex((user) => user.id === payload.userId);
      if (userIndex >= 0) {
        nextState.users[userIndex] = {
          ...nextState.users[userIndex],
          lastActiveAt: new Date().toISOString()
        };
      }
      return nextState;
    },
    async updateParentYouthLinks(storageKey, appState, payload) {
      const nextState = clone(appState);
      const parentIndex = nextState.users.findIndex((user) => user.id === payload.parent.id);
      if (parentIndex >= 0) {
        nextState.users[parentIndex] = payload.parent;
      } else {
        nextState.users.push(payload.parent);
      }
      nextState.parentYouthLinks = payload.parentYouthLinks || [];
      return nextState;
    },
    async approveYouthLeader(storageKey, appState, payload) {
      const nextState = clone(appState);
      const leader = nextState.users.find((user) => user.id === payload.leaderId);
      if (leader) {
        leader.approvalStatus = "approved";
      }
      return nextState;
    },
    async updateUserAccessStatus(storageKey, appState, payload) {
      const nextState = clone(appState);
      const user = nextState.users.find((item) => item.id === payload.userId);
      if (user) {
        user.approvalStatus = payload.approvalStatus;
      }
      return nextState;
    },
    async updateUserAccountType(storageKey, appState, payload) {
      const nextState = clone(appState);
      const user = nextState.users.find((item) => item.id === payload.userId);
      if (user) {
        user.role = payload.role;
        user.organization = payload.role === "parent" ? "all" : payload.organization;
        user.competitionOptIn = payload.role === "youth" ? user.competitionOptIn !== false : false;
        user.approvalStatus = getEnabledStatusForBackendRole(payload.role);
      }
      return nextState;
    },
    async createWard(storageKey, appState, payload) {
      const nextState = clone(appState);
      nextState.wards = nextState.wards || [];
      nextState.wards.push(payload.ward);
      return nextState;
    },
    async createBishopAccount(storageKey, appState, payload) {
      const nextState = clone(appState);
      nextState.users.push(payload.user);
      if (payload.user.ward && !(nextState.wards || []).some((ward) => ward.name === payload.user.ward)) {
        nextState.wards = nextState.wards || [];
        nextState.wards.push({ id: `ward-${Date.now()}`, name: payload.user.ward });
      }
      return nextState;
    },
    async assignBishopWard(storageKey, appState, payload) {
      const nextState = clone(appState);
      const userIndex = nextState.users.findIndex((user) => user.id === payload.user.id);
      if (userIndex >= 0) {
        nextState.users[userIndex] = payload.user;
      }
      return nextState;
    }
  };

  const supabaseSnapshotProvider = {
    async loadAppState(storageKey, fallbackState) {
      if (!runtime.canBootSupabase) {
        return localStorageProvider.loadAppState(storageKey, fallbackState);
      }

      const client = createSupabaseClient();
      const snapshotTable = runtime.supabase.snapshotTable || "app_runtime_snapshots";
      const snapshotScope = runtime.supabase.snapshotScope || "default";
      const { data, error } = await client
        .from(snapshotTable)
        .select("state_json")
        .eq("scope", snapshotScope)
        .maybeSingle();

      if (error) {
        console.warn("Supabase snapshot load failed; falling back to local demo storage.", error);
        return localStorageProvider.loadAppState(storageKey, fallbackState);
      }

      if (!data) {
        await client.from(snapshotTable).upsert({
          scope: snapshotScope,
          state_json: fallbackState
        });
        return clone(fallbackState);
      }

      return data.state_json || clone(fallbackState);
    },
    async saveAppState(storageKey, nextState) {
      if (!runtime.canBootSupabase) {
        return localStorageProvider.saveAppState(storageKey, nextState);
      }

      const client = createSupabaseClient();
      const snapshotTable = runtime.supabase.snapshotTable || "app_runtime_snapshots";
      const snapshotScope = runtime.supabase.snapshotScope || "default";
      const { error } = await client.from(snapshotTable).upsert({
        scope: snapshotScope,
        state_json: nextState
      });

      if (error) {
        console.warn("Supabase snapshot save failed; keeping the local demo cache updated.", error);
        await localStorageProvider.saveAppState(storageKey, nextState);
      }

      return !error;
    }
  };

  const supabaseRelationalProvider = {
    async loadAppState(storageKey, fallbackState) {
      if (!runtime.canBootSupabase) {
        return supabaseSnapshotProvider.loadAppState(storageKey, fallbackState);
      }

      try {
        const client = createSupabaseClient();
        const [
          stakesResult,
          wardsResult,
          profilesResult,
          goalsResult,
          goalChecklistItemsResult,
          goalChecklistUnitsResult,
          parentYouthLinksResult,
          templatesResult,
          templateChecklistItemsResult,
          requiredGoalsResult,
          requiredGoalChecklistItemsResult,
          levelGoalRequirementsResult,
          notificationPreferencesResult,
          pushTokensResult,
          notificationsResult
        ] = await Promise.all([
          client.from("stakes").select("id, name"),
          client.from("wards").select("id, name, stake_id"),
          client.from("profiles").select("id, auth_user_id, email, full_name, role, organization, approval_status, ward_id, competition_opt_in, last_active_at"),
          client.from("goals").select("*"),
          client.from("goal_checklist_items").select("id, goal_id, title, repeat_count, sort_order"),
          client.from("goal_checklist_units").select("checklist_item_id, unit_index, completed_at"),
          client.from("parent_youth_links").select("parent_id, youth_id, relationship"),
          client.from("goal_templates").select("*"),
          client.from("template_checklist_items").select("id, template_id, title, repeat_count, sort_order"),
          client.from("required_level_goals").select("id, ward_id, level, title, summary, points, difficulty, category, deadline_days, created_by"),
          client.from("required_level_goal_checklist_items").select("id, required_goal_id, title, repeat_count, sort_order"),
          client.from("level_goal_requirements").select("ward_id, level, category, easy_required, medium_required, hard_required"),
          client.from("notification_preferences").select("*"),
          client.from("user_push_tokens").select("profile_id, token, enabled, last_seen_at").eq("enabled", true),
          client.from("notifications").select("*").order("created_at", { ascending: false }).limit(100)
        ]);

        const firstError = [
          stakesResult.error,
          wardsResult.error,
          profilesResult.error,
          goalsResult.error,
          goalChecklistItemsResult.error,
          goalChecklistUnitsResult.error,
          parentYouthLinksResult.error,
          templatesResult.error,
          templateChecklistItemsResult.error,
          requiredGoalsResult.error,
          requiredGoalChecklistItemsResult.error,
          levelGoalRequirementsResult.error,
          notificationPreferencesResult.error,
          pushTokensResult.error,
          notificationsResult.error
        ].find(Boolean);

        if (firstError) {
          throw firstError;
        }

        const wards = wardsResult.data || [];
        const stakes = stakesResult.data || [];
        const profiles = profilesResult.data || [];
        const goals = goalsResult.data || [];
        const goalChecklistItems = goalChecklistItemsResult.data || [];
        const goalChecklistUnits = goalChecklistUnitsResult.data || [];
        const parentYouthLinks = parentYouthLinksResult.data || [];
        const templates = templatesResult.data || [];
        const templateChecklistItems = templateChecklistItemsResult.data || [];
        const requiredGoals = requiredGoalsResult.data || [];
        const requiredGoalChecklistItems = requiredGoalChecklistItemsResult.data || [];
        const levelGoalRequirements = levelGoalRequirementsResult.data || [];
        const notificationPreferences = notificationPreferencesResult.data || [];
        const pushTokens = pushTokensResult.data || [];
        const notifications = notificationsResult.data || [];

        const wardNamesById = new Map(wards.map((ward) => [ward.id, ward.name]));
        const stakesById = new Map(stakes.map((stake) => [stake.id, stake]));
        const profileNamesById = new Map(profiles.map((profile) => [profile.id, profile.full_name]));
        const notificationPreferencesByProfileId = new Map(notificationPreferences.map((preference) => [preference.profile_id, preference]));
        const pushTokenByProfileId = new Map(pushTokens.map((token) => [token.profile_id, token.token]));

        const relationalState = {
          stakes: stakes.map((stake) => ({
            id: stake.id,
            name: stake.name
          })),
          wards: wards.map((ward) => {
            const stake = stakesById.get(ward.stake_id);
            return {
              id: ward.id,
              name: ward.name,
              stakeId: ward.stake_id || "",
              stakeName: stake?.name || ""
            };
          }),
          users: profiles.map((profile) => {
            const preference = notificationPreferencesByProfileId.get(profile.id) || {};
            return {
              id: profile.id,
              role: profile.role,
              email: profile.email,
              password: "",
              name: profile.full_name,
              ward: wardNamesById.get(profile.ward_id) || "",
              organization: profile.role === "bishop" || profile.role === "parent" || profile.role === "administrator" ? "all" : profile.organization,
              competitionOptIn: profile.role === "youth" ? profile.competition_opt_in !== false : false,
              sameGoalNotificationsOptIn: profile.role === "youth"
                ? Boolean(preference.same_goal_in_app || preference.same_goal_email || preference.same_goal_push)
                : false,
              notificationChannels: {
                inApp: preference.same_goal_in_app !== false,
                email: Boolean(preference.same_goal_email),
                push: Boolean(preference.same_goal_push)
              },
              inactivityNotificationsOptIn: Boolean(preference.inactivity_reminders_enabled),
              inactivityNotificationChannels: {
                inApp: preference.inactivity_in_app !== false,
                email: Boolean(preference.inactivity_email),
                push: Boolean(preference.inactivity_push)
              },
              inactivityReminderMinHours: Number(preference.inactivity_min_hours || 24),
              inactivityReminderMaxHours: Number(preference.inactivity_max_hours || 96),
              nextInactivityReminderAt: preference.next_inactivity_reminder_at || null,
              pushToken: pushTokenByProfileId.get(profile.id) || "",
              lastActiveAt: profile.last_active_at || null,
              approvalStatus: profile.approval_status,
              loginStatus: (profile.role === "youth" || profile.role === "parent") && !profile.auth_user_id
                ? (profile.email ? "invitation_ready" : "not_invited")
                : "verified"
            };
          }),
          goals: goals.map((goal) => ({
            id: goal.id,
            userId: goal.youth_id,
            title: goal.title,
            summary: goal.summary,
            points: normalizePointValue(goal.points),
            difficulty: normalizeDifficulty(goal.difficulty, goal.points),
            category: normalizeGoalCategory(goal.category),
            priorityOrder: Number(goal.priority_order || 0),
            sourceTemplateId: goal.source_template_id || null,
            sourceGoalId: goal.source_goal_id || null,
            requiredGoalDefinitionId: goal.required_goal_definition_id || null,
            requiredGoalLevel: goal.required_goal_level || null,
            goalApproved: Boolean(goal.goal_approved),
            goalApprovedBy: goal.goal_approved_by ? (profileNamesById.get(goal.goal_approved_by) || null) : null,
            goalApprovedAt: goal.goal_approved_at ? String(goal.goal_approved_at).slice(0, 10) : null,
            deadline: goal.deadline,
            leaderApproved: Boolean(goal.leader_approved),
            leaderApprovedBy: goal.leader_approved_by ? (profileNamesById.get(goal.leader_approved_by) || null) : null,
            completedAt: goal.completed_at ? String(goal.completed_at).slice(0, 10) : null,
            subGoals: buildGoalSubGoals(goalChecklistItems, goalChecklistUnits, goal.id)
          })),
          templates: templates.map((template) => ({
            id: template.id,
            title: template.title,
            summary: template.summary,
            points: normalizePointValue(template.points),
            difficulty: normalizeDifficulty(template.difficulty, template.points),
            category: normalizeGoalCategory(template.category),
            templateApproved: template.template_approved !== false,
            templateApprovedBy: template.template_approved_by ? (profileNamesById.get(template.template_approved_by) || null) : null,
            templateApprovedAt: template.template_approved_at ? String(template.template_approved_at).slice(0, 10) : null,
            subGoals: buildTemplateSubGoals(templateChecklistItems, template.id)
          })),
          levelGoalRequirements: Object.values(levelGoalRequirements.reduce((byLevel, requirement) => {
            const wardName = wardNamesById.get(requirement.ward_id) || "";
            const level = Number(requirement.level || 1);
            const category = normalizeGoalCategory(requirement.category);
            const key = `${wardName}:${level}`;
            byLevel[key] = byLevel[key] || { ward: wardName, level, categories: {} };
            byLevel[key].categories[category] = {
              easy: Number(requirement.easy_required || 0),
              medium: Number(requirement.medium_required || 0),
              hard: Number(requirement.hard_required || 0)
            };
            return byLevel;
          }, {})),
          parentYouthLinks: parentYouthLinks.map((link) => ({
            parentId: link.parent_id,
            youthId: link.youth_id,
            relationship: link.relationship || "Parent"
          })),
          requiredLevelGoals: requiredGoals.map((goal) => ({
            id: goal.id,
            ward: wardNamesById.get(goal.ward_id) || "",
            level: Number(goal.level || 1),
            title: goal.title,
            summary: goal.summary,
            points: normalizePointValue(goal.points),
            difficulty: normalizeDifficulty(goal.difficulty, goal.points),
            category: normalizeGoalCategory(goal.category),
            deadlineDays: Number(goal.deadline_days || 30),
            subGoals: buildRequiredGoalSubGoals(requiredGoalChecklistItems, goal.id)
          })),
          notifications: notifications.map((notification) => ({
            id: notification.id,
            userId: notification.recipient_id,
            actorId: notification.actor_id || null,
            actorName: notification.actor_id ? (profileNamesById.get(notification.actor_id) || "Another youth") : "Pathway to Christ",
            goalId: notification.goal_id || null,
            goalTitle: notification.goal_title || "Goal update",
            type: notification.type || "same_goal_passed",
            message: notification.message || "",
            recipientEmail: notification.recipient_email || "",
            pushToken: "",
            createdAt: notification.created_at ? String(notification.created_at).slice(0, 10) : null,
            readAt: notification.read_at ? String(notification.read_at).slice(0, 10) : null,
            channels: {
              inApp: notification.channels?.inApp !== false,
              email: Boolean(notification.channels?.email),
              push: Boolean(notification.channels?.push)
            },
            status: notification.status || "queued"
          })),
          session: null
        };
        const snapshotState = await supabaseSnapshotProvider.loadAppState(storageKey, fallbackState);
        return mergeSnapshotProgressData(relationalState, snapshotState);
      } catch (error) {
        console.warn("Supabase relational load failed; falling back to snapshot bridge.", error);
        return supabaseSnapshotProvider.loadAppState(storageKey, fallbackState);
      }
    },
    async saveAppState(storageKey, nextState) {
      return supabaseSnapshotProvider.saveAppState(storageKey, nextState);
    },
    async createGoal(storageKey, appState, payload) {
      try {
        const client = createSupabaseClient();
        const goalApproverId = await findProfileIdByName(client, payload.goal.goalApprovedBy);
        const goalResult = await client.from("goals").insert({
          id: payload.goal.id,
          youth_id: payload.goal.userId,
          created_by: payload.createdBy,
          source_template_id: payload.sourceTemplateId || payload.goal.sourceTemplateId || null,
          source_goal_id: payload.sourceGoalId || payload.goal.sourceGoalId || null,
          required_goal_definition_id: payload.goal.requiredGoalDefinitionId || null,
          required_goal_level: payload.goal.requiredGoalLevel || null,
          title: payload.goal.title,
          summary: payload.goal.summary,
          points: normalizePointValue(payload.goal.points),
          difficulty: normalizeDifficulty(payload.goal.difficulty, payload.goal.points),
          category: normalizeGoalCategory(payload.goal.category),
          priority_order: Number(payload.goal.priorityOrder || 0),
          required_goal_definition_id: payload.goal.requiredGoalDefinitionId || null,
          required_goal_level: payload.goal.requiredGoalLevel || null,
          goal_approved: Boolean(payload.goal.goalApproved),
          goal_approved_by: goalApproverId,
          goal_approved_at: payload.goal.goalApprovedAt ? `${payload.goal.goalApprovedAt}T00:00:00.000Z` : null,
          deadline: payload.goal.deadline,
          leader_approved: Boolean(payload.goal.leaderApproved),
          completed_at: payload.goal.completedAt ? `${payload.goal.completedAt}T00:00:00.000Z` : null
        });
        if (goalResult.error) {
          throw goalResult.error;
        }
        await upsertGoalChecklist(client, payload.goal.id, payload.goal.subGoals);
        const nextState = await reloadSupabaseAppState(storageKey, payload.fallbackState);
        return mergeGoalIntoState(nextState, payload.goal, { insert: true });
      } catch (error) {
        console.warn("Supabase createGoal failed; falling back to snapshot bridge.", error);
        const nextState = await localStorageProvider.createGoal(storageKey, appState, payload);
        await supabaseSnapshotProvider.saveAppState(storageKey, nextState);
        return nextState;
      }
    },
    async updateGoal(storageKey, appState, payload) {
      try {
        const client = createSupabaseClient();
        const goalApproverId = await findProfileIdByName(client, payload.goal.goalApprovedBy);
        const approverId = await findProfileIdByName(client, payload.goal.leaderApprovedBy);
        const goalResult = await client.from("goals").update({
          title: payload.goal.title,
          summary: payload.goal.summary,
          points: normalizePointValue(payload.goal.points),
          difficulty: normalizeDifficulty(payload.goal.difficulty, payload.goal.points),
          category: normalizeGoalCategory(payload.goal.category),
          priority_order: Number(payload.goal.priorityOrder || 0),
          goal_approved: Boolean(payload.goal.goalApproved),
          goal_approved_by: goalApproverId,
          goal_approved_at: payload.goal.goalApprovedAt ? `${payload.goal.goalApprovedAt}T00:00:00.000Z` : null,
          deadline: payload.goal.deadline,
          leader_approved: Boolean(payload.goal.leaderApproved),
          leader_approved_by: approverId,
          completed_at: payload.goal.completedAt ? `${payload.goal.completedAt}T00:00:00.000Z` : null
        }).eq("id", payload.goal.id);
        if (goalResult.error) {
          throw goalResult.error;
        }
        await upsertGoalChecklist(client, payload.goal.id, payload.goal.subGoals);
        const nextState = await reloadSupabaseAppState(storageKey, payload.fallbackState);
        return mergeGoalIntoState(nextState, payload.goal);
      } catch (error) {
        console.warn("Supabase updateGoal failed; falling back to snapshot bridge.", error);
        const nextState = await localStorageProvider.updateGoal(storageKey, appState, payload);
        await supabaseSnapshotProvider.saveAppState(storageKey, nextState);
        return nextState;
      }
    },
    async createTemplate(storageKey, appState, payload) {
      try {
        const client = createSupabaseClient();
        const wardResult = await client.from("profiles").select("ward_id").eq("id", payload.createdBy).maybeSingle();
        const wardId = wardResult.data?.ward_id || null;
        const templateResult = await client.from("goal_templates").insert({
          id: payload.template.id,
          title: payload.template.title,
          summary: payload.template.summary,
          points: normalizePointValue(payload.template.points),
          difficulty: normalizeDifficulty(payload.template.difficulty, payload.template.points),
          category: normalizeGoalCategory(payload.template.category),
          template_approved: payload.template.templateApproved !== false,
          template_approved_by: payload.template.templateApproved !== false ? (payload.template.templateApprovedById || payload.createdBy || null) : null,
          template_approved_at: payload.template.templateApproved !== false ? new Date().toISOString() : null,
          created_by: payload.createdBy,
          ward_id: wardId
        });
        if (templateResult.error) {
          throw templateResult.error;
        }
        await upsertTemplateChecklist(client, payload.template.id, payload.template.subGoals);
        const nextState = await reloadSupabaseAppState(storageKey, payload.fallbackState);
        return mergeTemplateIntoState(nextState, payload.template, { insert: true });
      } catch (error) {
        console.warn("Supabase createTemplate failed; falling back to snapshot bridge.", error);
        const nextState = await localStorageProvider.createTemplate(storageKey, appState, payload);
        await supabaseSnapshotProvider.saveAppState(storageKey, nextState);
        return nextState;
      }
    },
    async updateTemplate(storageKey, appState, payload) {
      try {
        const client = createSupabaseClient();
        const templateUpdate = {
          title: payload.template.title,
          summary: payload.template.summary,
          points: normalizePointValue(payload.template.points),
          difficulty: normalizeDifficulty(payload.template.difficulty, payload.template.points),
          category: normalizeGoalCategory(payload.template.category)
        };
        if (payload.template.templateApprovalUpdated) {
          templateUpdate.template_approved = payload.template.templateApproved !== false;
          templateUpdate.template_approved_by = payload.template.templateApprovedById || null;
          templateUpdate.template_approved_at = payload.template.templateApprovedAt ? `${payload.template.templateApprovedAt}T00:00:00.000Z` : null;
        }
        const templateResult = await client.from("goal_templates").update(templateUpdate).eq("id", payload.template.id);
        if (templateResult.error) {
          throw templateResult.error;
        }
        await upsertTemplateChecklist(client, payload.template.id, payload.template.subGoals);
        const nextState = await reloadSupabaseAppState(storageKey, payload.fallbackState);
        return mergeTemplateIntoState(nextState, payload.template);
      } catch (error) {
        console.warn("Supabase updateTemplate failed; falling back to snapshot bridge.", error);
        const nextState = await localStorageProvider.updateTemplate(storageKey, appState, payload);
        await supabaseSnapshotProvider.saveAppState(storageKey, nextState);
        return nextState;
      }
    },
    async deleteTemplate(storageKey, appState, payload) {
      try {
        const client = createSupabaseClient();
        const templateResult = await client.from("goal_templates").delete().eq("id", payload.templateId);
        if (templateResult.error) {
          throw templateResult.error;
        }
        const nextState = await reloadSupabaseAppState(storageKey, payload.fallbackState);
        nextState.templates = (nextState.templates || []).filter((template) => template.id !== payload.templateId);
        return nextState;
      } catch (error) {
        console.warn("Supabase deleteTemplate failed; falling back to snapshot bridge.", error);
        const nextState = await localStorageProvider.deleteTemplate(storageKey, appState, payload);
        await supabaseSnapshotProvider.saveAppState(storageKey, nextState);
        return nextState;
      }
    },
    async updateLevelGoalRequirements(storageKey, appState, payload) {
      try {
        const client = createSupabaseClient();
        const wardResult = await client.from("profiles").select("ward_id").eq("id", payload.updatedBy).maybeSingle();
        const wardId = wardResult.data?.ward_id || null;
        if (!wardId) {
          throw new Error("A ward is required before level requirements can be updated.");
        }
        for (const requirement of payload.levelGoalRequirements || []) {
          const categories = requirement.categories || {};
          for (const category of ["physical", "spiritual", "intellectual", "social"]) {
            const categoryRequirement = categories[category] || {};
            const result = await client.from("level_goal_requirements").upsert({
              ward_id: wardId,
              level: Number(requirement.level),
              category,
              easy_required: Number(categoryRequirement.easy || 0),
              medium_required: Number(categoryRequirement.medium || 0),
              hard_required: Number(categoryRequirement.hard || 0),
              updated_by: payload.updatedBy || null
            });
            if (result.error) {
              throw result.error;
            }
          }
        }
        const nextState = await reloadSupabaseAppState(storageKey, payload.fallbackState);
        const targetWard = String(payload.ward || "").trim();
        nextState.levelGoalRequirements = [
          ...(nextState.levelGoalRequirements || []).filter((requirement) =>
            !targetWard || !requirement.ward || !isSameWard(requirement.ward, targetWard)
          ),
          ...(payload.levelGoalRequirements || []).map((requirement) => ({ ...requirement, ward: requirement.ward || targetWard }))
        ];
        return nextState;
      } catch (error) {
        console.warn("Supabase updateLevelGoalRequirements failed; falling back to snapshot bridge.", error);
        const nextState = await localStorageProvider.updateLevelGoalRequirements(storageKey, appState, payload);
        await supabaseSnapshotProvider.saveAppState(storageKey, nextState);
        return nextState;
      }
    },
    async createRequiredLevelGoal(storageKey, appState, payload) {
      try {
        const client = createSupabaseClient();
        const wardResult = await client.from("profiles").select("ward_id").eq("id", payload.createdBy).maybeSingle();
        const wardId = wardResult.data?.ward_id || null;
        const result = await client.from("required_level_goals").insert({
          id: payload.requiredGoal.id,
          ward_id: wardId,
          level: payload.requiredGoal.level,
          title: payload.requiredGoal.title,
          summary: payload.requiredGoal.summary,
          points: normalizePointValue(payload.requiredGoal.points),
          difficulty: normalizeDifficulty(payload.requiredGoal.difficulty, payload.requiredGoal.points),
          category: normalizeGoalCategory(payload.requiredGoal.category),
          deadline_days: payload.requiredGoal.deadlineDays,
          created_by: payload.createdBy
        });
        if (result.error) {
          throw result.error;
        }
        await upsertRequiredGoalChecklist(client, payload.requiredGoal.id, payload.requiredGoal.subGoals);
        return reloadSupabaseAppState(storageKey, payload.fallbackState);
      } catch (error) {
        console.warn("Supabase createRequiredLevelGoal failed; falling back to snapshot bridge.", error);
        const nextState = await localStorageProvider.createRequiredLevelGoal(storageKey, appState, payload);
        await supabaseSnapshotProvider.saveAppState(storageKey, nextState);
        return nextState;
      }
    },
    async updateRequiredLevelGoal(storageKey, appState, payload) {
      try {
        const client = createSupabaseClient();
        const result = await client.from("required_level_goals").update({
          level: payload.requiredGoal.level,
          title: payload.requiredGoal.title,
          summary: payload.requiredGoal.summary,
          points: normalizePointValue(payload.requiredGoal.points),
          difficulty: normalizeDifficulty(payload.requiredGoal.difficulty, payload.requiredGoal.points),
          category: normalizeGoalCategory(payload.requiredGoal.category),
          deadline_days: payload.requiredGoal.deadlineDays
        }).eq("id", payload.requiredGoal.id);
        if (result.error) {
          throw result.error;
        }
        await upsertRequiredGoalChecklist(client, payload.requiredGoal.id, payload.requiredGoal.subGoals);
        return reloadSupabaseAppState(storageKey, payload.fallbackState);
      } catch (error) {
        console.warn("Supabase updateRequiredLevelGoal failed; falling back to snapshot bridge.", error);
        const nextState = await localStorageProvider.updateRequiredLevelGoal(storageKey, appState, payload);
        await supabaseSnapshotProvider.saveAppState(storageKey, nextState);
        return nextState;
      }
    },
    async deleteRequiredLevelGoal(storageKey, appState, payload) {
      try {
        const client = createSupabaseClient();
        const result = await client.from("required_level_goals").delete().eq("id", payload.requiredGoalId);
        if (result.error) {
          throw result.error;
        }
        return reloadSupabaseAppState(storageKey, payload.fallbackState);
      } catch (error) {
        console.warn("Supabase deleteRequiredLevelGoal failed; falling back to snapshot bridge.", error);
        const nextState = await localStorageProvider.deleteRequiredLevelGoal(storageKey, appState, payload);
        await supabaseSnapshotProvider.saveAppState(storageKey, nextState);
        return nextState;
      }
    },
    async dispatchNotifications(storageKey, appState, payload) {
      if (!runtime.canBootSupabase) {
        return localStorageProvider.dispatchNotifications(storageKey, appState, payload);
      }
      const client = createSupabaseClient();
      const result = await client.functions.invoke("send-notifications", {
        body: {
          notifications: payload.notifications || []
        }
      });
      if (result.error) {
        throw result.error;
      }
      return result.data || { ok: true };
    },
    async createYouthAccount(storageKey, appState, payload) {
      const client = createSupabaseClient();
      await invokeAdminUserManagement(client, "create_managed_youth_account", {
        email: payload.user.email,
        password: payload.password,
        fullName: payload.user.name,
        ward: payload.user.ward,
        organization: payload.user.organization,
        competitionOptIn: payload.user.competitionOptIn !== false
      });
      return reloadSupabaseAppState(storageKey, payload.fallbackState);
    },
    async updateYouthAccount(storageKey, appState, payload) {
      const client = createSupabaseClient();
      await invokeAdminUserManagement(client, "update_managed_youth_profile", {
        youthId: payload.user.id,
        email: payload.user.email,
        fullName: payload.user.name,
        organization: payload.user.organization,
        competitionOptIn: payload.user.competitionOptIn !== false
      });
      return reloadSupabaseAppState(storageKey, payload.fallbackState);
    },
    async updateCompetitionPreference(storageKey, appState, payload) {
      try {
        const client = createSupabaseClient();
        const result = await client
          .from("profiles")
          .update({ competition_opt_in: payload.user.competitionOptIn !== false })
          .eq("id", payload.user.id)
          .select("id")
          .single();
        if (result.error) {
          throw result.error;
        }
        return reloadSupabaseAppState(storageKey, payload.fallbackState);
      } catch (error) {
        console.warn("Supabase updateCompetitionPreference failed; falling back to snapshot bridge.", error);
        const nextState = await localStorageProvider.updateCompetitionPreference(storageKey, appState, payload);
        await supabaseSnapshotProvider.saveAppState(storageKey, nextState);
        return nextState;
      }
    },
    async updateNotificationPreferences(storageKey, appState, payload) {
      try {
        const client = createSupabaseClient();
        const user = payload.user;
        const result = await client.from("notification_preferences").upsert({
          profile_id: user.id,
          same_goal_in_app: user.notificationChannels?.inApp !== false,
          same_goal_email: Boolean(user.notificationChannels?.email),
          same_goal_push: Boolean(user.notificationChannels?.push),
          inactivity_reminders_enabled: Boolean(user.inactivityNotificationsOptIn),
          inactivity_in_app: user.inactivityNotificationChannels?.inApp !== false,
          inactivity_email: Boolean(user.inactivityNotificationChannels?.email),
          inactivity_push: Boolean(user.inactivityNotificationChannels?.push),
          inactivity_min_hours: Number(user.inactivityReminderMinHours || 24),
          inactivity_max_hours: Number(user.inactivityReminderMaxHours || 96),
          updated_at: new Date().toISOString()
        }).select("profile_id").single();
        if (result.error) {
          throw result.error;
        }
        return reloadSupabaseAppState(storageKey, payload.fallbackState);
      } catch (error) {
        console.warn("Supabase updateNotificationPreferences failed; falling back to snapshot bridge.", error);
        const nextState = await localStorageProvider.updateNotificationPreferences(storageKey, appState, payload);
        await supabaseSnapshotProvider.saveAppState(storageKey, nextState);
        return nextState;
      }
    },
    async registerPushToken(storageKey, appState, payload) {
      try {
        const client = createSupabaseClient();
        const result = await client.from("user_push_tokens").upsert({
          profile_id: payload.userId,
          provider: payload.provider || "expo",
          token: payload.token,
          device_label: payload.deviceLabel || null,
          enabled: payload.enabled !== false,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: "profile_id,token" }).select("id").single();
        if (result.error) {
          throw result.error;
        }
        return reloadSupabaseAppState(storageKey, payload.fallbackState);
      } catch (error) {
        console.warn("Supabase registerPushToken failed; falling back to snapshot bridge.", error);
        const nextState = await localStorageProvider.registerPushToken(storageKey, appState, payload);
        await supabaseSnapshotProvider.saveAppState(storageKey, nextState);
        return nextState;
      }
    },
    async recordUserActivity(storageKey, appState, payload) {
      try {
        const client = createSupabaseClient();
        const result = await client.rpc("touch_profile_activity", {
          target_profile_id: payload.userId
        });
        if (result.error) {
          throw result.error;
        }
        return reloadSupabaseAppState(storageKey, payload.fallbackState);
      } catch (error) {
        console.warn("Supabase recordUserActivity failed; falling back to local activity update.", error);
        return localStorageProvider.recordUserActivity(storageKey, appState, payload);
      }
    },
    async updateParentYouthLinks(storageKey, appState, payload) {
      const client = createSupabaseClient();
      await invokeAdminUserManagement(client, payload.unlink ? "unlink_youth_parent_link" : "upsert_youth_parent_link", {
        youthId: payload.youthId,
        parentId: payload.parent.id,
        email: payload.parent.email,
        password: payload.parent.password || "",
        fullName: payload.parent.name,
        relationship: payload.relationship || null
      });
      const nextState = await reloadSupabaseAppState(storageKey, payload.fallbackState);
      return {
        ...nextState,
        parentYouthLinks: payload.parentYouthLinks || nextState.parentYouthLinks || []
      };
    },
    async approveYouthLeader(storageKey, appState, payload) {
      const client = createSupabaseClient();
      await invokeAdminUserManagement(client, "approve_youth_leader", {
        leaderId: payload.leaderId
      });
      return reloadSupabaseAppState(storageKey, payload.fallbackState);
    },
    async updateUserAccessStatus(storageKey, appState, payload) {
      const client = createSupabaseClient();
      await invokeAdminUserManagement(client, "update_profile_access_status", {
        userId: payload.userId,
        approvalStatus: payload.approvalStatus
      });
      return reloadSupabaseAppState(storageKey, payload.fallbackState);
    },
    async updateUserAccountType(storageKey, appState, payload) {
      const client = createSupabaseClient();
      await invokeAdminUserManagement(client, "update_profile_account_type", {
        userId: payload.userId,
        role: payload.role,
        organization: payload.organization
      });
      return reloadSupabaseAppState(storageKey, payload.fallbackState);
    },
    async createWard(storageKey, appState, payload) {
      const client = createSupabaseClient();
      await invokeAdminUserManagement(client, "create_ward", {
        ward: payload.ward.name,
        stake: payload.ward.stakeName || "Default Stake"
      });
      return reloadSupabaseAppState(storageKey, payload.fallbackState);
    },
    async createBishopAccount(storageKey, appState, payload) {
      const client = createSupabaseClient();
      await invokeAdminUserManagement(client, "create_bishop_account", {
        email: payload.user.email,
        password: payload.password,
        fullName: payload.user.name,
        ward: payload.user.ward
      });
      return reloadSupabaseAppState(storageKey, payload.fallbackState);
    },
    async assignBishopWard(storageKey, appState, payload) {
      const client = createSupabaseClient();
      await invokeAdminUserManagement(client, "assign_bishop_ward", {
        userId: payload.user.id,
        ward: payload.wardName
      });
      return reloadSupabaseAppState(storageKey, payload.fallbackState);
    }
  };

  const activeProvider = runtime.runtimeMode === "supabase" ? supabaseRelationalProvider : localStorageProvider;

  globalScope.BishopGoalTrackerClient = {
    runtimeMode: runtime.runtimeMode,
    async loadAppState(storageKey, fallbackState) {
      return activeProvider.loadAppState(storageKey, fallbackState);
    },
    async saveAppState(storageKey, nextState) {
      return activeProvider.saveAppState(storageKey, nextState);
    },
    async createGoal(storageKey, appState, payload) {
      return (activeProvider.createGoal || localStorageProvider.createGoal)(storageKey, appState, payload);
    },
    async updateGoal(storageKey, appState, payload) {
      return (activeProvider.updateGoal || localStorageProvider.updateGoal)(storageKey, appState, payload);
    },
    async createTemplate(storageKey, appState, payload) {
      return (activeProvider.createTemplate || localStorageProvider.createTemplate)(storageKey, appState, payload);
    },
    async updateTemplate(storageKey, appState, payload) {
      return (activeProvider.updateTemplate || localStorageProvider.updateTemplate)(storageKey, appState, payload);
    },
    async deleteTemplate(storageKey, appState, payload) {
      return (activeProvider.deleteTemplate || localStorageProvider.deleteTemplate)(storageKey, appState, payload);
    },
    async updateLevelGoalRequirements(storageKey, appState, payload) {
      return (activeProvider.updateLevelGoalRequirements || localStorageProvider.updateLevelGoalRequirements)(storageKey, appState, payload);
    },
    async createRequiredLevelGoal(storageKey, appState, payload) {
      return (activeProvider.createRequiredLevelGoal || localStorageProvider.createRequiredLevelGoal)(storageKey, appState, payload);
    },
    async updateRequiredLevelGoal(storageKey, appState, payload) {
      return (activeProvider.updateRequiredLevelGoal || localStorageProvider.updateRequiredLevelGoal)(storageKey, appState, payload);
    },
    async deleteRequiredLevelGoal(storageKey, appState, payload) {
      return (activeProvider.deleteRequiredLevelGoal || localStorageProvider.deleteRequiredLevelGoal)(storageKey, appState, payload);
    },
    async createYouthAccount(storageKey, appState, payload) {
      return (activeProvider.createYouthAccount || localStorageProvider.createYouthAccount)(storageKey, appState, payload);
    },
    async updateYouthAccount(storageKey, appState, payload) {
      return (activeProvider.updateYouthAccount || localStorageProvider.updateYouthAccount)(storageKey, appState, payload);
    },
    async updateCompetitionPreference(storageKey, appState, payload) {
      return (activeProvider.updateCompetitionPreference || localStorageProvider.updateCompetitionPreference)(storageKey, appState, payload);
    },
    async updateNotificationPreferences(storageKey, appState, payload) {
      return (activeProvider.updateNotificationPreferences || localStorageProvider.updateNotificationPreferences)(storageKey, appState, payload);
    },
    async registerPushToken(storageKey, appState, payload) {
      return (activeProvider.registerPushToken || localStorageProvider.registerPushToken)(storageKey, appState, payload);
    },
    async recordUserActivity(storageKey, appState, payload) {
      return (activeProvider.recordUserActivity || localStorageProvider.recordUserActivity)(storageKey, appState, payload);
    },
    async updateParentYouthLinks(storageKey, appState, payload) {
      return (activeProvider.updateParentYouthLinks || localStorageProvider.updateParentYouthLinks)(storageKey, appState, payload);
    },
    async approveYouthLeader(storageKey, appState, payload) {
      return (activeProvider.approveYouthLeader || localStorageProvider.approveYouthLeader)(storageKey, appState, payload);
    },
    async updateUserAccessStatus(storageKey, appState, payload) {
      return (activeProvider.updateUserAccessStatus || localStorageProvider.updateUserAccessStatus)(storageKey, appState, payload);
    },
    async updateUserAccountType(storageKey, appState, payload) {
      return (activeProvider.updateUserAccountType || localStorageProvider.updateUserAccountType)(storageKey, appState, payload);
    },
    async createWard(storageKey, appState, payload) {
      return (activeProvider.createWard || localStorageProvider.createWard)(storageKey, appState, payload);
    },
    async createBishopAccount(storageKey, appState, payload) {
      return (activeProvider.createBishopAccount || localStorageProvider.createBishopAccount)(storageKey, appState, payload);
    },
    async assignBishopWard(storageKey, appState, payload) {
      return (activeProvider.assignBishopWard || localStorageProvider.assignBishopWard)(storageKey, appState, payload);
    },
    async dispatchNotifications(storageKey, appState, payload) {
      return (activeProvider.dispatchNotifications || localStorageProvider.dispatchNotifications)(storageKey, appState, payload);
    }
  };
})(window);
