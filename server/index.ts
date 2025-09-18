import express from "express";
import { runJob } from "./src/job";

const app = express();

app.use(express.json());
app.post("/v1/run", runJob);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
