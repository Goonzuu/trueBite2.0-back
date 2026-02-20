require("dotenv").config();
const express = require("express");
const cors = require("cors");

const restaurantsRouter = require("./routes/restaurants");
const reservationsRouter = require("./routes/reservations");
const reviewsRouter = require("./routes/reviews");
const usersRouter = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 4000;

// CORS: si CORS_ORIGIN está definido, usarlo; si no, en desarrollo permitir localhost en cualquier puerto
const corsOrigin = process.env.CORS_ORIGIN;
const isProd = process.env.NODE_ENV === "production";
const corsOptions = {
  credentials: true,
  origin: corsOrigin
    ? corsOrigin.split(",").map((o) => o.trim())
    : isProd
      ? false
      : (origin, cb) => {
          const allowed =
            !origin ||
            /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
          cb(null, allowed);
        },
};
app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/restaurants", restaurantsRouter);
app.use("/api/reservations", reservationsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/users", usersRouter);

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true, service: "truebite2.0-back" });
});

app.listen(PORT, () => {
  console.log(`TrueBite API listening on http://localhost:${PORT}`);
  console.log(
    `CORS: ${corsOrigin ? corsOrigin : "localhost (cualquier puerto)"}`
  );
});
