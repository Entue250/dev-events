// import Image from "next/image";
// import Link from "next/link";

// const Navbar = () => {
//   return (
//     <header>
//       <nav>
//         <Link href="/" className="logo">
//           <Image src="/icons/logo.png" alt="logo" width={24} height={24} />

//           <p>DevSphere</p>
//         </Link>

//         <ul>
//           <Link href="/">Home</Link>
//           <Link href="/">Events</Link>
//           <Link href="/">Create Event</Link>
//         </ul>
//       </nav>
//     </header>
//   );
// };

// export default Navbar;

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

interface Admin {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (data.success) {
        setAdmin(data.admin);
      } else {
        setAdmin(null);
      }
    } catch (err) {
      setAdmin(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch(`${BASE_URL}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signout" }),
      });
      setAdmin(null);
      router.push("/");
    } catch (err) {
      console.error("Sign out failed");
    }
  };

  return (
    <header>
      <nav>
        {/* Logo */}
        <Link href="/" className="logo">
          <Image src="/icons/logo.png" alt="logo" width={24} height={24} />
          <p>DevSphere</p>
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex">
          <Link href="/" className={pathname === "/" ? "text-primary" : ""}>
            Home
          </Link>
          <Link
            href="/#featured"
            className={pathname === "/#featured" ? "text-primary" : ""}
          >
            Events
          </Link>

          {admin ? (
            <>
              <Link
                href="/admin/dashboard"
                className={pathname.startsWith("/admin") ? "text-primary" : ""}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/create-event"
                className={
                  pathname === "/admin/create-event" ? "text-primary" : ""
                }
              >
                Create Event
              </Link>

              {/* Admin Profile Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 hover:text-primary transition-colors">
                  {admin.avatar ? (
                    <Image
                      src={admin.avatar}
                      alt={admin.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center text-xs font-semibold">
                      {admin.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[100px] truncate">{admin.name}</span>
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 glass rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 text-sm text-light-200 border-b border-gray-700">
                      {admin.email}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-dark-200 transition-colors text-red-400 hover:text-red-300"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Link
              href="/admin/signin"
              className="bg-primary hover:bg-primary/90 text-black font-semibold px-4 py-2 rounded-md transition-colors"
            >
              Admin Login
            </Link>
          )}
        </ul>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
        >
          <span
            className={`w-6 h-0.5 bg-white transition-transform ${
              mobileMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`w-6 h-0.5 bg-white transition-opacity ${
              mobileMenuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`w-6 h-0.5 bg-white transition-transform ${
              mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full glass md:hidden">
            <div className="flex flex-col p-4 gap-4">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={pathname === "/" ? "text-primary" : ""}
              >
                Home
              </Link>
              <Link
                href="/#featured"
                onClick={() => setMobileMenuOpen(false)}
                className={pathname === "/#featured" ? "text-primary" : ""}
              >
                Events
              </Link>

              {admin ? (
                <>
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={
                      pathname.startsWith("/admin") ? "text-primary" : ""
                    }
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/create-event"
                    onClick={() => setMobileMenuOpen(false)}
                    className={
                      pathname === "/admin/create-event" ? "text-primary" : ""
                    }
                  >
                    Create Event
                  </Link>

                  <div className="pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      {admin.avatar ? (
                        <Image
                          src={admin.avatar}
                          alt={admin.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center text-sm font-semibold">
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{admin.name}</div>
                        <div className="text-xs text-light-200">
                          {admin.email}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left text-red-400 hover:text-red-300"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  href="/admin/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-primary hover:bg-primary/90 text-black font-semibold px-4 py-2 rounded-md transition-colors text-center"
                >
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
