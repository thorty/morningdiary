import {
  localStorageUserProfileStore,
  type UserProfile,
  type UserProfileStore,
} from "@/lib/user-profile-store";

const userProfile: UserProfile = {
  name: "Mara",
  pin: "1234",
  securityChallengeQuestion: "Wie heißt mein Hund?",
  securityChallengeAnswer: "Flocke",
};

function resetUserProfileStore(): UserProfileStore {
  localStorageUserProfileStore.clear();
  return localStorageUserProfileStore;
}

test("saving a profile and loading it back returns the profile", () => {
  const store = resetUserProfileStore();

  store.save(userProfile);

  expect(store.load()).toEqual(userProfile);
});

test("loading when no profile is stored returns null", () => {
  const store = resetUserProfileStore();

  expect(store.load()).toBeNull();
});

test("clearing a profile makes a subsequent load return null", () => {
  const store = resetUserProfileStore();
  store.save(userProfile);

  store.clear();

  expect(store.load()).toBeNull();
});
