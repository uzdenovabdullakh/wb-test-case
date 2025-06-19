export function splitToChunks<T extends []>(data: T, chunkSize: number): T[] {
    const chunks: T[] = data.reduce((resultArray: T[], item, index) => {
        const chunkIndex = Math.floor(index / chunkSize);

        if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = [] as unknown as T;
        }

        resultArray[chunkIndex].push(item);

        return resultArray;
    }, []);

    return chunks;
}
