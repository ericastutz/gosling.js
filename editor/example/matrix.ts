import type { GoslingSpec } from 'gosling.js';
import { GOSLING_PUBLIC_DATA } from './gosling-data';

export const EX_SPEC_NATIVE_MATRIX: GoslingSpec = {
    views: [
        {
            xDomain: { chromosome: '1', interval: [4900000, 5200000] },
            tracks: [
                {
                    data: {
                        url: GOSLING_PUBLIC_DATA.matrix,
                        type: 'matrix'
                    },
                    alignment: 'overlay',
                    tracks: [
                        {
                            mark: 'bar',
                            x: { field: 'xs', type: 'genomic', axis: 'top' },
                            xe: { field: 'xe', type: 'genomic' },
                            y: { field: 'ys', type: 'genomic', axis: 'right' }, // TODO: axis position
                            ye: { field: 'ye', type: 'genomic' }, // TODO: axis position
                            color: { field: 'value', type: 'quantitative', legend: true }
                        },
                        {
                            mark: 'betweenLink',
                            // dataTransform: [
                            //     {type: 'filter', field: 'value', oneOf: ['NaN', 0], not: true}
                            // ],
                            x: { field: 'x', type: 'genomic' },
                            y: { field: 'y', type: 'genomic' },
                            stroke: { value: 'lightgray' },
                            visibility: [
                                {
                                    target: 'track',
                                    measure: 'zoomLevel',
                                    threshold: 500000,
                                    operation: 'lt'
                                }
                            ]
                        },
                        {
                            mark: 'text',
                            text: { field: 'value', type: 'quantitative' },
                            x: { field: 'xs', type: 'genomic', axis: 'top' },
                            xe: { field: 'xe', type: 'genomic' },
                            y: { field: 'y', type: 'genomic' },
                            color: { value: 'black' },
                            strokeWidth: { value: 2 },
                            stroke: { value: 'white' },
                            visibility: [
                                {
                                    target: 'mark',
                                    threshold: '|xe-x|',
                                    measure: 'width',
                                    transitionPadding: 10,
                                    operation: 'LTET'
                                }
                            ]
                        }
                    ],
                    width: 600,
                    height: 600
                }
            ]
        }
    ]
};

export const EX_SPEC_1D_MATRIX: GoslingSpec = {
    views: [
        {
            // xDomain: { chromosome: '1', interval: [4900000, 5200000] },
            tracks: [
                {
                    data: {
                        url: GOSLING_PUBLIC_DATA.matrix,
                        type: 'matrix'
                    },
                    dataTransform: [
                        {
                            type: 'rotateMatrix',
                            startField1: 'xs',
                            endField1: 'xe',
                            startField2: 'ye',
                            endField2: 'ys' // TODO: this should be swapped
                        }
                    ],
                    mark: 'bar',
                    x: { field: 'xs-r', type: 'genomic', axis: 'bottom' },
                    xe: { field: 'xe-r', type: 'genomic' },
                    y: { field: 'ys-r', type: 'quantitative', axis: 'none' }, // TODO: axis position
                    ye: { field: 'ye-r', type: 'quantitative', axis: 'none' }, // TODO: axis position
                    color: { field: 'value', type: 'quantitative', legend: true },
                    width: 600,
                    height: 200
                }
            ]
        }
    ]
};

