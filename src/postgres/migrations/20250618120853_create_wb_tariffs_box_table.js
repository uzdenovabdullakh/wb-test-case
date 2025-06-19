/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("wb-tariffs-boxes", (table) => {
        table.increments("id").primary();
        table.string("date");
        table.string("dtNextBox");
        table.string("dtTillMax");
        table.string("boxDeliveryAndStorageExpr");
        table.string("boxDeliveryBase");
        table.string("boxDeliveryLiter");
        table.string("boxStorageBase");
        table.string("boxStorageLiter");
        table.string("warehouseName");

        table.index(
            [
                "date",
                "boxDeliveryAndStorageExpr",
                "boxDeliveryBase",
                "boxDeliveryLiter",
                "boxStorageBase",
                "boxStorageLiter",
                "warehouseName",
            ],
            "compare-index",
        );
        table.timestamps(true, true);
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("wb-tariffs-boxes");
}
