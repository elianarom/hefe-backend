const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
    {
        tool: { type: mongoose.Schema.Types.ObjectId, ref: "Tool", required: true },
        fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, maxlength: 500 },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Review", ReviewSchema);