import type * as PIXI from 'pixi.js';
import type { GoslingTrackModel } from '../gosling-track-model';
import { cartesianToPolar } from '../utils/polar';
import colorToHex from '../utils/color-to-hex';
import * as d3_bundle from '../../d3.ForceBundle-master';

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

    /* make node_data dictionary */
    type Node = {
        x: number;
        y: number;
    };
    const node_data: { [key: number]: Node } = {};

    /* make edge_data array */
    const edge_data: any = [];

    /* edge bundling tension */
    const tension = spec.style?.edgeBundlingTension;

    /* monitor key values */
    let key = 0;

    /* render */
    data.forEach(d => {
        const x = model.encodedPIXIProperty('x', d);
        const xe = model.encodedPIXIProperty('xe', d);
        const stroke = model.encodedPIXIProperty('stroke', d);
        const strokeWidth = model.encodedPIXIProperty('strokeWidth', d);
        const opacity = model.encodedPIXIProperty('opacity', d);

        // TODO: Unsure at the moment if we need these.
        // const y = model.encodedPIXIProperty('y', d);
        // const color = model.encodedPIXIProperty('color', d);

        // stroke
        g.lineStyle(
            strokeWidth,
            colorToHex(stroke),
            opacity, // alpha
            0.5 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
        );

        if (circular) {
            const r = trackOuterRadius - trackRingSize / trackHeight;
            const posS = cartesianToPolar(x, trackWidth, r, tcx, tcy, startAngle, endAngle);
            const posE = cartesianToPolar(xe, trackWidth, r, tcx, tcy, startAngle, endAngle);

            const x1 = posS.x;
            const y1 = posS.y;
            const x4 = posE.x;
            const y4 = posE.y;

            let key_end = key + 1;

            if (Object.keys(node_data).length > 0) {
                for (let k = 0; k < Object.keys(node_data).length; k++) {
                    if (x1 == node_data[k].x && y1 == node_data[k].y) {
                        key = k;
                    } else if (x4 == node_data[k].x && y4 == node_data[k].y) {
                        key_end = k;
                    }
                }
            }

            node_data[key] = {
                x: x1,
                y: y1
            };

            node_data[key_end] = {
                x: x4,
                y: y4
            };

            edge_data[key] = { source: key, target: key + 1 };

            g.beginFill(colorToHex('white'), 0);
        } else if (linear) {
           /* const midX = (x + xe) / 2.0;
            
            //g.arc(midX, 0, (xe - x) / 2.0, -Math.PI, Math.PI);

            const x1 = x;
            const y1 = 100;
            const x4 = xe;
            const y4 = 100;

            let key_end = key + 1;

            if (Object.keys(node_data).length > 0) {
                for (let k = 0; k < Object.keys(node_data).length; k++) {
                    if (x1 == node_data[k].x) {
                        key = k;
                    } else if (x4 == node_data[k].x) {
                        key_end = k;
                    }
                }
            }

            node_data[key] = {
                x: x1,
                y: y1
            };

            node_data[key_end] = {
                x: x4,
                y: y4
            };

            edge_data[key] = { source: key, target: key + 1 };

            g.beginFill(colorToHex('white'), 0);*/

        } else {
            const midX = (x + xe) / 2.0;
            g.beginFill(colorToHex('white'), 0);
            g.arc(midX, 0, (xe - x) / 2.0, -Math.PI, Math.PI);
            g.closePath();
        }

        key++;
    });

    // @ts-expect-error
    const fbundling = d3_bundle.ForceEdgeBundling().nodes(node_data).edges(edge_data).bundling_stiffness(0.1);
    const results = fbundling();

    for (let i = 0; i < results.length; i++) {
        for (let j = 0; j < results[i].length; j++) {
            if (j != results[i].length - 1) {
                g.moveTo(results[i][j].x, results[i][j].y);
                g.lineTo(results[i][j + 1].x, results[i][j + 1].y);
            }
        }
    }
}
