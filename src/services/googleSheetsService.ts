import { google, sheets_v4 } from 'googleapis';
import knex from "#postgres/knex.js";

interface WbBoxTariff {
    date: string;
    size: string;
    coeff: number;
}

export class GoogleSheetsService {
    private readonly auth: any;
    private readonly sheetIds: string[];
    private sheets: sheets_v4.Sheets | null = null;

    
    constructor(credentials: string, sheetIds: string) {
        this.auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(credentials),
            scopes: ["https://www.googleapis.com/auth/spreadsheets"]
        });
        this.sheetIds = sheetIds.split(",");
    }

    private async getSheetsClient(): Promise<sheets_v4.Sheets> {
        if (!this.sheets) {
            this.sheets = google.sheets({
                version: "v4",
                auth: await this.auth.getClient()
            });
        }
        return this.sheets;
    }

    async updateAllSheets(): Promise<void> {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const tariffs: WbBoxTariff[] = await knex("wb_box_tariffs")
            .where("date", yesterday.toISOString().split("T")[0])
            .orderBy("coeff", "asc");

        if (tariffs.length === 0) {
            console.warn("No tariffs found for update");
            return;
        }

        const sheets = await this.getSheetsClient();
        const values = [
            ["Date", "Size", "Coeff"],
            ...tariffs.map(t => [t.date, t.size, t.coeff.toString()])
        ];

        for (const sheetId of this.sheetIds) {
            try {
                await sheets.spreadsheets.values.update({
                    spreadsheetId: sheetId,
                    range: "stocks_coefs!A1",
                    valueInputOption: "RAW",
                    requestBody: { values }
                });
                console.info(`Updated sheet: ${sheetId}`);
            } catch (error) {
                console.error(`Sheet update failed (${sheetId}):`, 
                    error instanceof Error ? error.message : error);
            }
        }
    }
}