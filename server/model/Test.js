const mongoose = require("mongoose");

const TestSchema = new mongoose.Schema({
  title: {
    type: String,
    unique: true
  },
  mandatoryCategory: [String],
  optionalCategory: [String],
  startTime: Number,
  endTime: Number,
  description: String,
  testUrl: String
},
  { timestamps: true });

module.exports = Test = mongoose.model("Test", TestSchema);
