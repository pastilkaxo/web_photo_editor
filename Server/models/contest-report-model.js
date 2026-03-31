const { Schema, model } = require("mongoose");

const ContestReportSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, default: "" },
  },
  { timestamps: true }
);

ContestReportSchema.index({ project: 1, reporter: 1 }, { unique: true });

module.exports = model("ContestReport", ContestReportSchema);
