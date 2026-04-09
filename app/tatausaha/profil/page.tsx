// app/[role]/profil/page.tsx
import { auth } from "@/auth";
import EditProfileModal from "@/components/EditProfileModal";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import ProfileClientView from "@/components/ProfileClientView";

export default async function ProfilePage() {
  // Mengambil session terbaru dari server
  const session = await auth();

  if (!session?.user) {
    return <div className="p-10 text-center">Silakan login terlebih dahulu.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-xl mt-10">
      <h2 className="text-2xl font-bold mb-8 text-gray-800 border-b pb-4">Profil Saya</h2>
      
      <div className="space-y-8">
        {/* Tampilan Foto & Nama yang Reaktif menggunakan useSession di dalamnya */}
        <ProfileClientView initialSession={session} />
        
        <hr className="border-gray-100" />

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Modal yang membawa data session untuk diedit */}
          <EditProfileModal session={session} />
          <ChangePasswordModal /> 
        </div>
      </div>
    </div>
  );
}