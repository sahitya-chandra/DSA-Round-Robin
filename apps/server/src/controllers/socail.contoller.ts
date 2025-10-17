import prisma from "@repo/db";
import { Request , Response  } from "express";


export async function searchFriend(req: Request, res: Response) {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "User ID required" });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.error("Error searching friend:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function friendReq(req: Request, res: Response) {
  const { userId: sender, friendId: receiver } = req.body;

  if (!sender || !receiver)
    return res.status(400).json({ message: "Missing sender or receiver ID" });
  if (sender === receiver)
    return res.status(400).json({ message: "You cannot add yourself" });

  try {
    const existingReq = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { requesterId: sender, addresseeId: receiver },
          { requesterId: receiver, addresseeId: sender },
        ],
        status: "PENDING",
      },
    });
    if (existingReq)
      return res.status(400).json({ message: "Friend request already exists" });

    const friendReq = await prisma.friendRequest.create({
      data: { requesterId: sender, addresseeId: receiver },
    });

    res.status(201).json(friendReq);
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getAllFriendReq(req: Request, res: Response) {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "User ID required" });

  try {
    const requests = await prisma.friendRequest.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });

    if (requests.length === 0)
      return res.status(404).json({ message: "No friend requests found" });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendReq(req: Request, res: Response) {
  const { userId: sender, friendId: receiver } = req.body;
  if (!sender || !receiver)
    return res.status(400).json({ message: "Missing sender or receiver ID" });

  try {
    const alreadyFriends = await prisma.friend.findFirst({
      where: {
        OR: [
          { userAId: sender, userBId: receiver },
          { userAId: receiver, userBId: sender },
        ],
      },
    });
    if (alreadyFriends)
      return res.status(400).json({ message: "You are already friends" });

    const existingReq = await prisma.friendRequest.findFirst({
      where: {
        requesterId: sender,
        addresseeId: receiver,
        status: "PENDING",
      },
    });

    if (!existingReq)
      return res
        .status(404)
        .json({ message: "No pending friend request found" });

    await prisma.friendRequest.update({
      where: { id: existingReq.id },
      data: { status: "ACCEPTED" },
    });

    await prisma.friend.create({
      data: { userAId: sender, userBId: receiver },
    });

    res.status(200).json({ message: "Friend request accepted successfully" });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function rejectReq(req: Request, res: Response) {
  const { userId: sender, friendId: receiver } = req.body;
  if (!sender || !receiver)
    return res.status(400).json({ message: "Missing sender or receiver ID" });

  try {
    const existingReq = await prisma.friendRequest.findFirst({
      where: {
        requesterId: sender,
        addresseeId: receiver,
        status: "PENDING",
      },
    });

    if (!existingReq)
      return res
        .status(404)
        .json({ message: "No pending friend request found" });

    await prisma.friendRequest.update({
      where: { id: existingReq.id },
      data: { status: "REJECTED" },
    });

    res.status(200).json({ message: "Friend req rejected" });
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriends(req: Request, res: Response) {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "User ID required" });

  try {
    const allFriends = await prisma.friend.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    });

    if (allFriends.length === 0)
      return res
        .status(200)
        .json({ msg: "No friends yet — just a solo rider" });
    res.status(200).json(allFriends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
