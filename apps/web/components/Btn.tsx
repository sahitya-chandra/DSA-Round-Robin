"use client"

import { Button } from "./ui/button"
import { useSocket } from "@/hooks/useSocket"

export const Btn = ({userId}: {userId: string | undefined}) => {
  if(!userId) return
  const data = useSocket(userId)
  
  const match = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/match", {
        method: "POST",
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json(); 
      
      console.log("Response data:", data);

    } catch (error) {
      console.error("Match error:", error);
    }
  }

  return (
    <Button onClick={match}>start match</Button>
  )
}