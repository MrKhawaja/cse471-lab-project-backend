const express = require("express");
const app = express.Router();
const jwt = require("jsonwebtoken");
const { jwt_secret, uploads, host } = require("../config");
const db = require("../db");
const auth = require("../middleware/auth");
const Joi = require("joi");

// Define your routes here

app.use(express.json());

app.get("/", auth, (req, res) => {
  const phone = req.decoded.phone;
  db.query(
    "select phone,name,picture,email,balance,type from users where phone = ?",
    [phone],
    (err, result) => {
      if (err) throw err;
      if (result.length <= 0) {
        return res.status(400).send("Invalid Token");
      }
      if (result[0].picture)
        result[0].picture = host + "/uploads/" + result[0].picture;
      return res.status(200).send(result[0]);
    }
  );
});

app.post("/", auth, (req, res) => {
  const schema = Joi.object({
    name: Joi.string().min(0).max(255).required(),
    email: Joi.string().min(0).max(255).required().email(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  const { name, email } = value;
  const phone = req.decoded.phone;
  db.query(
    "update users set name = ?, email = ? where phone = ?",
    [name, email, phone],
    (err, result) => {
      if (err) throw err;
      return res.status(200).send("Profile Updated");
    }
  );
});

app.use(express.urlencoded({ extended: true }));

app.post("/picture", auth, uploads.single("image"), (req, res) => {
  const phone = req.decoded.phone;
  const picture = req.file.filename;
  db.query(
    "update users set picture = ? where phone = ?",
    [picture, phone],
    (err, result) => {
      if (err) throw err;
      return res.status(200).send("Profile Updated");
    }
  );
});

app.get("/image/:phone", (req, res) => {
  const phone = req.params.phone;
  db.query(
    "select picture from users where phone = ?",
    [phone],
    (err, result) => {
      if (err) throw err;
      if (result.length <= 0) {
        return res.status(400).send("Invalid Token");
      }
      if (result[0].picture)
        result[0].picture = host + "/uploads/" + result[0].picture;
      return res.status(200).send(result[0]);
    }
  );
});

module.exports = app;
