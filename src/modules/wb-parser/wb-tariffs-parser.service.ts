import cron, { ScheduledTask } from "node-cron";

import { CRON_SCHEDULE } from "./constants.js";

import { WBDataType } from "./types/wb-data.type.js";
import { AxiosInstance } from "axios";
import { createAPI } from "#services/api.js";

export class WBTariffsParser {
    private readonly loggerPrefix = "[WBParser]";
    private readonly apiBaseUrl =
        "https://common-api.wildberries.ru/api/v1/tariffs/";
    private readonly wbTariffsBoxUri = "box";
    private readonly apiKey = "";

    private syncTask: ScheduledTask | null = null;
    private api: AxiosInstance = null;

    constructor() {
        this.api = createAPI(this.apiBaseUrl, this.apiKey);
    }

    public async init() {
        console.log(`${this.loggerPrefix} Initialize WBParser ...`);

        this.synchronize();
    }

    private async synchronize() {
        console.log(`${this.loggerPrefix} Starting Synchronize task ...`);

        // First launch
        if (!this.syncTask) {
            await this.parse();
        }

        if (this.syncTask) {
            this.syncTask.stop();
        }

        this.syncTask = cron.schedule(
            CRON_SCHEDULE,
            this.parseAndUpload.bind(this),
        );

        console.log(
            `${this.loggerPrefix} Synchronize task has been successfully started`,
        );
    }

    private async parseAndUpload() {
        try {
            // Fetch data from WB
            const wbData = await this.parse();

            if (!wbData) {
                console.log(`No data has been received from WB`);

                return;
            }

            // Insert data to Google Spreadsheet
            await this.insertDataToGoogleSpreadSheet(wbData);
        } catch (error) {
            console.log(`WB Parse or Upload data error: `, error);
        }
    }

    private async parse(): Promise<WBDataType | void> {
        console.log(`${this.loggerPrefix} WB Parse task is running ...`);

        await this.api.get(this.wbTariffsBoxUri);
    }

    private async insertDataToGoogleSpreadSheet(data: WBDataType) {
        console.log(`Data to insert to GoogleSpreadsheet: `, data);
    }
}
