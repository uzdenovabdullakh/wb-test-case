import knex, { migrate, seed } from "#postgres/knex.js";
import { startSchedulers } from "#scheduler.js";

async function main(): Promise<void> {
    try {
        await migrate.latest();
        await seed.run();
        console.log("Database initialized");

        startSchedulers();
        console.log("Schedulers started");
    } catch (error) {
        console.error("Application failed to start", error);
        process.exit(1);
    }
}

main();