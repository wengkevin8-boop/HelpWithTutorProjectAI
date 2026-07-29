var express = require('express');
var router = express.Router();
const { getCollection } = require('../models/db');
const crypto = require("crypto");

router.post("/signup/submit", async (req, res) => {
  try {
    let conn = getCollection("users");
    console.log(req.body); //user's info
    //Store a password securely    
    let password = req.body.password;
    //Unique for every user
    const salt = crypto.randomBytes(11).toString("hex"); 
    const keyLength = 11; // Length of the derived password (should be longer)
    let cryptoPassword = crypto.scryptSync(password, salt, keyLength).toString("hex");

    let newUser = req.body;
    newUser.password = cryptoPassword;
    newUser.salt = salt;

    await conn.insertOne(newUser);
    res.redirect("/signin");
  } 
  catch(e) {
    console.error(e);
    res.redirect("/signup");
  }
});

router.post("/signin/submit", async (req, res) => {
  try {
    let conn = getCollection("users");
    let email = req.body.email;
    let password = req.body.password;
    
    let dbuser = await conn.findOne({email: email});
    console.log(dbuser);
    if(!dbuser) {  
      //User not found
      res.redirect("/signin");
      return;
    } 

    const keyLength = 11;
    const salt = dbuser.salt; 
    let cryptoPassword = crypto.scryptSync(password, salt, keyLength);
    console.log(cryptoPassword.toString("hex"));
    if(cryptoPassword.toString("hex") === dbuser.password) {
      //Password match
      res.render("index", {name: dbuser.name});
    } else {
      //Password don't match:
      res.redirect("/signin");
    }
  } catch(e) {
    console.error(e);
  }
});

module.exports = router;
