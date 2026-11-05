import { redirect } from "next/navigation"

// The participant entry moved to /prisijungti; keep /play working for links
// and bookmarks made before the move.
export default function PlayIndexRedirect() {
  redirect("/prisijungti")
}
