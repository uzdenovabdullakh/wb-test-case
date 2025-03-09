import cron from "node-cron";
import knex, { migrate, seed } from "#postgres/knex.js";

import { updateTariffsJob } from "./jobs/updateTariffsJob.js";
import { exportToGoogleSheetsJob } from "./jobs/exportToGoogleSheetsJob.js";

async function setupDatabase() {
    await migrate.latest();
    await seed.run();
    console.log("Все миграции и сиды были выполнены.");
}

function setupCronJobs() {
    console.log("Крон-задачи запущены");

    cron.schedule("0 * * * *", async () => {
        await updateTariffsJob();
        console.log("Тарифы в Базе данных обновлены");
    });

    cron.schedule("0 */8 * * *", async () => {
        await exportToGoogleSheetsJob();
        console.log("Экспорт в Гугл таблицы закончен");
    });
}

async function startApp() {
    await setupDatabase();
    setupCronJobs();
}

startApp().catch((error) => {
    console.error("Ошибка при запуске приложения:", error);
});