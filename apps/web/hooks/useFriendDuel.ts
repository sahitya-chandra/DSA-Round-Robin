"use client"

import { API_BASE_URL } from "@/lib/api"
import { authClient } from "@/lib/auth-client"
import { useFriendsListStore } from "@/stores/friendsListStore"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export const useFriendDuel = () => {
	const { data: session } = authClient.useSession()
	const userId = session?.user?.id
	const router = useRouter();

	const [loading, setLoading] = useState<Boolean>(false)
	const { setFriendsList } = useFriendsListStore.getState()

	useEffect(() => {
    if (!userId) return;

    const getFriends = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/social/friends`, {
          credentials: "include",
        });
        const data = await res.json();
        setFriendsList(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getFriends();
  }, [userId]);

	return { loading }
}