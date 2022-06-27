import type { GoslingSpec } from '@gosling.schema';

export const EDGE_BUNDLING: GoslingSpec = {
    title: 'Circos',
    description: 'http://circos.ca/intro/genomic_data/',
    layout: 'circular',
    static: true,
    spacing: 1,
    centerRadius: 0.3,
    alignment: 'stack',
    style: { linkStyle: 'experimentalEdgeBundling' },
    tracks: [
        {
            data: {
                url: 'https://raw.githubusercontent.com/vigsterkr/circos/master/data/5/segdup.txt',
                type: 'csv',
                headerNames: ['id', 'chr', 'p1', 'p2'],
                chromosomePrefix: 'hs',
                chromosomeField: 'chr',
                genomicFields: ['p1', 'p2'],
                separator: ' ',
                longToWideId: 'id'
            },
            opacity: { value: 0.4 },
            mark: 'withinLink',
            x: { field: 'p1', type: 'genomic' },
            xe: { field: 'p2_2', type: 'genomic' },
            stroke: { value: 'red' },
            strokeWidth: { value: 1 },
            width: 700,
            height: 300
        }
    ]
};
