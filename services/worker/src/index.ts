import { PgBoss } from "pg-boss";
import { dispatchQueuedTasks } from "./dispatch/tasks";
import { dispatchDueWatchers } from "./dispatch/watchers";
import { executeQueuedTask, type ExecuteJob } from "./execution/task-runner";
import { reportHeartbeat } from "./runtime/heartbeat";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const boss = new PgBoss(process.env.DATABASE_URL);
boss.on("error", (error) => console.error("pg-boss", error));

await boss.start();
await boss.createQueue("agesoma.execute");

await boss.work("agesoma.execute", async ([job]) => {
  return await executeQueuedTask(job.data as ExecuteJob);
});

await reportHeartbeat();
await dispatchDueWatchers();
await dispatchQueuedTasks(boss);

setInterval(
  () => reportHeartbeat().catch((error) => console.error("AGESOMA heartbeat", error)),
  30_000
).unref();

setInterval(
  () => dispatchDueWatchers().catch((error) => console.error("AGESOMA watcher dispatcher", error)),
  30_000
).unref();

setInterval(
  () => dispatchQueuedTasks(boss).catch((error) => console.error("AGESOMA task dispatcher", error)),
  5_000
).unref();

console.log("AGESOMA worker listening on agesoma.execute");
