import { WBTariffsParser } from "#modules/index.js";
import knex, { migrate, seed } from "#postgres/knex.js";

const wbTariffsParser: WBTariffsParser = new WBTariffsParser();

await migrate.latest();
await seed.run();
await wbTariffsParser.init();

console.log("All migrations and seeds have been run");
