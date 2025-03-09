import { exportTariffs } from "../services/tariffs.service.js";
import { saveToGoogleSheets } from "../services/googleSheets.service.js";

export async function exportToGoogleSheetsJob() {
    const currentDate = new Date().toISOString().split("T")[0];

    const tariffs = await exportTariffs(currentDate);

    if (tariffs.length > 0) {
        await saveToGoogleSheets(tariffs);
    } else {
        console.log("Нет тарифов на сегодняшний день.");
    }
}
