"use client"
import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGlobal } from "@/utils/GlobalContext";
import {User} from "@/types/User";

function NavLinks({ user, className = "" }: { user: User; className?: string }) {
    const navLinkClass = `text-gray-700 transition-all duration-300 ease-in-out hover:text-[var(--cornell-red)] hover:-translate-y-[2px] ${className}`;
    return (
        <>
            <Link href="/faqs" className={navLinkClass}>FAQs</Link>
            <Link href="/popped" className={navLinkClass}>Popped</Link>
            { user?.user?.is_admin && (
                <Link href="/admin" className={navLinkClass}>Admin</Link>
            )}
        </>
    );
}

function ActionLinks({ vertical = false }) {
    const sendClass = `border border-blue-500 text-blue-500 px-4 py-1.5 rounded-full text-center shadow-md transition-all duration-300 ease-in-out${vertical ? " mb-2" : ""} hover:bg-blue-600 hover:text-white hover:-translate-y-[2px] hover:text-[var(--cornell-red)]`;
    const viewClass = `border border-red-500 text-red-500 px-4 py-1.5 rounded-full text-center shadow-md transition-all duration-300 ease-in-out${vertical ? "" : ""} hover:bg-red-500 hover:text-white hover:-translate-y-[2px] hover:text-[var(--cornell-red)]`;
    return (
        <>
            <Link
                href="/send-message"
                className={sendClass}
            >
                Send Message 💌
            </Link>
            <Link
                href="/messages"
                className={viewClass}
            >
                View Messages 📬
            </Link>
        </>
    );
}

export default function NavBar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const toggleMobileMenu = () => setMobileOpen((open) => !open);
    const { user, config, refreshConfig } = useGlobal();

    const router = useRouter();

    const handleEndImpersonate = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const res = await fetch("/api/admin/end-impersonate");
        if (res.ok) {
            refreshConfig();
            router.push("/messages");
        }
    };

    return (
        <nav className="sticky top-0 z-50 bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/brand on the left */}
                    <div className="flex-shrink-0 flex items-center h-16">
                        <Link href="/" className="inline-block">
                            <img src="../images/logo.png" alt="Cornell Lifted Logo" className="h-8 w-auto" />
                        </Link>
                    </div>

                    {/* Hamburger menu button (visible only on mobile) */}
                    <div className="flex lg:hidden">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-200"
                            aria-label="Toggle navigation"
                            onClick={toggleMobileMenu}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    {/* Navigation items (visible on desktop) */}
                    <div className="hidden lg:flex items-center">
                        <div className="flex space-x-6 mr-6">
                            <NavLinks user={user} />
                        </div>
                        <div className="flex space-x-2">
                            <ActionLinks />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu (hidden by default) */}
            {mobileOpen && (
                <div className="lg:hidden bg-white border-t border-gray-200 shadow-md animate-fade-in-down">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="flex flex-col mb-4">
                            <NavLinks user={user} className="py-2 d-block" />
                            <div className="border-t border-gray-200 my-2" />
                        </div>
                        <div className="flex flex-col space-y-2">
                            <ActionLinks vertical />
                        </div>
                    </div>
                </div>
            )}

            {user?.impersonating && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded flex items-center justify-between mb-2">
                    <span>
                        <strong>Impersonating:</strong> {user.user?.email}
                    </span>
                    <a
                        href="/api/admin/end-impersonate"
                        className="ml-4 px-4 py-2 bg-yellow-400 text-yellow-900 rounded font-semibold shadow hover:bg-yellow-500 transition"
                        onClick={handleEndImpersonate}
                    >
                        End Impersonation
                    </a>
                </div>
            )}
        </nav>
    );
}






