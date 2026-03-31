const { Schema, model } = require("mongoose");

const ContestWeekSchema = new Schema(
  {
    weekIndex: { type: Number, required: true, unique: true },
    theme: { type: String, required: true },
    startsAt: { type: Date, required: true },
    submissionEndsAt: { type: Date, required: true },
    votingEndsAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "CLOSED"],
      default: "ACTIVE",
    },
    winners: {
      communityPlaces: [{ type: Schema.Types.ObjectId, ref: "Project" }],
      mostDiscussedProject: { type: Schema.Types.ObjectId, ref: "Project" },
      recognitionByProject: { type: Schema.Types.Mixed, default: {} },
    },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ContestWeekSchema.index({ status: 1, startsAt: -1 });

module.exports = model("ContestWeek", ContestWeekSchema);
