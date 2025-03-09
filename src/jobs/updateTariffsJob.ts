import { getTariffs } from "../services/wb.service.js";
import { saveTariffs } from "../services/tariffs.service.js";

export async function updateTariffsJob() {
    const currentDate = new Date().toISOString().split("T")[0];

    const tariffs = await getTariffs(currentDate);

    await saveTariffs(tariffs, currentDate);
}