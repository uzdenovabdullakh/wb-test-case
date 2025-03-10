import knex from "../postgres/knex.js";
import { WarehousesBoxRates, TariffRecord} from "../types/tariffs.types.js";

/**
 * Сохраняем тарифы в базу данных для заданной даты.
 * Если тарифы на текущий день уже существуют, они будут обновлены, иначе будут вставлены новые записи.
 * @param tariffsData - объект с тарифами для сегодняшнего дня
 * @param date - дата для фильтрации тарифов
 */
export async function saveTariffs(tariffsData: WarehousesBoxRates, date: string): Promise<void> {
    const { dtNextBox, dtTillMax, warehouseList } = tariffsData;

    if (!warehouseList || warehouseList.length === 0) {
        console.warn(`Нет тарифов для сохранения за ${date}.`);
        return;
    }

    const parseNumeric = (value: string | number | null | undefined): number | null => {
        if (value == null || value === "-" || value === "") return null;
        const parsedValue = parseFloat(value.toString().replace(",", "."));
        return isNaN(parsedValue) ? null : parsedValue;
    };

    const parseDate = (value: string | null): string | null => {
        return value && value.trim() !== "" ? value : null;
    };

    for (const warehouse of warehouseList) {
        const { warehouseName } = warehouse;

        const existingRecord = await knex("spreadsheets")
            .where({ warehouseName, currentDay: date })
            .first();

        const boxDeliveryBase = parseNumeric(warehouse.boxDeliveryBase);
        const boxDeliveryLiter = parseNumeric(warehouse.boxDeliveryLiter);
        const boxStorageBase = parseNumeric(warehouse.boxStorageBase);
        const boxStorageLiter = parseNumeric(warehouse.boxStorageLiter);

        const dataToSave = {
            boxDeliveryAndStorageExpr: warehouse.boxDeliveryAndStorageExpr,
            boxDeliveryBase,
            boxDeliveryLiter,
            boxStorageBase,
            boxStorageLiter,
            warehouseName,
            dtNextBox: parseDate(dtNextBox),
            dtTillMax: parseDate(dtTillMax),
            currentDay: date,
        };

        if (existingRecord) {
            await knex("spreadsheets")
                .where({ warehouseName, currentDay: date })
                .update(dataToSave);
        } else {
            await knex("spreadsheets").insert(dataToSave);
        }
    }
}

/**
 * Экспортируем тарифы из базы данных за конкретный день.
 * Возвращаем все записи, где currentDay совпадает с переданной датой.
 * @param date - дата для фильтрации тарифов
 * @returns Массив тарифов для указанного дня
 */
export async function exportTariffs(date: string): Promise<TariffRecord[]> {
    const tariffs: TariffRecord[] =  await knex("spreadsheets")
        .where({ currentDay: date })
        .orderByRaw("CAST(\"boxDeliveryAndStorageExpr\" AS DECIMAL) ASC");

    return tariffs;
}