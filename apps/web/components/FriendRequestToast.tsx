"use client";

import React from "react";
import { Check, X } from "lucide-react";

interface FriendRequestToastProps {
  requesterName: string;
  onAccept: () => void;
  onReject: () => void;
}

export const FriendRequestToast: React.FC<FriendRequestToastProps> = ({
  requesterName,
  onAccept,
  onReject,
}) => {
  return (
    <div className="flex flex-col bg-card border-2 pixel-border-outset p-4 w-80 shadow-lg font-minecraft text-foreground">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-yellow-400 animate-pulse" />
        <span className="text-sm font-bold text-yellow-400 tracking-wide uppercase">
          New Request
        </span>
      </div>
      
      <p className="text-sm mb-4 leading-relaxed">
        <span className="font-bold text-primary">{requesterName}</span> sent you a friend request!
      </p>

      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-3 py-2 text-xs font-bold pixel-border-outset active:pixel-border-inset transition-colors"
        >
          <Check className="w-4 h-4" />
          ACCEPT
        </button>
        <button
          onClick={onReject}
          className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-3 py-2 text-xs font-bold pixel-border-outset active:pixel-border-inset transition-colors"
        >
          <X className="w-4 h-4" />
          REJECT
        </button>
      </div>
    </div>
  );
};
