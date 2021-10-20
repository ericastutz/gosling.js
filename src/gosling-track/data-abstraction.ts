import { Datum, SingleTrack } from '../core/gosling.schema';
import { IsDataDeepTileset } from '../core/gosling.schema.guards';

/**
 * Convert genomic data formats to common tabular formats for given tile.
 */
export function getTabularData(
    spec: SingleTrack,
    data: {
        dense?: number[];
        raw?: Datum[];
        shape?: [number, number];
        tileX: number;
        tileY?: number; // Used for `matrix`
        tileWidth: number;
        tileHeight?: number; // Used for `matrix`
        tileSize: number;
    }
) {
    const tabularData: Datum[] = [];

    if (!IsDataDeepTileset(spec.data)) {
        console.warn('No data is specified');
        return;
    }

    if (spec.data.type === 'vector' || spec.data.type === 'bigwig') {
        if (!spec.data.column || !spec.data.value) {
            console.warn('Proper data configuration is not provided. Please specify the name of data fields.');
            return;
        }

        if (!data.dense) {
            // we did not get sufficient data.
            return;
        }

        const bin = spec.data.binSize ?? 1;

        const numericValues = data.dense;
        const numOfGenomicPositions = data.tileSize;
        const tileUnitSize = data.tileWidth / data.tileSize;

        const valueName = spec.data.value;
        const columnName = spec.data.column;
        const startName = spec.data.start ?? 'start';
        const endName = spec.data.end ?? 'end';

        // additional columns with different aggregation functions
        const minValueName = `${valueName}_min`;
        const maxValueName = `${valueName}_max`;

        // convert data to a visualization-friendly format
        let cumVal = 0;
        let minVal = Number.MAX_SAFE_INTEGER;
        let maxVal = Number.MIN_SAFE_INTEGER;
        let binStart = Number.MIN_SAFE_INTEGER;
        let binEnd = Number.MAX_SAFE_INTEGER;
        Array.from(Array(numOfGenomicPositions).keys()).forEach((g: number, j: number) => {
            // add individual rows
            if (bin === 1) {
                const value = numericValues[j] / tileUnitSize;
                tabularData.push({
                    [valueName]: value,
                    [columnName]: data.tileX + (j + 0.5) * tileUnitSize,
                    [startName]: data.tileX + j * tileUnitSize,
                    [endName]: data.tileX + (j + 1) * tileUnitSize,
                    [minValueName]: value,
                    [maxValueName]: value
                });
            } else {
                // bin the data considering the `binSize` option
                if (j % bin === 0) {
                    // Start storing information for this bin
                    cumVal = minVal = maxVal = numericValues[j];
                    binStart = j;
                    binEnd = j + bin;
                } else if (j % bin === bin - 1) {
                    // Add a row using the cumulative value
                    tabularData.push({
                        [valueName]: cumVal / bin / tileUnitSize,
                        [columnName]: data.tileX + (binStart + bin / 2.0) * tileUnitSize,
                        [startName]: data.tileX + binStart * tileUnitSize,
                        [endName]: data.tileX + binEnd * tileUnitSize,
                        [minValueName]: minVal,
                        [maxValueName]: maxVal
                    });
                } else if (j === numOfGenomicPositions - 1) {
                    // Manage the remainders. Just add them as a single row.
                    const smallBin = numOfGenomicPositions % bin;
                    const correctedBinEnd = binStart + smallBin;
                    tabularData.push({
                        [valueName]: cumVal / smallBin / tileUnitSize,
                        [columnName]: data.tileX + (binStart + smallBin / 2.0) * tileUnitSize,
                        [startName]: data.tileX + binStart * tileUnitSize,
                        [endName]: data.tileX + correctedBinEnd * tileUnitSize,
                        [minValueName]: minVal,
                        [maxValueName]: maxVal
                    });
                } else {
                    // Add a current value
                    cumVal += numericValues[j];
                    if (minVal > numericValues[j]) minVal = numericValues[j];
                    if (maxVal < numericValues[j]) maxVal = numericValues[j];
                }
            }
        });
        // console.log(tabularData);
    } else if (spec.data.type === 'multivec') {
        if (!spec.data.row || !spec.data.column || !spec.data.value) {
            console.warn('Proper data configuration is not provided. Please specify the name of data fields.');
            return;
        }

        if (!data.dense || data.shape === undefined) {
            // we did not get sufficient data.
            return;
        }

        const bin = spec.data.binSize ?? 1;

        const numOfTotalCategories = data.shape[0];
        const categories: any = spec.data.categories ?? [...Array(numOfTotalCategories).keys()];
        const numericValues = data.dense;
        const numOfGenomicPositions = data.shape[1];
        const tileUnitSize = data.tileWidth / data.tileSize;

        const rowName = spec.data.row;
        const valueName = spec.data.value;
        const columnName = spec.data.column;
        const startName = spec.data.start ?? 'start';
        const endName = spec.data.end ?? 'end';

        // additional columns with different aggregation functions
        const minValueName = `${valueName}_min`;
        const maxValueName = `${valueName}_max`;

        // convert data to a visualization-friendly format
        categories.forEach((c: string, i: number) => {
            let cumVal = 0;
            let binStart = Number.MIN_SAFE_INTEGER;
            let binEnd = Number.MAX_SAFE_INTEGER;
            let minVal = Number.MAX_SAFE_INTEGER;
            let maxVal = Number.MIN_SAFE_INTEGER;
            Array.from(Array(numOfGenomicPositions).keys()).forEach((g: number, j: number) => {
                // add individual rows
                if (bin === 1) {
                    const value = numericValues[numOfGenomicPositions * i + j] / tileUnitSize;
                    tabularData.push({
                        [rowName]: c,
                        [valueName]: value,
                        [columnName]: data.tileX + (j + 0.5) * tileUnitSize,
                        [startName]: data.tileX + j * tileUnitSize,
                        [endName]: data.tileX + (j + 1) * tileUnitSize,
                        [minValueName]: value,
                        [maxValueName]: value
                    });
                } else {
                    // EXPERIMENTAL: bin the data considering the `bin` options
                    if (j % bin === 0) {
                        // Start storing information for this bin
                        cumVal = minVal = maxVal = numericValues[numOfGenomicPositions * i + j];
                        binStart = j;
                        binEnd = j + bin;
                    } else if (j % bin === bin - 1) {
                        // Add a row using the cumulative value
                        tabularData.push({
                            [rowName]: c,
                            [valueName]: cumVal / bin / tileUnitSize,
                            [columnName]: data.tileX + (binStart + bin / 2.0) * tileUnitSize,
                            [startName]: data.tileX + binStart * tileUnitSize,
                            [endName]: data.tileX + binEnd * tileUnitSize,
                            [minValueName]: minVal,
                            [maxValueName]: maxVal
                        });
                    } else if (j === numOfGenomicPositions - 1) {
                        // Manage the remainders. Just add them as a single row.
                        const smallBin = numOfGenomicPositions % bin;
                        const correctedBinEnd = binStart + smallBin;
                        tabularData.push({
                            [rowName]: c,
                            [valueName]: cumVal / smallBin / tileUnitSize,
                            [columnName]: data.tileX + (binStart + smallBin / 2.0) * tileUnitSize,
                            [startName]: data.tileX + binStart * tileUnitSize,
                            [endName]: data.tileX + correctedBinEnd * tileUnitSize,
                            [minValueName]: minVal,
                            [maxValueName]: maxVal
                        });
                    } else {
                        // Add a current value
                        const value = numericValues[numOfGenomicPositions * i + j];
                        cumVal += value;
                        if (minVal > value) minVal = value;
                        if (maxVal < value) maxVal = value;
                    }
                }
            });
        });
    } else if (spec.data.type === 'matrix') {
        if (!data.dense || typeof data.tileY === 'undefined' || typeof data.tileHeight === 'undefined') {
            // we do not have sufficient data.
            return;
        }

        // width and height of the tile
        const tileSize = Math.sqrt(data.dense.length);
        if (tileSize !== 256) {
            console.warn('The bin size of the matrix tilesets is not 256');
        }

        const { tileX, tileY } = data;
        const numericValues = data.dense;

        // TODO: Not sure why 1024 works instead of tileSize
        const tileXUnitSize = data.tileWidth / 1024; // tileSize / 4;
        const tileYUnitSize = data.tileHeight / 1024; // tileSize / 4;

        // For the rendering performance, we aggregate multiple cells into one.
        const binSize = 16; // assuming that # of cells can be divided by binSize
        for (let i = 0; i < numericValues.length / binSize; i++) {
            const binLen = Math.sqrt(binSize);
            const xIndex = (i * binLen) % tileSize;
            const yIndex = Math.floor((i * binLen) / tileSize) * binLen;

            // Being xIndex and yIndex the top-let origin, aggregate 4 x 4 cells
            let value = 0;
            for (let c = 0; c < binLen; c++) {
                for (let r = 0; r < binLen; r++) {
                    const curVal = numericValues[(yIndex + r) * tileSize + (xIndex + c)];
                    if (!isNaN(value)) {
                        value += curVal;
                    }
                }
            }

            value /= binSize;

            // TODO: just to see the pattern more clearly. support `log` scale.
            value = Math.log(value);

            if (isNaN(value)) {
                // if this is NaN, skip.
                continue;
            }

            const xs = tileX + xIndex * tileXUnitSize;
            const xe = tileX + (xIndex + binLen) * tileXUnitSize;
            const ys = tileY + yIndex * tileYUnitSize;
            const ye = tileY + (yIndex + binLen) * tileYUnitSize;
            const x = (xs + xe) / 2.0;
            const y = (ys + ye) / 2.0;
            tabularData.push({ value, x, xs, xe, y, ys, ye });
        }
    } else if (spec.data.type === 'beddb') {
        if (!data.raw) {
            // we did not get sufficient data.
            return;
        }

        const { genomicFields, exonIntervalFields, valueFields } = spec.data;

        data.raw.forEach((d: any) => {
            const { chrOffset, fields } = d;

            const datum: { [k: string]: number | string } = {};
            genomicFields.forEach(g => {
                datum[g.name] = +fields[g.index] + chrOffset;
            });

            // values
            valueFields?.forEach(v => {
                datum[v.name] = v.type === 'quantitative' ? +fields[v.index] : fields[v.index];
            });

            tabularData.push({
                ...datum,
                type: 'gene' // this should be described in the spec
            });

            if (exonIntervalFields) {
                const [exonStartField, exonEndField] = exonIntervalFields;
                const exonStartStrs = (fields[exonStartField.index] as string).split(',');
                const exonEndStrs = (fields[exonEndField.index] as string).split(',');

                exonStartStrs.forEach((es, i) => {
                    const ee = exonEndStrs[i];

                    // exon
                    tabularData.push({
                        ...datum,
                        [exonStartField.name]: +es + chrOffset,
                        [exonEndField.name]: +ee + chrOffset,
                        type: 'exon'
                    });

                    // intron
                    if (i + 1 < exonStartStrs.length) {
                        const nextEs = exonStartStrs[i + 1];
                        tabularData.push({
                            ...datum,
                            [exonStartField.name]: +ee + chrOffset,
                            [exonEndField.name]: +nextEs + chrOffset,
                            type: 'intron'
                        });
                    }
                });
            }
        });
    } else if (spec.data.type === 'bam') {
        // BAM file is loaded by worker, so no need to do anything here
    }

    /// DEBUG
    // console.log(tabularData);

    return tabularData;
}
