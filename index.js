const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const { connectToMongoDB } = require("./connect");
const { restrictToLoggedinUserOnly, checkAuth } = require("./middlewares/auth");
const URL = require("./models/url");


const urlRoute = require("./routes/url");
const staticRoute = require("./routes/staticRouter");
const userRoute = require("./routes/user");

const app = express();
const PORT = 4000;

const password = encodeURIComponent(process.env.MONGO_PASSWORD.trim());

connectToMongoDB(process.env.MONGODB ?? `mongodb+srv://rohit960211:${password}@cluster0.qfbl9nq.mongodb.net/URLShortner?retryWrites=true&w=majority`).then(() =>
  console.log("Mongodb connected")
);

app.use("Access-Control-Allows-Origin" , "*");
app.use("Access-Control-Allows-Header" , "*");

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.static(path.join(__dirname ,'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());



app.use("/url", restrictToLoggedinUserOnly, urlRoute);
app.use("/user", userRoute);
app.use("/", checkAuth, staticRoute);
app.use(cookieParser());

app.get("/url/:shortId", async (req, res) => {
  const shortId = req.params.shortId;
  const entry = await URL.findOneAndUpdate(
    {
      shortId,
    },
    {
      $push: {
        visitHistory: {
          timestamp: Date.now(),
        },
      },
    }
  );
  res.redirect(entry.redirectURL);
});

app.get('/logout', (req, res) => {
  res.clearCookie('tokenName');
  return res.redirect('/login');
});

app.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`));
