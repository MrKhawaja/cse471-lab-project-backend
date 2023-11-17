const express = require("express");
const app = express.Router();
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { jwt_secret, uploads } = require("../config");
const db = require("../db");
const auth = require("../middleware/auth");

// Define your routes here

const validate = (body) => {
  const schema = Joi.object({
    amount: Joi.number().min(1).required(),
    receiver: Joi.string().min(14).max(14).required(),
  });
  return schema.validate(body);
};

app.use(express.json());

app.post("/send", auth, (req, res) => {
  const { error, value } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { amount, receiver } = value;
  const phone = req.decoded.phone;
  db.query(
    "select phone from users where phone = ?",
    [receiver],
    (err, result) => {
      if (err) throw err;
      if (result.length <= 0) {
        return res.status(400).send("Receiver not found");
      }
      db.query(
        "select balance from users where phone = ?",
        [phone],
        (err, result) => {
          if (err) throw err;
          const balance = result[0].balance;
          if (balance < amount)
            return res.status(400).send("Insufficient balance");
          db.query(
            "update users set balance = balance - ? where phone = ?",
            [amount, phone],
            (err, result) => {
              if (err) throw err;
              db.query(
                "update users set balance = balance + ? where phone = ?",
                [amount, receiver],
                (err, result) => {
                  if (err) throw err;
                  db.query(
                    "insert into transactions (sender,receiver,amount,type) values (?,?,?,?)",
                    [phone, receiver, amount, "send_money"],
                    (err, result) => {
                      if (err) throw err;
                      res.send("Money sent successfully");
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

app.post("/add", auth, (req, res) => {
  const { error, value } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { amount, receiver } = value;
  const phone = req.decoded.phone;
  const type = req.decoded.type;
  if (type != "agent") return res.status(400).send("Only agents can add money");
  db.query(
    "select phone from users where phone = ?",
    [receiver],
    (err, result) => {
      if (err) throw err;
      if (result.length <= 0) return res.status(400).send("Receiver not found");
      db.query(
        "select balance from users where phone = ?",
        [phone],
        (err, result) => {
          if (err) throw err;
          const balance = result[0].balance;
          if (balance < amount)
            return res.status(400).send("Insufficient balance");
          db.query(
            "update users set balance = balance - ? where phone = ?",
            [amount, phone],
            (err, result) => {
              if (err) throw err;
              db.query(
                "update users set balance = balance + ? where phone = ?",
                [amount, receiver],
                (err, result) => {
                  if (err) throw err;
                  db.query(
                    "insert into transactions (sender,receiver,amount,type) values (?,?,?,?)",
                    [phone, receiver, amount, "add_money"],
                    (err, result) => {
                      if (err) throw err;
                      res.send("Money added successfully");
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

app.post("/cashout", auth, (req, res) => {
  const { error, value } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { amount, receiver } = value;
  const phone = req.decoded.phone;
  db.query(
    "select balance from users where phone = ?",
    [phone],
    (err, result) => {
      if (err) throw err;
      const balance = result[0].balance;
      if (balance < amount) return res.status(400).send("Insufficient balance");
      db.query(
        "select * from users where phone = ? and type = 'agent'",
        [receiver],
        (err, result) => {
          if (err) throw err;
          if (result.length <= 0)
            return res.status(400).send("Agent not found");
          db.query(
            "update users set balance = balance - ? where phone = ?",
            [amount, phone],
            (err, result) => {
              if (err) throw err;
              db.query(
                "update users set balance = balance + ? where phone = ?",
                [amount, receiver],
                (err, result) => {
                  if (err) throw err;
                  db.query(
                    "insert into transactions (sender,receiver,amount,type) values (?,?,?,?)",
                    [phone, receiver, amount, "cashout"],
                    (err, result) => {
                      if (err) throw err;
                      res.send("Cashout successful");
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

app.post("/pay", auth, (req, res) => {
  const { error, value } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { amount, receiver } = value;
  const phone = req.decoded.phone;
  db.query(
    "select balance from users where phone = ?",
    [phone],
    (err, result) => {
      if (err) throw err;
      const balance = result[0].balance;
      if (balance < amount) return res.status(400).send("Insufficient balance");
      db.query(
        "select * from users where phone = ? and type = 'merchant'",
        [receiver],
        (err, result) => {
          if (err) throw err;
          if (result.length <= 0)
            return res.status(400).send("Merchant not found");
          db.query(
            "update users set balance = balance - ? where phone = ?",
            [amount, phone],
            (err, result) => {
              if (err) throw err;
              db.query(
                "update users set balance = balance + ? where phone = ?",
                [amount, receiver],
                (err, result) => {
                  if (err) throw err;
                  db.query(
                    "insert into transactions (sender,receiver,amount,type) values (?,?,?,?)",
                    [phone, receiver, amount, "pay"],
                    (err, result) => {
                      if (err) throw err;
                      res.send("Payment successful");
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

app.get("/transactions", auth, (req, res) => {
  const phone = req.decoded.phone;
  db.query(
    "select * from transactions where sender = ? or receiver = ? limit 10",
    [phone, phone],
    (err, result) => {
      if (err) throw err;
      res.send(result);
    }
  );
});

module.exports = app;
