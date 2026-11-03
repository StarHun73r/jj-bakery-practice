// Accounts for the lock screen. Each person has their own 8-arrow code; only a
// hash of the code is stored here, plus the code locked with the owner's code
// ("code"), which only the Admin tab can open after the owner signs in.
// Edit these from the Admin tab (owner code only). With the local app running
// (start.bat), "Publish" there rewrites this file and pushes it to GitHub.
//
// level: "admin"   - everything, plus the Admin tab
//        "trainer" - every mode, including Photos (adding/replacing photos)
//        "trainee" - every practice mode and the Sheet, but not Photos
//        "test"    - like a trainer (no Admin tab), but nothing it does is recorded or synced
window.JJ_ACCOUNTS = {
  rev: 11,
  settings: {
    idleMinutes: 5,
    // front page messages (Admin tab > Settings): color "red" or "gray", place "top" (above the arrows) or "bottom"
    messages: [
      { text: "Work in progress: some items are still missing photos or prices.\nCheck the Notes tab for updates.", color: "red", place: "top" },
      { text: "Important: Website is not configured for phones current, recommended to use PC's during practices.", color: "red", place: "bottom" },
    ],
  },
  accounts: [
    { id: "owner", name: "Owner", level: "admin", hash: "8d9bb775", active: true, owner: true },
    { id: "test", name: "Test", level: "test", hash: "4ca44d95", code: "3c07", active: true },
    { id: "trainee", name: "Jonathan", level: "trainee", hash: "eb036925", code: "1c90", active: true },
    { id: "mire", name: "Mira", level: "trainee", hash: "ea1eac75", code: "daa3", active: true },
  ],
};
