import PrismaClient from "@repo/db";
import { Request, Response } from "express";
import { AuthRequest } from "../types/types";

const prisma = PrismaClient;

/**
 * 🔍 Search Friend by name
 * Query: ?userName=div&userId=abc123
 */
export const searchFriend = async (req: Request, res: Response) => {
  try {
    const { userName, userId } = req.query as { userName?: string; userId?: string };
    if (!userName || !userId)
      return res.status(400).json({ error: "Missing search or userId" });

    const users = await prisma.user.findMany({
      where: {
        name: { contains: userName, mode: "insensitive" },
        NOT: { id: userId },
      },
      select: { id: true, name: true, email: true },
    });

    const results = await Promise.all(
      users.map(async (user: any) => {
        const existingReq = await prisma.friendRequest.findFirst({
          where: {
            OR: [
              { requesterId: userId, addresseeId: user.id },
              { requesterId: user.id, addresseeId: userId },
            ],
          },
        });

        const existingFriend = await prisma.friend.findFirst({
          where: {
            OR: [
              { userAId: userId, userBId: user.id },
              { userAId: user.id, userBId: userId },
            ],
          },
        });

        let friendStatus: "PENDING" | "REJECTED" | "NONE" | "FRIEND" | "ACCEPTED" = "NONE";
        if (existingFriend) friendStatus = "FRIEND";
        else if (existingReq) friendStatus = existingReq.status;

        return { ...user, friendStatus };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("searchFriend error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * 📤 Send Friend Request
 * Body: { userId, friendId }
 */
// ... imports
import { getIo } from "../utils/socketInstance";

// ... existing code

/**
 * 📤 Send Friend Request
 * Body: { userId, friendId }
 */
export const friendReq = async (req: Request, res: Response) => {
  try {
    const { userId, friendId } = req.body;
    if (!userId || !friendId)
      return res.status(400).json({ error: "Missing userId or friendId" });

    const existing = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: userId },
        ],
      },
    });

    if (existing)
      return res.status(200).json({ success: false, message: "Already exists" });

    const newRequest = await prisma.friendRequest.create({
      data: {
        requesterId: userId,
        addresseeId: friendId,
      },
      include: {
        requester: { select: { id: true, name: true, email: true } }
      }
    });

    // Emit socket event to the recipient
    const io = getIo();
    io.to(friendId).emit("friend_request_received", {
        request: {
            id: newRequest.id,
            fromUser: newRequest.requester,
            createdAt: newRequest.createdAt
        }
    });

    res.json({ success: true, message: "Friend request sent" });
  } catch (err) {
    console.error("friendReq error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * 📥 Get all Friend Requests for a user
 * Query: ?userId=abc123
 */
export const getAllFriendReq = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query as { userId?: string };
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const requests = await prisma.friendRequest.findMany({
      where: { addresseeId: userId, status: "PENDING" },
      include: {
        requester: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = requests.map((r: any) => ({
      id: r.id,
      fromUser: r.requester,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("getAllFriendReq error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * ✅ Accept Friend Request
 * Body: { requestId }
 */
export const acceptFriendReq = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ error: "Missing requestId" });

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) return res.status(404).json({ error: "Request not found" });

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
    });

    await prisma.friend.create({
      data: {
        userAId: request.requesterId,
        userBId: request.addresseeId,
      },
    });

    res.json({ success: true, message: "Friend request accepted" });
  } catch (err) {
    console.error("acceptFriendReq error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * ❌ Reject Friend Request
 * Body: { requestId }
 */
export const rejectReq = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ error: "Missing requestId" });

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });

    res.json({ success: true, message: "Request rejected" });
  } catch (err) {
    console.error("rejectReq error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * 👯 Get Friends list
 * Body: { userId }
 */
export const getFriends = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const friends = await prisma.friend.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { select: { id: true, name: true, email: true } },
        userB: { select: { id: true, name: true, email: true } },
      },
    });

    const list = friends.map((f: any) =>
      f.userAId === userId ? f.userB : f.userA
    );

    res.json(list);
  } catch (err) {
    console.error("getFriends error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
