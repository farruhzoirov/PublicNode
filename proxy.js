import express from "express";

const app = express();

app.get("/api/users", (req, res) => {
  res.send("Welcome");
});

app.listen(3000, () =>
  console.log("🔗 Server ishga tushdi: http://localhost:3000")
);
