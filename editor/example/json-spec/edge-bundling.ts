import type { GoslingSpec } from '@gosling.schema';

export const EDGE_BUNDLING: GoslingSpec = {
    title: 'Circos',
    description: 'http://circos.ca/intro/genomic_data/',
    layout: 'circular',
    static: true,
    spacing: 1,
    centerRadius: 0.3,
    alignment: 'stack',
    style: { linkStyle: 'experimentalEdgeBundling', edgeBundlingTension: 0.1 },
    tracks: [
        {
            id: 'edge-bundling-track', // ← any string value you want to use
            data: {
                url: 'https://raw.githubusercontent.com/vigsterkr/circos/master/data/5/segdup.txt',
                //url: 'https://gist.githubusercontent.com/ericastutz/ad931e3d12158c79a7d8b3723873fdbe/raw/234b04b198b4c3c28a4f71388f38efdeaa773aa5/gistfile1.txt',
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
