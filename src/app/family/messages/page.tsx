import { redirect } from "next/navigation";

export const instant = false;

export default function FamilyMessagesRemoved() {
  redirect("/student/messages");
}
