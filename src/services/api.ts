import axios, { AxiosError, AxiosInstance } from "axios";

const TIMEOUT = 50000;

export function createAPI(
    baseUrl: string,
    apiKey: string,
    timeout: number = TIMEOUT,
): AxiosInstance {
    if (!baseUrl) {
        throw new Error("API BaseUrl hasn`t been passed");
    }

    const api = axios.create({
        baseURL: baseUrl,
        timeout: timeout,
    });

    api.interceptors.request.use((config) => {
        config.headers["Api-key"] = apiKey;

        return config;
    });

    api.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
            if (error?.response && error.response.data) {
                console.log("[Axios] Request error: ");
                console.log(error.response.data);

                return Promise.reject(error.response.data);
            } else {
                console.log("Error: ", error);
            }

            return Promise.reject(error);
        },
    );

    return api;
}
