/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("wb_tariffs_boxes", (table) => {
        table.increments("id").primary();
        table.string("date");
        table.string("dt_next_box");
        table.string("dt_till_max");
        table.string("box_delivery_and_storage_expr");
        table.string("box_delivery_base");
        table.string("box_delivery_liter");
        table.string("box_storage_base");
        table.string("box_storage_liter");
        table.string("warehouse_name");
        table.string("date_warehouse_index").unique();
        table.timestamps(true, true);
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("wb_tariffs_boxes");
}