export const EX_SPEC_MATRIX: GoslingSpec = {
    title: 'Matrix Visualization',
    subtitle: 'Matrix Heatmap for Hi-C Data',
    views: [
        {
            static: true,
            tracks: [
                {
                    data: {
                        url: GOSLING_PUBLIC_DATA.multivec,
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                    },
                    alignment: 'overlay',
                    tracks: [
                        {
                            mark: 'bar'
                        },
                        {
                            mark: 'brush',
                            x: { linkingId: 'all' },
                            color: { value: 'blue' }
                        }
                    ],
                    x: {
                        field: 'position',
                        type: 'genomic',
                        axis: 'top'
                    },
                    y: { field: 'peak', type: 'quantitative' },
                    color: { field: 'sample', type: 'nominal' },
                    width: 570,
                    height: 30
                },
                {
                    alignment: 'overlay',
                    data: {
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv',
                        type: 'csv',
                        chromosomeField: 'Chromosome',
                        genomicFields: ['chromStart', 'chromEnd']
                    },
                    tracks: [
                        {
                            mark: 'rect',
                            color: {
                                field: 'Chromosome',
                                type: 'nominal',
                                domain: [
                                    'chr1',
                                    'chr2',
                                    'chr3',
                                    'chr4',
                                    'chr5',
                                    'chr6',
                                    'chr7',
                                    'chr8',
                                    'chr9',
                                    'chr10',
                                    'chr11',
                                    'chr12',
                                    'chr13',
                                    'chr14',
                                    'chr15',
                                    'chr16',
                                    'chr17',
                                    'chr18',
                                    'chr19',
                                    'chr20',
                                    'chr21',
                                    'chr22',
                                    'chrX',
                                    'chrY'
                                ],
                                range: ['#F6F6F6', 'gray']
                            },
                            x: {
                                field: 'chromStart',
                                type: 'genomic',
                                aggregate: 'min',
                                domain: { chromosome: '5' }
                            },
                            xe: {
                                field: 'chromEnd',
                                aggregate: 'max',
                                type: 'genomic'
                            },
                            strokeWidth: { value: 2 },
                            stroke: { value: 'gray' },
                            visibility: [
                                {
                                    operation: 'greater-than',
                                    measure: 'zoomLevel',
                                    threshold: 1000000000,
                                    target: 'mark',
                                    transitionPadding: 1000000000
                                }
                            ]
                        },
                        {
                            mark: 'text',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen'], not: true }],
                            text: { field: 'Name', type: 'nominal' },
                            color: {
                                field: 'Stain',
                                type: 'nominal',
                                domain: ['gneg', 'gpos25', 'gpos50', 'gpos75', 'gpos100', 'gvar'],
                                range: ['black', 'black', 'black', 'black', 'white', 'black']
                            },
                            visibility: [
                                {
                                    operation: 'less-than',
                                    measure: 'width',
                                    threshold: '|xe-x|',
                                    transitionPadding: 10,
                                    target: 'mark'
                                }
                            ]
                        },
                        {
                            mark: 'rect',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen'], not: true }],
                            color: {
                                field: 'Stain',
                                type: 'nominal',
                                domain: ['gneg', 'gpos25', 'gpos50', 'gpos75', 'gpos100', 'gvar'],
                                range: ['white', '#D9D9D9', '#979797', '#636363', 'black', '#A0A0F2']
                            }
                        },
                        {
                            mark: 'triangleRight',
                            dataTransform: [
                                { type: 'filter', field: 'Stain', oneOf: ['acen'] },
                                { type: 'filter', field: 'Name', include: 'q' }
                            ],
                            color: { value: '#B40101' }
                        },
                        {
                            mark: 'triangleLeft',
                            dataTransform: [
                                { type: 'filter', field: 'Stain', oneOf: ['acen'] },
                                { type: 'filter', field: 'Name', include: 'p' }
                            ],
                            color: { value: '#B40101' }
                        },
                        {
                            mark: 'brush',
                            x: { linkingId: 'all' },
                            color: { value: 'blue' }
                        }
                    ],
                    x: { field: 'chromStart', type: 'genomic' },
                    xe: { field: 'chromEnd', type: 'genomic' },
                    size: { value: 20 },
                    stroke: { value: 'gray' },
                    strokeWidth: { value: 0.5 },
                    visibility: [
                        {
                            operation: 'greater-than',
                            measure: 'width',
                            threshold: 3,
                            transitionPadding: 5,
                            target: 'mark'
                        }
                    ],
                    style: {
                        outline: 'white'
                    },
                    width: 570,
                    height: 25
                }
            ]
        },
        {
            xDomain: { chromosome: '5', interval: [0, 43000000] },
            linkingId: 'all',
            spacing: 0,
            views: [
                {
                    tracks: [
                        {
                            data: {
                                url: GOSLING_PUBLIC_DATA.multivec,
                                type: 'multivec',
                                row: 'sample',
                                column: 'position',
                                value: 'peak',
                                categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                            },
                            mark: 'bar',
                            x: {
                                field: 'position',
                                type: 'genomic',
                                axis: 'top'
                            },
                            y: { field: 'peak', type: 'quantitative' },
                            color: { field: 'sample', type: 'nominal' },
                            width: 570,
                            height: 50
                        }
                    ]
                },
                {
                    alignment: 'overlay',
                    data: {
                        url: GOSLING_PUBLIC_DATA.geneAnnotation,
                        type: 'beddb',
                        genomicFields: [
                            { index: 1, name: 'start' },
                            { index: 2, name: 'end' }
                        ],
                        valueFields: [
                            { index: 5, name: 'strand', type: 'nominal' },
                            { index: 3, name: 'name', type: 'nominal' }
                        ],
                        exonIntervalFields: [
                            { index: 12, name: 'start' },
                            { index: 13, name: 'end' }
                        ]
                    },
                    tracks: [
                        {
                            dataTransform: [
                                { type: 'filter', field: 'type', oneOf: ['gene'] },
                                { type: 'filter', field: 'strand', oneOf: ['+'] }
                            ],
                            mark: 'triangleRight',
                            x: {
                                field: 'end',
                                type: 'genomic',
                                axis: 'none'
                            },
                            size: { value: 15 }
                        },
                        {
                            dataTransform: [{ type: 'filter', field: 'type', oneOf: ['gene'] }],
                            mark: 'text',
                            text: { field: 'name', type: 'nominal' },
                            x: {
                                field: 'start',
                                type: 'genomic'
                            },
                            xe: {
                                field: 'end',
                                type: 'genomic'
                            },
                            style: {
                                dy: -15
                            }
                        },
                        {
                            dataTransform: [
                                { type: 'filter', field: 'type', oneOf: ['gene'] },
                                { type: 'filter', field: 'strand', oneOf: ['-'] }
                            ],
                            mark: 'triangleLeft',
                            x: {
                                field: 'start',
                                type: 'genomic'
                            },
                            size: { value: 15 },
                            style: { align: 'right' }
                        },
                        {
                            dataTransform: [{ type: 'filter', field: 'type', oneOf: ['exon'] }],
                            mark: 'rect',
                            x: {
                                field: 'start',
                                type: 'genomic'
                            },
                            size: { value: 15 },
                            xe: {
                                field: 'end',
                                type: 'genomic'
                            }
                        },
                        {
                            dataTransform: [
                                { type: 'filter', field: 'type', oneOf: ['gene'] },
                                { type: 'filter', field: 'strand', oneOf: ['+'] }
                            ],
                            mark: 'rule',
                            x: {
                                field: 'start',
                                type: 'genomic'
                            },
                            strokeWidth: { value: 3 },
                            xe: {
                                field: 'end',
                                type: 'genomic'
                            },
                            style: {
                                linePattern: { type: 'triangleRight', size: 5 }
                            }
                        },
                        {
                            dataTransform: [
                                { type: 'filter', field: 'type', oneOf: ['gene'] },
                                { type: 'filter', field: 'strand', oneOf: ['-'] }
                            ],
                            mark: 'rule',
                            x: {
                                field: 'start',
                                type: 'genomic'
                            },
                            strokeWidth: { value: 3 },
                            xe: {
                                field: 'end',
                                type: 'genomic'
                            },
                            style: {
                                linePattern: { type: 'triangleLeft', size: 5 }
                            }
                        }
                    ],
                    row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },
                    color: { field: 'strand', type: 'nominal', domain: ['+', '-'], range: ['#7585FF', '#FF8A85'] },
                    visibility: [
                        {
                            operation: 'less-than',
                            measure: 'width',
                            threshold: '|xe-x|',
                            transitionPadding: 10,
                            target: 'mark'
                        }
                    ],
                    opacity: { value: 0.8 },
                    width: 570,
                    height: 60
                },
                {
                    tracks: [
                        {
                            data: {
                                url: GOSLING_PUBLIC_DATA.matrix,
                                type: 'matrix'
                            },
                            mark: 'rect',
                            x: { field: 'position1', type: 'genomic', axis: 'none' },
                            y: { field: 'position2', type: 'genomic', axis: 'right' },
                            color: { field: 'value', type: 'quantitative' },
                            width: 600,
                            height: 600
                        }
                    ]
                }
            ]
        }
    ]
};
