'use client';

import Link from 'next/link';
import { ShieldCheck, Camera, Calendar, ArrowLeftRight, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { userApi, authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RoleApplicationsPage() {
  const { user, updateUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const isOrganizer = user?.roles.includes('organizer');

  const handleBecomeOrganizer = async () => {
    setIsUpdating(true);
    try {
      const res = await userApi.becomeOrganizer();
      if (res.success) {
        toast.success('You are now an organizer!');
        // Refresh user data
        const userRes = await authApi.getMe();
        if (userRes.success) {
          // Normalize roles (same as AuthContext does)
          const userData = userRes.data;
          const roles = userData.roles || [userData.role || 'guest'];
          const normalizedRoles = roles.map((r: string) => r === 'student' || r === 'guest' ? 'user' : r);

          updateUser({
            id: userData._id || userData.id || '',
            email: userData.email || '',
            name: userData.name || '',
            avatar: userData.avatar,
            role: normalizedRoles[0] || 'user',
            roles: normalizedRoles,
            faceRegistered: !!userData.faceId,
            settings: userData.settings,
          });
          
          // Refresh and redirect to dashboard after becoming organizer
          window.location.href = '/dashboard';
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Card */}
        <div className="card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-mesh opacity-30"></div>
          <div className="relative flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 bg-violet-500/20 text-violet-400 px-3 py-1.5 rounded-full text-sm w-fit border border-violet-500/20">
              <ShieldCheck className="h-4 w-4" />
              Role access
            </div>
            <h1 className="text-3xl font-bold text-white">Apply for organizer or photographer</h1>
            <p className="text-gray-400 max-w-3xl">
              Choose how you want to contribute. Organizer access enables full event CRUD and photo
              review. Photographer access focuses on bulk RAW uploads to S3 that trigger Lambda + Rekognition.
            </p>
            {!user && (
              <div className="flex gap-3 mt-2">
                <Link href="/login">
                  <Button className="bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-500/20">Login</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="border-white/10 text-gray-300 hover:bg-white/5">Create account</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Organizer Card */}
          <div className="card group hover:border-violet-500/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-lg">Organizer</p>
                <p className="text-sm text-gray-500">Full event CRUD + moderation</p>
              </div>
            </div>
            <ul className="text-sm text-gray-400 space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                <span>Create, update, and delete events</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                <span>Upload event photos (bulk) to RAW S3</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                <span>Review & approve public photos</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                <span>Attendee visibility after face matching</span>
              </li>
            </ul>
            <div className="flex gap-3">
              {isOrganizer ? (
                <>
                  <Link href="/organizer/events">
                    <Button className="bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20">
                      Go to organizer tools
                    </Button>
                  </Link>
                  <Link href="/admin/moderate">
                    <Button variant="outline" className="border-white/10 text-gray-300 hover:bg-white/5">
                      Review photos
                    </Button>
                  </Link>
                </>
              ) : (
                <Button
                  onClick={handleBecomeOrganizer}
                  disabled={isUpdating || !user}
                  className="bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 w-full"
                >
                  {isUpdating ? 'Updating...' : 'Become an Organizer'}
                </Button>
              )}
            </div>
          </div>

          {/* Photographer Card */}
          <div className="card group hover:border-violet-500/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <Camera className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-lg">Photographer</p>
                <p className="text-sm text-gray-500">Bulk RAW ingest to S3</p>
              </div>
            </div>
            <ul className="text-sm text-gray-400 space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                <span>Upload up to 100 photos per batch</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                <span>Lambda auto-runs moderation + Rekognition</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                <span>Matched faces reach registered users automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                <span>Public-safe photos enter event galleries</span>
              </li>
            </ul>
            <div className="flex gap-3">
              <Link href="/photographer/upload">
                <Button className="bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-500/20">
                  Bulk upload to RAW
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="border-white/10 text-gray-300 hover:bg-white/5">
                  Open dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Help Card */}
        <div className="card bg-violet-500/5 border-violet-500/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-white mb-1">Need a role change?</p>
              <p className="text-sm text-gray-400">
                If your account doesn&apos;t yet have organizer/photographer permissions, please contact
                an admin or submit your request via support. Once the backend role is updated, your dashboard
                will switch automatically after re-login.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
