/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function seed(knex) {
    await knex("spreadsheets")
        .insert([
            { spreadsheet_id: "1NKN3aop_Es6lp2StON10uSZFDbY7b1jdfMp11zoNkmQ" },
            { spreadsheet_id: "1pxYQ8sFsokzFt3d7u6DVXSZlCG2NnLq6vke6bD1PIuY" },
        ])
        .onConflict(["spreadsheet_id"])
        .ignore();
}
