import express from "express";
import {
  searchFriend,
  friendReq,
  getAllFriendReq,
  acceptFriendReq,
  rejectReq,
  getFriends,
} from "../controllers/socail.contoller";

const router: express.Router = express.Router();

router.get("/search", searchFriend);
router.post("/request", friendReq);
router.get("/requests", getAllFriendReq);
router.post("/accept", acceptFriendReq);
router.post("/reject", rejectReq);
router.get("/friends", getFriends);

export default router;
