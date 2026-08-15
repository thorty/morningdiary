export type UserProfile = {
  name: string;
  pin: string;
  securityChallengeQuestion: string;
  securityChallengeAnswer: string;
};

export interface UserProfileStore {
  load(): UserProfile | null;
  save(userProfile: UserProfile): void;
  clear(): void;
}

export const userProfileStorageKey = "morning-coach.user-profile";

function isUserProfile(value: unknown): value is UserProfile {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.pin === "string" &&
    typeof candidate.securityChallengeQuestion === "string" &&
    typeof candidate.securityChallengeAnswer === "string"
  );
}

export const localStorageUserProfileStore: UserProfileStore = {
  load() {
    try {
      const storedUserProfile = window.localStorage.getItem(userProfileStorageKey);
      if (storedUserProfile === null) return null;

      const parsedUserProfile: unknown = JSON.parse(storedUserProfile);
      return isUserProfile(parsedUserProfile) ? parsedUserProfile : null;
    } catch {
      return null;
    }
  },

  save(userProfile) {
    try {
      window.localStorage.setItem(userProfileStorageKey, JSON.stringify(userProfile));
    } catch {
      // The profile remains unavailable when browser storage is unavailable.
    }
  },

  clear() {
    try {
      window.localStorage.removeItem(userProfileStorageKey);
    } catch {
      // Clearing is best effort when browser storage is unavailable.
    }
  },
};
