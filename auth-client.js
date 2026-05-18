(function attachGoalTrackerAuthClient(globalScope) {
  const runtime = globalScope.BishopGoalTrackerBackend || {
    runtimeMode: "demo-local",
    canBootSupabase: false,
    supabase: {}
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createSupabaseClient() {
    return globalScope.supabase.createClient(runtime.supabase.url, runtime.supabase.anonKey);
  }

  function isSelfSignupRoleAllowed(role) {
    return role === "youth" || role === "youth_leader" || role === "bishop" || role === "parent";
  }

  async function ensureDefaultStakeRecord(client) {
    const existingStake = await client.from("stakes").select("id, name").eq("name", "Default Stake").maybeSingle();
    if (existingStake.data?.id) {
      return existingStake.data;
    }

    const insertResult = await client.from("stakes").insert({ name: "Default Stake" }).select("id, name").single();
    if (insertResult.error) {
      throw insertResult.error;
    }

    return insertResult.data;
  }

  function normalizeWardName(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/\bward\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  async function ensureWardRecord(client, wardName, wardId = "") {
    if (wardId) {
      const wardById = await client.from("wards").select("id, name, stake_id").eq("id", wardId).maybeSingle();
      if (wardById.error) {
        throw wardById.error;
      }
      if (wardById.data?.id) {
        return wardById.data;
      }
    }

    const normalizedRequestedWard = normalizeWardName(wardName);
    const wardsResult = await client.from("wards").select("id, name, stake_id");
    if (wardsResult.error) {
      throw wardsResult.error;
    }

    const existingWard = (wardsResult.data || []).find((ward) =>
      normalizeWardName(ward.name) === normalizedRequestedWard
    );
    if (existingWard?.id) {
      return existingWard;
    }

    const stake = await ensureDefaultStakeRecord(client);
    const insertResult = await client.from("wards").insert({ name: wardName, stake_id: stake.id }).select("id, name").single();
    if (insertResult.error) {
      throw insertResult.error;
    }

    return insertResult.data;
  }

  function mapProfileRow(row) {
    return {
      id: row.id,
      authUserId: row.auth_user_id || null,
      email: row.email,
      name: row.full_name,
      role: row.role,
      organization: row.role === "bishop" || row.role === "parent" || row.role === "administrator" ? "all" : row.organization,
      competitionOptIn: row.role === "youth" ? row.competition_opt_in !== false : false,
      approvalStatus: row.approval_status,
      wardId: row.ward_id || "",
      ward: row.ward?.name || row.ward_name || ""
    };
  }

  async function fetchProfileByEmail(client, email) {
    const result = await client
      .from("profiles")
      .select("id, auth_user_id, email, full_name, role, organization, approval_status, competition_opt_in, ward_id, ward:wards(name)")
      .eq("email", email)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      return null;
    }

    return mapProfileRow(result.data);
  }

  function getApprovalStatusForRole(role) {
    return role === "youth_leader" ? "pending" : "verified";
  }

  async function ensureProfileForAuthUser(client, authUser) {
    const email = String(authUser?.email || "").trim().toLowerCase();
    if (!authUser?.id || !email) {
      return null;
    }

    const existingProfile = await fetchProfileByEmail(client, email);
    if (existingProfile) {
      if (!existingProfile.authUserId || existingProfile.authUserId !== authUser.id) {
        const profileResult = await client.rpc("create_self_signup_profile", {
          requested_role: existingProfile.role,
          requested_full_name: existingProfile.name,
          requested_ward_id: existingProfile.wardId || null,
          requested_organization: existingProfile.organization,
          requested_competition_opt_in: existingProfile.competitionOptIn
        });

        if (profileResult.error) {
          throw profileResult.error;
        }

        const profile = Array.isArray(profileResult.data) ? profileResult.data[0] : profileResult.data;
        return profile ? mapProfileRow(profile) : existingProfile;
      }

      return existingProfile;
    }

    const metadata = authUser.user_metadata || {};
    const role = metadata.role;
    const ward = String(metadata.ward || "").trim();
    const wardId = String(metadata.ward_id || metadata.wardId || "").trim();
    const fullName = String(metadata.full_name || metadata.fullName || "").trim();
    const organization = role === "bishop" || role === "parent" || role === "administrator" ? "all" : metadata.organization;
    const competitionOptIn = role === "youth" ? metadata.competition_opt_in !== false && metadata.competitionOptIn !== false : false;

    if (!isSelfSignupRoleAllowed(role) || !ward || !fullName || !organization) {
      return null;
    }

    const wardRecord = await ensureWardRecord(client, ward, wardId);
    const profileResult = await client.rpc("create_self_signup_profile", {
      requested_role: role,
      requested_full_name: fullName,
      requested_ward_id: wardRecord.id,
      requested_organization: role === "bishop" || role === "parent" || role === "administrator" ? "all" : organization,
      requested_competition_opt_in: competitionOptIn
    });

    if (profileResult.error) {
      throw profileResult.error;
    }

    const profile = Array.isArray(profileResult.data) ? profileResult.data[0] : profileResult.data;
    return profile ? mapProfileRow(profile) : null;
  }

  function findUserByCredentials(appState, role, email, password) {
    return appState.users.find((user) =>
      user.role === role &&
      String(user.email || "").toLowerCase() === email &&
      user.password === password
    );
  }

  function getApprovalError(user) {
    if (user.approvalStatus === "rejected") {
      return "This account has been disabled by a ward administrator.";
    }

    if (user.role === "youth_leader" && user.approvalStatus !== "approved") {
      return "This Youth leader account is waiting for bishop approval.";
    }

    return null;
  }

  function isEmailRateLimitError(error) {
    return /email rate limit|rate limit exceeded|too many requests/i.test(String(error?.message || error || ""));
  }

  function getEmailRateLimitMessage() {
    return "The email service is temporarily rate limited. Please wait a few minutes before creating another account, or have an administrator create the account from the dashboard. For production, configure a custom SMTP provider in Supabase Auth to raise this limit.";
  }

  const demoAuthProvider = {
    async hydrateSession(appState) {
      return { session: appState.session || null, appState };
    },
    async signIn({ appState, role, email, password }) {
      const matchedUser = findUserByCredentials(appState, role, email, password);
      if (!matchedUser) {
        return { ok: false, error: "Login not recognized. Please use one of the demo accounts or create a new account." };
      }

      const approvalError = getApprovalError(matchedUser);
      if (approvalError) {
        return { ok: false, error: approvalError };
      }

      return {
        ok: true,
        session: { userId: matchedUser.id, authMode: "demo-local" }
      };
    },
    async signUp({ appState, role, name, email, ward, organization, password, competitionOptIn, createId }) {
      const emailInUse = appState.users.some((user) => String(user.email || "").toLowerCase() === email);
      if (emailInUse) {
        return { ok: false, error: "That email already has an account. Please sign in instead." };
      }

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

      const nextState = clone(appState);
      nextState.users.push(newUser);

      return {
        ok: true,
        appState: nextState,
        pendingApproval: role === "youth_leader",
        session: role === "youth_leader" ? null : { userId: newUser.id, authMode: "demo-local" }
      };
    },
    async signOut() {
      return { ok: true };
    }
  };

  const supabaseAuthProvider = {
    async hydrateSession(appState) {
      if (!runtime.canBootSupabase) {
        return demoAuthProvider.hydrateSession(appState);
      }

      const client = createSupabaseClient();
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.user?.email) {
        return { session: null, appState };
      }

      const matchedUser = await ensureProfileForAuthUser(client, data.session.user);

      if (!matchedUser) {
        return { session: null, appState };
      }

      const nextState = clone(appState);
      const existingUserIndex = nextState.users.findIndex((user) => user.id === matchedUser.id);
      if (existingUserIndex >= 0) {
        nextState.users[existingUserIndex] = { ...nextState.users[existingUserIndex], ...matchedUser };
      } else {
        nextState.users.push({ ...matchedUser, password: "" });
      }

      return {
        session: {
          userId: matchedUser.id,
          authMode: "supabase",
          authUserId: data.session.user.id
        },
        appState: nextState
      };
    },
    async signIn({ appState, role, email, password }) {
      if (!runtime.canBootSupabase) {
        return {
          ok: false,
          error: "Supabase mode is selected, but the browser SDK or credentials are not ready yet."
        };
      }

      const client = createSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        return { ok: false, error: error?.message || "Supabase sign-in failed." };
      }

      const matchedUser = await ensureProfileForAuthUser(client, data.user);

      if (!matchedUser || matchedUser.role !== role) {
        await client.auth.signOut();
        return { ok: false, error: "The auth account exists, but no matching app profile was found yet." };
      }

      const approvalError = getApprovalError(matchedUser);
      if (approvalError) {
        await client.auth.signOut();
        return { ok: false, error: approvalError };
      }

      const nextState = clone(appState);
      const existingUserIndex = nextState.users.findIndex((user) => user.id === matchedUser.id);
      if (existingUserIndex >= 0) {
        nextState.users[existingUserIndex] = { ...nextState.users[existingUserIndex], ...matchedUser };
      } else {
        nextState.users.push({ ...matchedUser, password: "" });
      }

      return {
        ok: true,
        appState: nextState,
        session: {
          userId: matchedUser.id,
          authMode: "supabase",
          authUserId: data.user.id
        }
      };
    },
    async signUp({ appState, role, name, email, ward, wardId, organization, password, competitionOptIn }) {
      if (!runtime.canBootSupabase) {
        return {
          ok: false,
          error: "Supabase mode is selected, but the browser SDK or credentials are not ready yet."
        };
      }

      const emailInUse = appState.users.some((user) => String(user.email || "").toLowerCase() === email);
      if (emailInUse) {
        return { ok: false, error: "That email already has an account. Please sign in instead." };
      }

      const client = createSupabaseClient();
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            ward,
            ward_id: wardId || null,
            wardId: wardId || null,
            organization,
            competition_opt_in: role === "youth" ? competitionOptIn !== false : false,
            competitionOptIn: role === "youth" ? competitionOptIn !== false : false,
            full_name: name
          }
        }
      });

      if (error) {
        if (isEmailRateLimitError(error)) {
          return { ok: false, error: getEmailRateLimitMessage() };
        }
        return { ok: false, error: error.message || "Supabase sign-up failed." };
      }

      try {
        if (!data.session) {
          return {
            ok: true,
            appState,
            session: null,
            pendingApproval: false,
            requiresEmailVerification: true
          };
        }

        const ensuredProfile = await ensureProfileForAuthUser(client, data.user);
        if (!ensuredProfile) {
          throw new Error("Supabase profile setup could not be completed after sign-up.");
        }

        const newUser = {
          id: ensuredProfile.id,
          role: ensuredProfile.role,
          email: ensuredProfile.email,
          name: ensuredProfile.name,
          ward: ensuredProfile.ward,
          organization: ensuredProfile.organization,
          competitionOptIn: ensuredProfile.competitionOptIn,
          approvalStatus: ensuredProfile.approvalStatus
        };

        const nextState = clone(appState);
        nextState.users.push({ ...newUser, password: "" });

        return {
          ok: true,
          appState: nextState,
          pendingApproval: role === "youth_leader",
          session: role === "youth_leader"
            ? null
            : {
              userId: newUser.id,
              authMode: "supabase",
              authUserId: data.user?.id || null
            }
        };
      } catch (profileError) {
        return { ok: false, error: profileError.message || "Supabase profile setup failed." };
      }
    },
    async signOut() {
      if (!runtime.canBootSupabase) {
        return { ok: true };
      }

      const client = globalScope.supabase.createClient(runtime.supabase.url, runtime.supabase.anonKey);
      await client.auth.signOut();
      return { ok: true };
    }
  };

  const activeProvider = runtime.runtimeMode === "supabase" ? supabaseAuthProvider : demoAuthProvider;

  globalScope.BishopGoalTrackerAuthClient = {
    runtimeMode: runtime.runtimeMode,
    hydrateSession(appState) {
      return activeProvider.hydrateSession(appState);
    },
    signIn(payload) {
      return activeProvider.signIn(payload);
    },
    signUp(payload) {
      return activeProvider.signUp(payload);
    },
    signOut() {
      return activeProvider.signOut();
    }
  };
})(window);
