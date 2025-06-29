/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("wb_box_tariffs", (table) => {
        table.date("date").notNullable();
        table.string("size").notNullable();
        table.float("coeff").notNullable();
        table.primary(["date", "size"]);
        table.timestamp("created_at").defaultTo(knex.fn.now());
    });;
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("wb_box_tariffs");
}
