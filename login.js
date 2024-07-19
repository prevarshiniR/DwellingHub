// app.js

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
var methodOverride = require("method-override");
var app = express();

//middlewares
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/dwellinghub", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

const adminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const Admin = mongoose.model("Admin", adminSchema);

const serviceSchema = new mongoose.Schema({
  name: String,
  email: String,
  phoneNumber: Number,
  address: String,
  date: Date,
  price: String,
  type: String,
});

const Service = mongoose.model("Service", serviceSchema);

//app routings
app.get("/", (req, res) => {
  res.redirect("/signup");
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "signup.html"));
});

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the user already exists
    const foundUser = await User.findOne({ email: email });

    if (foundUser) {
      res.status(400).send("User already exists.");
    } else {
      // Create a new user
      const newUser = new User({
        name: name,
        email: email,
        password: password,
      });

      // Save the new user to the database
      await newUser.save();
      res.status(200).sendFile(path.join(__dirname, "signin.html"));
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.get("/signin", (req, res) => {
  res.sendFile(path.join(__dirname, "signin.html"));
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  const data = await User.findOne({
    email: email,
    password: password,
  });

  if (data) {
    req.session.user = data.name;
    res.redirect("/home");
  } else {
    res.status(401).send("Invalid username or password");
  }
});

app.get("/adminSignin", (req, res) => {
  res.sendFile(path.join(__dirname, "adminSignin.html"));
});

app.post("/adminSignin", async (req, res) => {
  const { email, password } = req.body;
  const data = await Admin.findOne({
    email: email,
    password: password,
  });

  if (data) {
    req.session.user = data.name;
    res.redirect("/allServices");
  } else {
    res.status(401).send("Invalid username or password");
  }
});

app.get("/signout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect("/");
  });
});

app.get("/home", (req, res) => {
  res.render("index.ejs");
});

app.get("/allServices", async (req, res) => {
  const servicesCount = await Service.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]);
  const services = await Service.find();
  res.render("allServices.ejs", { servicesCount: servicesCount, services: services });
});

app.get("/about", (req, res) => {
  res.render("about.ejs");
});

app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});

app.get("/service", (req, res) => {
  res.render("availableService.ejs");
});

app.post("/bookService", (req, res) => {
  const prices = {
    painting: 1000,
    cleaning: 750,
    gardening: 650,
  };
  const { page } = req.body;
  res.render("bookService.ejs", { page: page, price: prices[page] });
});

app.post("/save-service-data", async (req, res) => {
  try {
    const { name, email, phoneNumber, address, date, price, type } = req.body;

    const newService = new Service({
      name,
      email,
      phoneNumber,
      address,
      date,
      price,
      type,
    });

    await newService.save();
    res.status(200).json({ message: "Data saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error saving data to the database" });
  }
});

app.post("/bookedServices", async (req, res) => {
  try {
    const { page } = req.body;
    const services = await Service.find({ type: page });
    res.render("bookedService", { page: page, services: services });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error retrieving data from the database.");
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
