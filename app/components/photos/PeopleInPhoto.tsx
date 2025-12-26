'use client';

import { Users, User } from 'lucide-react';

interface PeopleInPhotoProps {
  faceMatches: Array<{
    userId: {
      _id: string;
      name: string;
      avatar?: string;
    };
    confidence: number;
  }>;
}

export default function PeopleInPhoto({ faceMatches }: PeopleInPhotoProps) {
  if (!faceMatches || faceMatches.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Users className="h-4 w-4 text-gray-500" />
      {faceMatches.map((match, idx) => {
        const user = match.userId;
        return (
          <div
            key={idx}
            className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-full"
            title={`${user.name} (${Math.round(match.confidence)}% match)`}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs">
                {user.name?.charAt(0) || '?'}
              </div>
            )}
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-gray-500">
              {Math.round(match.confidence)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

