import { redirect } from "next/navigation";

// Organizations and team are the same screen; keep old links working.
export default function Page() {
  redirect("/dashboard/equipe");
}
