import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Clerk User ID (PRIMARY AUTH ID)
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      default: "",
    },

    full_name: {
      type: String,
      default: "",
    },

    username: {
      type: String,
      unique: true,
      sparse: true, // allows empty usernames initially
    },

    bio: {
      type: String,
      default: "Hey there! I am using PingUp.",
    },

    profile_picture: {
      type: String,
      default: "",
    },

    cover_photo: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    connections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    minimize: false,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
