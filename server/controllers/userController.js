import imagekit from "../configs/imageKit.js";
import { inngest } from "../inngest/index.js";
import Connection from "../models/Connection.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import fs from "fs";
import { clerkClient } from "@clerk/express";

/* --------------------------------------------------
   Helper: Ensure Mongo User Exists (Clerk → Mongo)
-------------------------------------------------- */
const getOrCreateUser = async (clerkId) => {
  let user = await User.findOne({ clerkId });

  if (!user) {
    user = await User.create({
      clerkId,
      connections: [],
      followers: [],
      following: [],
    });
  }

  return user;
};

/* --------------------------------------------------
   Get Logged-in User Data
-------------------------------------------------- */
export const getUserData = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await getOrCreateUser(userId);

    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------
   Update User Profile
-------------------------------------------------- */
export const updateUserData = async (req, res) => {
  try {
    const { userId } = req.auth();
    let user = await getOrCreateUser(userId);

    let { username, bio, location, full_name } = req.body;

    // Username uniqueness
    if (username && username !== user.username) {
      const exists = await User.findOne({ username });
      if (exists) username = user.username;
    }

    const updatedData = {
      username: username ?? user.username,
      bio,
      location,
      full_name,
    };

    const profile = req.files?.profile?.[0];
    const cover = req.files?.cover?.[0];

    if (profile) {
      const buffer = fs.readFileSync(profile.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: profile.originalname,
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [{ quality: "auto" }, { format: "webp" }, { width: "512" }],
      });

      updatedData.profile_picture = url;

      const blob = await fetch(url).then((r) => r.blob());
      await clerkClient.users.updateUserProfileImage(userId, { file: blob });
    }

    if (cover) {
      const buffer = fs.readFileSync(cover.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: cover.originalname,
      });

      updatedData.cover_photo = imagekit.url({
        path: response.filePath,
        transformation: [{ quality: "auto" }, { format: "webp" }, { width: "1280" }],
      });
    }

    user = await User.findOneAndUpdate(
      { clerkId: userId },
      updatedData,
      { new: true }
    );

    res.json({ success: true, user, message: "Profile updated successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------
   Discover Users
-------------------------------------------------- */
export const discoverUsers = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { input } = req.body;

    const users = await User.find({
      $or: [
        { username: new RegExp(input, "i") },
        { email: new RegExp(input, "i") },
        { full_name: new RegExp(input, "i") },
        { location: new RegExp(input, "i") },
      ],
    });

    const filtered = users.filter((u) => u.clerkId !== userId);

    res.json({ success: true, users: filtered });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------
   Follow User
-------------------------------------------------- */
export const followUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body; // Mongo ObjectId

    const user = await getOrCreateUser(userId);
    const toUser = await User.findById(id);

    if (!toUser) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.following.some((u) => u.toString() === id)) {
      return res.json({ success: false, message: "Already following" });
    }

    user.following.push(toUser._id);
    toUser.followers.push(user._id);

    await user.save();
    await toUser.save();

    res.json({ success: true, message: "Now you are following this user" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------
   Unfollow User
-------------------------------------------------- */
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const user = await getOrCreateUser(userId);
    const toUser = await User.findById(id);

    user.following = user.following.filter(
      (u) => u.toString() !== id
    );
    toUser.followers = toUser.followers.filter(
      (u) => u.toString() !== user._id.toString()
    );

    await user.save();
    await toUser.save();

    res.json({ success: true, message: "You unfollowed the user" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------
   Send Connection Request
-------------------------------------------------- */
export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const user = await getOrCreateUser(userId);

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await Connection.countDocuments({
      from_user_id: user._id,
      created_at: { $gt: last24Hours },
    });

    if (count >= 20) {
      return res.json({
        success: false,
        message: "Connection limit reached",
      });
    }

    const exists = await Connection.findOne({
      $or: [
        { from_user_id: user._id, to_user_id: id },
        { from_user_id: id, to_user_id: user._id },
      ],
    });

    if (exists) {
      return res.json({
        success: false,
        message: "Connection already exists",
      });
    }

    const connection = await Connection.create({
      from_user_id: user._id,
      to_user_id: id,
    });

    await inngest.send({
      name: "app/connection-request",
      data: { connectionId: connection._id },
    });

    res.json({ success: true, message: "Connection request sent" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------
   Get User Connections
-------------------------------------------------- */
export const getUserConnections = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await getOrCreateUser(userId);

    await user.populate("connections followers following");

    const pendingConnections = (
      await Connection.find({
        to_user_id: user._id,
        status: "pending",
      }).populate("from_user_id")
    ).map((c) => c.from_user_id);

    res.json({
      success: true,
      connections: user.connections,
      followers: user.followers,
      following: user.following,
      pendingConnections,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------
   Accept Connection Request
-------------------------------------------------- */
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const user = await getOrCreateUser(userId);
    const toUser = await User.findById(id);

    const connection = await Connection.findOne({
      from_user_id: id,
      to_user_id: user._id,
    });

    if (!connection) {
      return res.json({ success: false, message: "Request not found" });
    }

    user.connections.push(toUser._id);
    toUser.connections.push(user._id);

    connection.status = "accepted";

    await user.save();
    await toUser.save();
    await connection.save();

    res.json({ success: true, message: "Connection accepted" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------
   Get User Profile + Posts
-------------------------------------------------- */
export const getUserProfiles = async (req, res) => {
  try {
    const { profileId } = req.body;

    const profile = await User.findById(profileId);
    if (!profile) {
      return res.json({ success: false, message: "Profile not found" });
    }

    const posts = await Post.find({ user: profileId }).populate("user");

    res.json({ success: true, profile, posts });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
