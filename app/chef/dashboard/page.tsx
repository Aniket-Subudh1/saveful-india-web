"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getChefSidebarLinks } from "@/config/sidebar";

export default function ChefDashboard() {
  const { isLoading } = useAuth("chef");
  const user = useCurrentUser("chef");
  const router = useRouter();

  const handleLogout = async () => {
    await authService.logout("chef");
    router.push("/chef/login");
  };

  const sidebarConfig = {
    role: "chef" as const,
    userName: user?.name || "Chef",
    userEmail: user?.email || "",
    links: getChefSidebarLinks(handleLogout),
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-saveful-cream">
        <div className="text-lg font-saveful text-saveful-green">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout config={sidebarConfig}>
      <div className="h-full bg-saveful-cream p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 font-saveful-bold text-4xl text-saveful-orange">
              Chef Dashboard
            </h1>
            <p className="font-saveful text-saveful-gray">
              Welcome back, {user?.name || user?.email}!
            </p>
          </div>

          {/* Profile Card */}
          <div className="mb-6 rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 font-saveful-bold text-2xl text-saveful-green">
              Your Profile
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="font-saveful-semibold text-sm text-saveful-gray">
                  Full Name
                </p>
                <p className="font-saveful text-lg text-saveful-black">
                  {user?.name || "Not provided"}
                </p>
              </div>
              <div>
                <p className="font-saveful-semibold text-sm text-saveful-gray">
                  Email
                </p>
                <p className="font-saveful text-lg text-saveful-black">
                  {user?.email}
                </p>
              </div>
              <div>
                <p className="font-saveful-semibold text-sm text-saveful-gray">
                  Phone
                </p>
                <p className="font-saveful text-lg text-saveful-black">
                  {user?.phoneNumber || "Not provided"}
                </p>
              </div>
              <div>
                <p className="font-saveful-semibold text-sm text-saveful-gray">
                  Role
                </p>
                <p className="font-saveful text-lg text-saveful-black">Chef</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-gradient-to-br from-saveful-orange to-saveful-pink p-6 text-white shadow-lg transition-transform hover:scale-105">
              <h3 className="mb-2 font-saveful-bold text-xl">Recipes</h3>
              <p className="mb-4 font-saveful text-sm opacity-90">
                Manage your recipe collection
              </p>
              <button className="rounded-lg bg-white px-4 py-2 font-saveful-semibold text-saveful-orange transition-colors hover:bg-opacity-90">
                Coming Soon
              </button>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-saveful-green to-saveful-purple p-6 text-white shadow-lg transition-transform hover:scale-105">
              <h3 className="mb-2 font-saveful-bold text-xl">Dishes</h3>
              <p className="mb-4 font-saveful text-sm opacity-90">
                Create and edit your dishes
              </p>
              <button className="rounded-lg bg-white px-4 py-2 font-saveful-semibold text-saveful-green transition-colors hover:bg-opacity-90">
                Coming Soon
              </button>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-saveful-purple to-saveful-pink p-6 text-white shadow-lg transition-transform hover:scale-105">
              <h3 className="mb-2 font-saveful-bold text-xl">Analytics</h3>
              <p className="mb-4 font-saveful text-sm opacity-90">
                View your performance metrics
              </p>
              <button className="rounded-lg bg-white px-4 py-2 font-saveful-semibold text-saveful-purple transition-colors hover:bg-opacity-90">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
