import { redirect } from "next/navigation";
export default function OldClientDetail({ params }: { params: { id: string } }) {
  redirect(`/admin/clients/${params.id}`);
}
