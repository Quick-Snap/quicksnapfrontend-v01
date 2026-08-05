'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { Menu, X, User, LogOut, Home, Image as ImageIcon, Calendar, Shield, Settings, Upload, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from 'react-query';
import { UserRole } from '@/types';
import { adminOrganizerRequestApi } from '@/lib/api';
import { ThemeToggle } from '@/app/components/ui/ThemeToggle';
import { BrandLogo } from '@/components/BrandLogo';

const LOGIN_PATH = '/login';

/** Protected app routes — guests (e.g. shared event links) go to login instead. */
function hrefForAuth(href: string, isLoggedIn: boolean) {
  return isLoggedIn ? href : LOGIN_PATH;
}

export default function Navbar() {
  const { user, logout, switchRole, activeRole } = useAuth();
  const isLoggedIn = !!user;
  const { role, roles, isAdmin, isOrganizer, isPhotographer } = useRole();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const { data: organizerStats } = useQuery(
    'organizerRequestStatsNav',
    () => adminOrganizerRequestApi.stats(),
    { enabled: isAdmin, staleTime: 60_000, refetchInterval: 120_000 }
  );
  const pendingOrganizerRequests = organizerStats?.data?.pending ?? 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Role display labels
  const roleLabels: Record<string, string> = {
    user: 'Guest',
    guest: 'Guest',
    organizer: 'Organizer',
    photographer: 'Photographer',
    admin: 'Admin',
  };

  const roleColors: Record<string, string> = {
    user: 'text-emerald-400',
    guest: 'text-emerald-400',
    organizer: 'text-blue-400',
    photographer: 'text-violet-400',
    admin: 'text-purple-400',
  };

  // Build navigation based on role
  const getNavigation = () => {
    // Shared event / public pages: same nav labels, but require sign-in
    if (!isLoggedIn) {
      return [
        { name: 'Home', href: LOGIN_PATH, icon: Home },
        { name: 'Events', href: LOGIN_PATH, icon: Calendar },
        { name: 'My Photos', href: LOGIN_PATH, icon: ImageIcon },
      ];
    }

    const nav = [
      { name: 'Home', href: '/dashboard', icon: Home },
    ];

    // Add role-specific items
    if (isAdmin) {
      nav.push({ name: 'Events', href: '/events', icon: Calendar });
      nav.push({ name: 'My Photos', href: '/photos', icon: ImageIcon });
      nav.push({ name: 'Organizer Requests', href: '/admin', icon: Shield });
    } else if (isOrganizer) {
      // Organizers only see My Events (no Events, My Photos, or Photographer Upload)
      nav.push({ name: 'My Events', href: '/organizer/events', icon: Calendar });
    } else if (isPhotographer) {
      nav.push({ name: 'Upload Photos', href: '/photographer/upload', icon: Upload });
    } else {
      // Regular users (guests)
      nav.push({ name: 'Events', href: '/events', icon: Calendar });
      nav.push({ name: 'My Photos', href: '/photos', icon: ImageIcon });
    }

    return nav;
  };

  const navigation = getNavigation();

  const isActive = (path: string) => isLoggedIn && pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200/90 bg-white/85 backdrop-blur-xl dark:border-white/5 dark:bg-[#0d0d0d]/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-2 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:justify-normal md:gap-4">
          {/* Logo */}
          <div className="flex min-w-0 shrink-0 items-center md:justify-self-start">
            <BrandLogo href={hrefForAuth('/dashboard', isLoggedIn)} size="sm" tone="auto" />
          </div>

          {/* Desktop Navigation — centered in navbar via middle grid column */}
          <div className="hidden md:flex md:items-center md:justify-center md:justify-self-center md:space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive(item.href)
                    ? 'bg-violet-500/15 text-violet-700 border border-violet-400/40 dark:bg-violet-500/20 dark:text-violet-400 dark:border-violet-500/30'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                  {item.href === '/admin' && pendingOrganizerRequests > 0 && (
                    <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white">
                      {pendingOrganizerRequests}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile: theme then menu (hamburger far right). Desktop: theme + user — right grid column */}
          <div className="flex shrink-0 items-center gap-1 md:col-start-3 md:justify-self-end md:gap-3">
            <ThemeToggle size="navbar" className="shrink-0" />
            <button
              type="button"
              className="-mr-0.5 rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:hidden dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="hidden md:flex md:items-center md:space-x-3">
            {user ? (
              <>
                {/* Role Switcher Dropdown */}
                {roles.length > 1 && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                      className="flex items-center space-x-2 rounded-lg border border-zinc-200/90 bg-zinc-50 px-3 py-1.5 transition-all hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <span className={`text-sm font-medium ${roleColors[role] || 'text-gray-400'}`}>
                        {roleLabels[role] || role}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {roleDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200/90 bg-white py-2 shadow-xl shadow-zinc-900/10 dark:border-white/10 dark:bg-[#1a1a1a] dark:shadow-black/50 z-50">
                        <div className="border-b border-zinc-100 px-3 py-2 dark:border-white/10">
                          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-gray-500">Switch Role</p>
                        </div>
                        {roles.map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              switchRole(r as UserRole);
                              setRoleDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 transition-colors flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/5 ${r === role ? 'bg-violet-500/10' : ''
                              }`}
                          >
                            <span className={`text-sm font-medium ${roleColors[r] || 'text-gray-400'}`}>
                              {roleLabels[r] || r}
                            </span>
                            {r === role && (
                              <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="group flex items-center space-x-2 rounded-xl px-2 py-1.5 transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-white/5"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-9 w-9 rounded-xl ring-2 ring-violet-500/30 group-hover:ring-violet-500/50 transition-all"
                      />
                    ) : (
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white font-semibold text-sm ${isAdmin ? 'bg-gradient-to-br from-violet-600 to-purple-600' : isOrganizer ? 'bg-gradient-to-br from-blue-600 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        } ring-2 ring-white/10 group-hover:ring-white/20 transition-all shadow-lg`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {profileDropdownOpen && (
                      <div className="absolute right-0 mt-3 w-72 origin-top-right animate-dropdown-in">
                      <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/95 shadow-2xl shadow-zinc-900/15 backdrop-blur-xl dark:border-white/10 dark:bg-[#1a1a1a]/95 dark:shadow-black/50">
                        {/* User Info Header */}
                        <div className="border-b border-zinc-100 bg-gradient-to-br from-violet-600/[0.08] to-indigo-600/[0.08] p-4 dark:border-white/5 dark:from-violet-600/10 dark:to-indigo-600/10">
                          <div className="flex items-center space-x-3">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-12 w-12 rounded-xl ring-2 ring-violet-500/30"
                              />
                            ) : (
                              <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${isAdmin ? 'bg-gradient-to-br from-violet-600 to-purple-600' : isOrganizer ? 'bg-gradient-to-br from-blue-600 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                } shadow-lg`}>
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-semibold text-zinc-900 dark:text-white">{user.name}</p>
                              <p className="truncate text-sm text-zinc-500 dark:text-gray-400">{user.email}</p>
                              {role && (
                                <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                                  isAdmin ? 'bg-purple-500/20 text-purple-400' : 
                                  isOrganizer ? 'bg-blue-500/20 text-blue-400' : 
                                  'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                  {roleLabels[role] || role}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                          <Link
                            href="/profile"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="group flex items-center space-x-3 rounded-xl px-3 py-2.5 text-zinc-700 transition-all hover:bg-zinc-50 hover:text-zinc-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 transition-colors group-hover:bg-violet-500/20">
                              <User className="h-4 w-4 text-violet-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">My Profile</p>
                              <p className="text-xs text-zinc-500 dark:text-gray-500">View and edit your profile</p>
                            </div>
                          </Link>

                          <Link
                            href="/settings"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="group flex items-center space-x-3 rounded-xl px-3 py-2.5 text-zinc-700 transition-all hover:bg-zinc-50 hover:text-zinc-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
                              <Settings className="h-4 w-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Settings</p>
                              <p className="text-xs text-zinc-500 dark:text-gray-500">Preferences & account</p>
                            </div>
                          </Link>

                          {/* Apply for Role — hidden until roles flow is ready
                          <Link
                            href="/roles"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                              <Shield className="h-4 w-4 text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Apply for Role</p>
                              <p className="text-xs text-gray-500">Become organizer or photographer</p>
                            </div>
                          </Link>
                          */}
                        </div>

                        {/* Divider */}
                        <div className="mx-3 border-t border-zinc-100 dark:border-white/5"></div>

                        {/* Logout */}
                        <div className="p-2">
                          <button
                            onClick={() => {
                              logout();
                              setProfileDropdownOpen(false);
                            }}
                            className="group flex w-full items-center space-x-3 rounded-xl px-3 py-2.5 text-red-600 transition-all hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                          >
                            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                              <LogOut className="h-4 w-4 text-red-400" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-sm">Sign Out</p>
                              <p className="text-xs text-red-500/80 dark:text-red-400/60">See you next time!</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="animate-slide-down border-t border-zinc-200/90 py-4 dark:border-white/5 md:hidden">
            <div className="flex flex-col space-y-1">
              {/* Mobile Role Switcher */}
              {user && roles.length > 1 && (
                <div className="mb-2 border-b border-zinc-100 px-4 py-3 dark:border-white/5">
                  <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-gray-500">Active Role</p>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          switchRole(r as UserRole);
                          setMobileMenuOpen(false);
                        }}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${r === role
                          ? 'border border-violet-400/50 bg-violet-500/15 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/20 dark:text-violet-400'
                          : 'border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
                          }`}
                      >
                        {roleLabels[r] || r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-all ${isActive(item.href)
                      ? 'border border-violet-400/50 bg-violet-500/15 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/20 dark:text-violet-400'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                    {item.href === '/admin' && pendingOrganizerRequests > 0 && (
                      <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                        {pendingOrganizerRequests}
                      </span>
                    )}
                  </Link>
                );
              })}
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-all ${isActive('/profile')
                      ? 'border border-violet-400/50 bg-violet-500/15 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/20 dark:text-violet-400'
                      : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white'
                      }`}
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">My Profile</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 rounded-lg px-4 py-3 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    <Home className="h-5 w-5" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 rounded-lg px-4 py-3 text-left text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 border-t border-zinc-200/90 pt-4 dark:border-white/5">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-4 py-3 text-center font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-500 text-center font-medium shadow-lg shadow-violet-500/20"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
