import knex from "#postgres/knex.js";

interface WbBoxTariff {
    date: string;
    size: string;
    coeff: number;
    created_at?: Date;
}

interface WbApiResponse {
    response: {
        data: {
            warehouseList: {
                boxDeliveryAndStorageExpr: string;
                boxDeliveryBase: string;
                boxDeliveryLiter: string;
                boxStorageBase: string;
                boxStorageLiter: string;
                warehouseName: string;
            }[];
            dtTillMax: string;
            dtNextBox: string;
        };
    };
}

export class WbTariffService {
    private todayDate = new Date().toISOString().split("T")[0]
    private readonly apiToken: string;
    private static readonly WB_API_URL = 'https://common-api.wildberries.ru/api/v1/tariffs/box';

    constructor(apiToken: string) {
        this.apiToken = apiToken;
    }

    async fetchTariffs(): Promise<WbBoxTariff[]> {
        const API_URL = `${WbTariffService.WB_API_URL}?date=${this.todayDate}`
        const response = await fetch(API_URL, {
            headers: { Authorization: this.apiToken },
        });

        if (!response.ok) {
            throw new Error(`WB API error: ${response.status}`);
        }

        const data: WbApiResponse = await response.json();

        const uniqueTariffs = new Map<string, WbBoxTariff>();

        data.response.data.warehouseList.forEach((warehouse) => {
            const key = `${warehouse.boxDeliveryAndStorageExpr}_${this.todayDate}`;
            uniqueTariffs.set(key, {
                size: warehouse.boxDeliveryAndStorageExpr,
                coeff: parseFloat(warehouse.boxDeliveryBase.replace(",", ".")),
                date: this.todayDate,
            });
        });

        return Array.from(uniqueTariffs.values());
    }

    async saveTariffs(tariffs: WbBoxTariff[]): Promise<void> {
        if (tariffs.length === 0) return;

        await knex.transaction(async trx => {
            for (const tariff of tariffs) {
                await trx("wb_box_tariffs")
                    .insert(tariff)
                    .onConflict(["date", "size"])
                    .merge()
                    .catch(error => {
                        console.error(`Failed to save tariff (size: ${tariff.size}, date: ${tariff.date}):`, error.message);
                    });
            }
        });

        console.info(`Saved ${tariffs.length} tariffs for ${tariffs[0]?.date}`);
    }

    async hourlyUpdate(): Promise<void> {
        try {
            const tariffs = await this.fetchTariffs();
            await this.saveTariffs(tariffs);
        } catch (error) {
            console.error("Tariff update failed:", error instanceof Error ? error.message : error);
        }
    }
}
