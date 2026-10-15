// Accounts for the lock screen. Each person has their own 8-arrow code; only a
// hash of the code is stored here, never the code itself.
// Edit these from the Admin tab (owner code only). With the local app running
// (start.bat), "Publish" there rewrites this file and pushes it to GitHub.
//
// level: "admin"   - everything, plus the Admin tab
//        "trainer" - every mode, including Photos (adding/replacing photos)
//        "trainee" - every practice mode and the Sheet, but not Photos
window.JJ_ACCOUNTS = {
  rev: 1,
  settings: { idleMinutes: 5 },
  accounts: [
    { id: "owner", name: "Owner", level: "admin", hash: "8d9bb775", active: true, owner: true },
  ],
};
