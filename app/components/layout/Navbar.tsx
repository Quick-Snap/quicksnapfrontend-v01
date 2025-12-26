'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { Camera, Menu, X, User, LogOut, Home, Image as ImageIcon, Calendar, Shield, Settings, Upload, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { UserRole } from '@/types';

export default function Navbar() {
  const { user, logout, switchRole, activeRole } = useAuth();
  const { role, roles, isAdmin, isOrganizer, isPhotographer } = useRole();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Debug logging
  console.log('[Navbar] user:', user);
  console.log('[Navbar] roles:', roles);
  console.log('[Navbar] activeRole:', activeRole);
  console.log('[Navbar] current role:', role);
  console.log('[Navbar] roles.length > 1:', roles.length > 1);

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
    const nav = [
      { name: 'Home', href: '/dashboard', icon: Home },
    ];

    // Add role-specific items
    if (isAdmin) {
      nav.push({ name: 'Events', href: '/events', icon: Calendar });
      nav.push({ name: 'My Photos', href: '/photos', icon: ImageIcon });
      nav.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
    } else if (isOrganizer) {
      // Organizers only see My Events (no Events, My Photos, or Photographer Upload)
      nav.push({ name: 'My Events', href: '/organizer/events', icon: Calendar });
    } else if (isPhotographer) {
      nav.push({ name: 'Events', href: '/events', icon: Calendar });
      nav.push({ name: 'Upload Photos', href: '/photographer/upload', icon: Upload });
    } else {
      // Regular users (guests)
      nav.push({ name: 'Events', href: '/events', icon: Calendar });
      nav.push({ name: 'My Photos', href: '/photos', icon: ImageIcon });
    }

    return nav;
  };

  const navigation = getNavigation();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-[#0d0d0d]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-wide text-white">
              QUICKSNAP
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive(item.href)
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                {/* Role Switcher Dropdown */}
                {roles.length > 1 && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10"
                    >
                      <span className={`text-sm font-medium ${roleColors[role] || 'text-gray-400'}`}>
                        {roleLabels[role] || role}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {roleDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl shadow-black/50 py-2 z-50">
                        <div className="px-3 py-2 border-b border-white/10">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Switch Role</p>
                        </div>
                        {roles.map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              switchRole(r as UserRole);
                              setRoleDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex items-center justify-between ${r === role ? 'bg-violet-500/10' : ''
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
                    className="flex items-center space-x-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all duration-200 group"
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
                      <div className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                        {/* User Info Header */}
                        <div className="p-4 bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border-b border-white/5">
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
                              <p className="font-semibold text-white truncate">{user.name}</p>
                              <p className="text-sm text-gray-400 truncate">{user.email}</p>
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
                            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                              <User className="h-4 w-4 text-violet-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">My Profile</p>
                              <p className="text-xs text-gray-500">View and edit your profile</p>
                            </div>
                          </Link>

                          <Link
                            href="/settings"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                              <Settings className="h-4 w-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Settings</p>
                              <p className="text-xs text-gray-500">Preferences & account</p>
                            </div>
                          </Link>

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
                        </div>

                        {/* Divider */}
                        <div className="mx-3 border-t border-white/5"></div>

                        {/* Logout */}
                        <div className="p-2">
                          <button
                            onClick={() => {
                              logout();
                              setProfileDropdownOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                              <LogOut className="h-4 w-4 text-red-400" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-sm">Sign Out</p>
                              <p className="text-xs text-red-400/60">See you next time!</p>
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
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors text-sm font-medium"
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

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/5 animate-slide-down">
            <div className="flex flex-col space-y-1">
              {/* Mobile Role Switcher */}
              {user && roles.length > 1 && (
                <div className="px-4 py-3 border-b border-white/5 mb-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Active Role</p>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          switchRole(r as UserRole);
                          setMobileMenuOpen(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${r === role
                          ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
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
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${isActive(item.href)
                      ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-4 border-t border-white/5">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg text-center font-medium"
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
