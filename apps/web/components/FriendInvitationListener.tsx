"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useSocket } from "@/hooks/useSocket";
import { MinecraftToast } from "./MinecraftToast";
import { useRouter } from "next/navigation";

export const FriendInvitationListener = () => {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const socket = useSocket(userId || "");
  const router = useRouter();

  // const respondedInvitesRef = useRef<Set<string>>(new Set());
  // const markResponded = (inviterId: string) => {
  //   respondedInvitesRef.current.add(inviterId);
  // };

  useEffect(() => {
    if (!socket) return;

    const handleInviteReceived = (data: { inviterId: string; inviterName?: string }) => {
      console.log("Invite received:", data);
      
      toast.custom(
        (t) => (
          <MinecraftToast
            inviterName={data.inviterName || "Unknown Friend"}
            duration={10000}
            onAccept={() => {
              socket.emit("invite_response", {
                inviterId: data.inviterId,
                response: "accept",
              });
              toast.dismiss(t);
            }}
            onReject={() => {
              socket.emit("invite_response", {
                inviterId: data.inviterId,
                response: "reject",
              });
              toast.dismiss(t);
            }}
          />
        ),
        {
          duration: 10000,
          id: `invite-${data.inviterId}`,
        }
      );
    };

    const handleInviteExpired = (data: { friendId?: string }) => {
      if (!data.friendId) return;

      // const alreadyHandled =
      //   respondedInvitesRef.current.has(data.friendId);

      // if (!alreadyHandled) {
        toast.info("Invitation expired (no response)");
      // }
    };

    const handleInviteError = (data: { inviterId: string; message: string }) => {
      toast.error(data.message);
    };

    const handleInviteAccepted = (data: { friendId: string }) => {
      toast.info("Friend accepted the invitation");
    };

    const handleInviteRejected = (data: { friendId: string }) => {
      toast.info("Friend rejected the invitation");
    };

    const handleFriendBusy = (data: { friendId: string }) => {
      // markResponded(data.friendId);
      toast.error("Friend is currently in a match");
    };

    socket.on("invite_accepted", handleInviteAccepted)
    socket.on("invite_received", handleInviteReceived);
    socket.on("invite_expired", handleInviteExpired);
    socket.on("invite_error", handleInviteError);
    socket.on("invite_rejected", handleInviteRejected);
    socket.on("friend_busy", handleFriendBusy);

    return () => {
      socket.off("invite_accepted", handleInviteAccepted)
      socket.off("invite_received", handleInviteReceived);
      socket.off("invite_expired", handleInviteExpired);
      socket.off("invite_error", handleInviteError);
      socket.off("invite_rejected", handleInviteRejected);
      socket.off("friend_busy", handleFriendBusy);
    };
  }, [socket, router]);

  return null;
};
