import type * as PIXI from 'pixi.js';
import type { GoslingTrackModel } from '../gosling-track-model';
import { cartesianToPolar } from '../utils/polar';
import colorToHex from '../utils/color-to-hex';
import * as d3_bundle from '../../d3.ForceBundle-master';
import { CentroidLinkage, Dendrogram, HierarchicalClustering } from 'dbvis-hc';
import * as slider from '../../../gosling-react/src/example/WidgetEncoding.js';

export function drawEdgeBundling(g: PIXI.Graphics, trackInfo: any, model: GoslingTrackModel) {
    /* track spec */
    const spec = model.spec();

    if (!spec.width || !spec.height) {
        console.warn('Size of a track is not properly determined, so visual mark cannot be rendered');
        return;
    }

    /* data */
    const data = model.data();

    /* track size */
    const [trackWidth, trackHeight] = trackInfo.dimensions;

    /* circular parameters */
    const circular = spec.layout === 'circular';
    const linear = spec.layout === 'linear';
    const trackInnerRadius = spec.innerRadius ?? 220;
    const trackOuterRadius = spec.outerRadius ?? 300;
    const startAngle = spec.startAngle ?? 0;
    const endAngle = spec.endAngle ?? 360;
    const trackRingSize = trackOuterRadius - trackInnerRadius;
    const tcx = trackWidth / 2.0;
    const tcy = trackHeight / 2.0;
    const r = trackOuterRadius - trackRingSize / trackHeight;

    /* row separation */
    const rowCategories: string[] = (model.getChannelDomainArray('row') as string[]) ?? ['___SINGLE_ROW___'];
    const rowHeight = trackHeight / rowCategories.length;

    /* make node_data dictionary */
    type Node = {
        x: number;
        y: number;
    };
    const node_data: { [key: number]: Node } = {};

    /* make edge_data array */
    const edge_data: any = [];

    /* make stroke array */
    const stroke_data: any = [];

    /* edge bundling tension */
    let tension: any = slider.WidgetEncoding();

    if (tension > 0.4) {
        tension = 0.4;
    } else if (tension < 0.0) {
        tension = 0.0;
    }

    /* monitor key values */
    let key = -2;

    /* render */
    rowCategories.forEach(rowCategory => {
        const rowPosition = model.encodedValue('row', rowCategory);
        /* render */
        data.forEach(d => {
            const x = model.encodedPIXIProperty('x', d);
            const xe = model.encodedPIXIProperty('xe', d);
            const y = model.encodedPIXIProperty('y', d);
            const stroke = model.encodedPIXIProperty('stroke', d);
            const strokeWidth = model.encodedPIXIProperty('strokeWidth', d);
            const opacity = model.encodedPIXIProperty('opacity', d);

            if (circular) {
                const posS = cartesianToPolar(x, trackWidth, r, tcx, tcy, startAngle, endAngle);
                const posE = cartesianToPolar(xe, trackWidth, r, tcx, tcy, startAngle, endAngle);

                const x1 = posS.x;
                const y1 = posS.y;
                const x4 = posE.x;
                const y4 = posE.y;

                key = key + 2;
                const key_end = key + 1;

                stroke_data[key] = { strokeWidth: strokeWidth, stroke: stroke, opacity: opacity };

                /*if (Object.keys(node_data).length > 0) {
                    for (let k = 0; k < Object.keys(node_data).length; k++) {
                        if (node_data[k] != undefined) {
                            if (x1 == node_data[k].x && y1 == node_data[k].y) {
                                key = k;
                            }
                            if (x4 == node_data[k].x && y4 == node_data[k].y) {
                                key_end = k;
                            }
                        }
                    }
                }*/

                node_data[key] = {
                    x: x1,
                    y: y1
                };

                node_data[key_end] = {
                    x: x4,
                    y: y4
                };

                if (key == 0) {
                    edge_data[key] = { source: key, target: key_end };
                } else {
                    edge_data[key / 2] = { source: key, target: key_end };
                }

                g.beginFill(colorToHex('white'), 0);
            } else if (linear) {
                const x1 = xe;
                const y1 = rowPosition + rowHeight;
                const x4 = x;
                const y4 = rowPosition;

                key = key + 2;
                const key_end = key + 1;

                stroke_data[key] = { strokeWidth: strokeWidth, stroke: stroke, opacity: opacity };

                /* if (Object.keys(node_data).length > 0) {
                    for (let k = 0; k < Object.keys(node_data).length; k++) {
                        if (node_data[k] != undefined) {
                            if (x1 == node_data[k].x && y1 == node_data[k].y) {
                                key = k;
                            }
                            if (x4 == node_data[k].x && y4 == node_data[k].y) {
                                key_end = k;
                            }
                        }
                    }
                }*/

                node_data[key] = {
                    x: x1,
                    y: y1
                };

                node_data[key_end] = {
                    x: x4,
                    y: y4
                };

                if (key == 0) {
                    edge_data[key] = { source: key, target: key_end };
                } else {
                    edge_data[key / 2] = { source: key, target: key_end };
                }

                g.beginFill(colorToHex('white'), 0);
            } else {
                const midX = (x + xe) / 2.0;
                g.beginFill(colorToHex('white'), 0);
                g.arc(midX, 0, (xe - x) / 2.0, -Math.PI, Math.PI);
                g.closePath();
            }
        });
    });

    let results: any;
    if (tension == undefined) {
        // @ts-expect-error
        const fbundling = d3_bundle.ForceEdgeBundling().nodes(node_data).edges(edge_data);
        results = fbundling();
    } else {
        // @ts-expect-error
        const fbundling = d3_bundle.ForceEdgeBundling().nodes(node_data).edges(edge_data).step_size(tension);
        results = fbundling();
    }

    // printing results 
    for (let i = 0; i < results.length; i++) {
        for (let j = 0; j < results[i].length; j++) {
            if (j != results[i].length - 1) {
                // stroke
                g.lineStyle(
                    stroke_data[i*2].strokeWidth,
                    colorToHex(stroke_data[i*2].stroke),
                    stroke_data[i*2].opacity, // alpha
                    0.5 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outer)
                );
                
                // checking to see if lines are outside of bounds 
                const dist = Math.sqrt((results[i][j].x - tcx) ** 2 + (results[i][j].y - tcy) ** 2);
                const dist2 = Math.sqrt((results[i][j + 1].x - tcx) ** 2 + (results[i][j + 1].y - tcy) ** 2);
                // if outside of bounds, print straight line 
                if (dist > trackOuterRadius || dist2 > trackOuterRadius) {
                        g.moveTo(results[i][0].x, results[i][0].y);
                        g.lineTo(results[i][results[i].length - 1].x, results[i][results[i].length - 1].y);
                } else {
                    g.moveTo(results[i][j].x, results[i][j].y);
                    g.lineTo(results[i][j + 1].x, results[i][j + 1].y);
                }
            }
        }
    }
}
