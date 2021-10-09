const router = require("express").Router();
const utilController = require("../controller/utilController");
const userController = require("../controller/userController");
const authController = require("../controller/authController");
const moment = require("moment-timezone");
const { body, oneOf } = require("express-validator");
const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(process.env.CLIENT_ID)
const User = require("../model/User");
const jwt = require("jsonwebtoken");


// const auth = require('../middleware/auth')

// @route   POST /register
// @desc    Register user and return user object
// @access  Public
router.post(
  "/register",
  [
    body("name", "Name is required").isString().exists(),
    body("phoneNumber", "Phone Number is required").isString().isLength({ min: 10, max: 10 }).exists(),
    body("email", "email is required").isEmail().exists(),
    body("password", "password of min length 5 required")
      .isLength({ min: 5 })
      .exists(),
  ],
  utilController.validateRequest,
  userController.addUser
);

// @route   POST /login
// @desc    Login user and return jwt and user object
// @access  Public
router.post(
  "/login",
  [
    body('email').exists().isEmail(),
    body("password", "Invalid Credentials").isLength({ min: 5 })
      .exists(),
  ],
  utilController.validateRequest,
  authController.login
);

router.get("/time", (req, res) => {
  var d = process.env.TESTENDTIME * 1 - 1800000;  // time stamp of 18 Aug 4:00 PM IST
  res.status(200).json({
    success: true,
    epoch: d,
    time: new Date(d).toUTCString(),
    India: moment.unix(d / 1000).tz("Asia/Kolkata").toLocaleString(),
  });
});

// !TODO refactoring is needed
router.post("/api/v1/auth/google", async (req, res) => {
  const { token } = req.body
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.CLIENT_ID
  });
  const data = ticket.getPayload();
  await User.findOne({ email: data.email }).then(async (user) => {
    if (user === null) {
      console.log("creating new user");
      user = new User({
        name: data.name,
        email: data.email,
        profileUrl: data.picture
      });
      await user.save().then(user => {
        jwt.sign(
          { user: user._id },
          process.env.TOKEN_SECRET,
          { expiresIn: "1d" },
          async (err, token) => {
            return res.json({
              token: token,
              user: user
            });
          }
        );
      });
    } else {
      console.log("Modifying the user");
      console.log(user);
      user.name = data.name;
      user.email = data.email;
      user.profileUrl = data.picture;
      await user.save();
      if (user.password != undefined) {
        user.password = "encrpted"
      }
      jwt.sign(
        { user: user._id },
        process.env.TOKEN_SECRET,
        { expiresIn: "1d" },
        async (err, token) => {
          return res.json({
            token: token,
            user: user
          });
        }
      );
    }
  }).catch(err => {
    res.status(422).json({ success: false, msg: 'Some err occured' })
  })
})

module.exports = router;
