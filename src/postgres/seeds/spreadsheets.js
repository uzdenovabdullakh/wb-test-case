/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function seed(knex) {
    await knex("spreadsheets").del();

    const apiData = [
        {
            "boxDeliveryAndStorageExpr": "125",
            "boxDeliveryBase": "47.5",
            "boxDeliveryLiter": "11.88",
            "boxStorageBase": null,
            "boxStorageLiter": null,
            "warehouseName": "Маркетплейс",
            "dtNextBox": null,
            "dtTillMax": "2025-03-10"
        },
    ];

    const formattedData = apiData.map(warehouse => ({
        boxDeliveryAndStorageExpr: warehouse.boxDeliveryAndStorageExpr,
        boxDeliveryBase: warehouse.boxDeliveryBase,
        boxDeliveryLiter: warehouse.boxDeliveryLiter,
        boxStorageBase: warehouse.boxStorageBase,
        boxStorageLiter: warehouse.boxStorageLiter,
        warehouseName: warehouse.warehouseName,
        dtNextBox: warehouse.dtNextBox || null,
        dtTillMax: warehouse.dtTillMax,
        currentDay: new Date().toISOString().split("T")[0]
    }));

    await knex("spreadsheets").insert(formattedData);
}
