/**
 * @param {import("knex").Knex} knex
 * @returns {import("knex").Knex.SchemaBuilder}
 */
export function up(knex) {
    return knex.schema.createTable("spreadsheets", (table) => {
        table.increments("id").primary();
        table.string("boxDeliveryAndStorageExpr");
        table.decimal("boxDeliveryBase", 10, 2);
        table.decimal("boxDeliveryLiter", 10, 2);
        table.decimal("boxStorageBase", 10, 2);
        table.decimal("boxStorageLiter", 10, 2);
        table.string("warehouseName");
        table.date("dtNextBox");
        table.date("dtTillMax");
        table.date("currentDay");
        table.timestamps(true, true);
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {import("knex").Knex.SchemaBuilder}
 */
export function down(knex) {
    return knex.schema.dropTable("spreadsheets");
}
