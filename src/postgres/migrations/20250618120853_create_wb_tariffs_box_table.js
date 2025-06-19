/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("wb-tariffs-boxes", (table) => {
        table.increments("id").primary();
        table.string("dtNextBox");
        table.string("dtTillMax");
        table.string("boxDeliveryAndStorageExpr");
        table.string("boxDeliveryBase");
        table.string("boxDeliveryLiter");
        table.string("boxStorageBase");
        table.string("boxStorageLiter");
        table.string("warehouseName");
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
