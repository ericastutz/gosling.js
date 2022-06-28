import type * as PIXI from 'pixi.js';
import type { GoslingTrackModel } from '../gosling-track-model';
import { cartesianToPolar } from '../utils/polar';
import colorToHex from '../utils/color-to-hex';
import { Bundler } from '../../mingle-master';
import * as d3 from '/Users/ericastutz/Desktop/d3.ForceBundle-master';


export function drawEdgeBundling(g: PIXI.Graphics, trackInfo: any, model: GoslingTrackModel) {
    /* track spec */
    const spec = model.spec();

    console.info('test import', Bundler)

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
    const trackInnerRadius = spec.innerRadius ?? 220;
    const trackOuterRadius = spec.outerRadius ?? 300;
    const startAngle = spec.startAngle ?? 0;
    const endAngle = spec.endAngle ?? 360;
    const trackRingSize = trackOuterRadius - trackInnerRadius;
    const tcx = trackWidth / 2.0;
    const tcy = trackHeight / 2.0;

    /* render */
    data.forEach(d => {
        const x = model.encodedPIXIProperty('x', d);
        const xe = model.encodedPIXIProperty('xe', d);
        const stroke = model.encodedPIXIProperty('stroke', d);
        const strokeWidth = model.encodedPIXIProperty('strokeWidth', d);
        const opacity = model.encodedPIXIProperty('opacity', d);

        // TODO: We can first ignore `x1` and `x1e`
        // let x1 = model.encodedPIXIProperty('x1', d);
        // let x1e = model.encodedPIXIProperty('x1e', d);

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
            // TODO: Need to change this. The below code draw `straight` style links in circular layouts.
            const r = trackOuterRadius - trackRingSize / trackHeight;
            const posS = cartesianToPolar(x, trackWidth, r, tcx, tcy, startAngle, endAngle);
            const posE = cartesianToPolar(xe, trackWidth, r, tcx, tcy, startAngle, endAngle);

            const x1 = posS.x;
            const y1 = posS.y;
            const x4 = posE.x;
            const y4 = posE.y;

            g.moveTo(x1, y1); //start position
            g.lineTo(345, 345); //end position
            g.moveTo(x1, y1);
            g.bezierCurveTo(345, 345, 345, 345, x4, y4); 


            var node_data = {
                "0": {"x":922.24444, "y":347.29444},
                "1": {"x":814.42222, "y":409.16111},
                "2": {"x":738, "y":427.33333000000005},
                "3": {"x":784.5, "y":381.33333},
                "4": {"x":1066.09167, "y":350.40278},
                "5": {"x":925.4861099999999, "y":313.275}
            }

            var edge_data = [{"source":"0", "target":"1"}, {"source":"4", "target":"2"}, {"source":"0", "target":"3"}, {"source":"0","target":"4"}, {"source":"2", "target":"5"}, {"source":"3", "target":"2"}, {"source":"3", "target":"4"}]

            var fbundling = d3.ForceEdgeBundling()
				.nodes(node_data)
				.edges(edge_data);
	        var results  = fbundling();	



        } else {
            // TODO: Need to change this. The below code draw `circular` style links in linear layouts.
            const midX = (x + xe) / 2.0;
            g.beginFill(colorToHex('white'), 0);
            g.arc(midX, 0, (xe - x) / 2.0, -Math.PI, Math.PI);
            g.closePath();
        }
    });
}
