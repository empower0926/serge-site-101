const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const newsletterScheme = new Schema({
  postURL: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    require: true,
    trim: true,
  },
  content: {
    type: String,
    require: true,
    trim: true,
  },
  imageURL: {
    type: String,
    trim: true,
    required: true,
  },
  ogcontent: {
    type: String,
    trim: true,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  date: {
    type: Date,
    required: true,
  },
  tag: {
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model("Newsletter", newsletterScheme);
