"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useSocket } from "@/hooks/useSocket";
import { API_BASE_URL } from "@/lib/api";
import { MinecraftToast } from "./MinecraftToast";
import { useRouter } from "next/navigation";
import { useFriendsListStore } from "@/stores/friendsListStore";
export const FriendInvitationListener = () => {
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user?.id;
  const socket = useSocket(userId || "");

  useEffect(() => {
    if (userId) {
      console.log("FriendInvitationListener active for user:", userId);
    }
  }, [userId]);
  const router = useRouter();
  const { addPendingRequest, removePendingRequest, setOnlineUsers } = useFriendsListStore();

  // const respondedInvitesRef = useRef<Set<string>>(new Set());
  // const markResponded = (inviterId: string) => {
  //   respondedInvitesRef.current.add(inviterId);
  // };

  const handleAccept = async (requestId: string, t: string | number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/social/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        removePendingRequest(requestId);
        toast.success("Friend request accepted");
      } else {
        toast.error("Failed to accept request");
      }
    } catch (error) {
      toast.error("Error accepting request");
    } finally {
      toast.dismiss(t);
    }
  };

  const handleReject = async (requestId: string, t: string | number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/social/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        removePendingRequest(requestId);
        toast.info("Friend request rejected");
      } else {
        toast.error("Failed to reject request");
      }
    } catch (error) {
      toast.error("Error rejecting request");
    } finally {
      toast.dismiss(t);
    }
  };

  useEffect(() => {
    if (!socket || !userId) return;

    const handleFriendRequestReceived = (data: { requestId: string; senderId: string; senderName: string; senderEmail: string }) => {
        console.log("Friend request received:", data);
        
        const newRequest = {
            id: data.requestId,
            fromUser: {
                id: data.senderId,
                name: data.senderName,
                email: data.senderEmail
            }
        };
        
        addPendingRequest(newRequest);
    };

    const handleOnlineUsers = (users: string[]) => {
      setOnlineUsers(users);
    };

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
    socket.on("friend_request_received", handleFriendRequestReceived);
    socket.on("onlineUsers", handleOnlineUsers);

    return () => {
      socket.off("invite_accepted", handleInviteAccepted)
      socket.off("invite_received", handleInviteReceived);
      socket.off("invite_expired", handleInviteExpired);
      socket.off("invite_error", handleInviteError);
      socket.off("invite_rejected", handleInviteRejected);
      socket.off("friend_busy", handleFriendBusy);
      socket.off("friend_request_received", handleFriendRequestReceived);
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, [socket, router, addPendingRequest, removePendingRequest, setOnlineUsers]);

  return null;
};
