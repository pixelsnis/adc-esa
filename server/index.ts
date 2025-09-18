import express from "express";
import { runJob } from "./src/job";

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.json());
app.post("/v1/run", runJob);
app.get("/v1/run", runJob);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
