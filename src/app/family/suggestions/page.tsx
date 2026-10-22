import { redirect } from "next/navigation";

export const runtime = 'edge';

export default function FamilySuggestionsRemoved() {
  redirect("/student/suggestions");
}
