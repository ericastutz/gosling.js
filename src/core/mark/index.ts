import { GoslingTrackModel } from '../gosling-track-model';
import { drawPoint } from './point';
import { drawLine } from './line';
import { drawBar } from './bar';
import { drawArea } from './area';
import { drawRect } from './rect';
import { ChannelTypes } from '../gosling.schema';
import { drawTriangle } from './triangle';
import { drawText } from './text';
import { drawRule } from './rule';
import { drawLink } from './link';
import { drawGrid } from './grid';
import { drawCircularTitle } from './title';
import { drawChartOutlines } from './outline';
import { drawColorLegend, drawRowLegend } from './legend';
import { drawCircularYAxis, drawLinearYAxis } from './axis';
import { drawCircularOutlines } from './outline-circular';
import { drawBackground } from './background';
import { CompleteThemeDeep } from '../utils/theme';
import { Is2DTrack } from '../gosling.schema.guards';

/**
 * Visual channels currently supported for visual encoding.
 */
export const SUPPORTED_CHANNELS: (keyof typeof ChannelTypes)[] = [
    'x',
    'xe',
    'x1',
    'x1e',

    'y',
    'ye',
    'y1',
    'y1e',

    'color',
    'size',
    'row',
    'stroke',
    'strokeWidth',
    'opacity',
    'text'
    // ...
];

export const RESOLUTION = 4;

/**
 * Draw a track based on the track specification in a Gosling grammar.
 */
export function drawMark(HGC: any, trackInfo: any, tile: any, model: GoslingTrackModel) {
    if (!HGC || !trackInfo || !tile) {
        // We did not receive parameters correctly.
        return;
    }

    if (model.spec().mark === 'brush') {
        // Interactive brushes are rendered by our another plugin track, called `gosling-brush`
        return;
    }

    // console.log(trackInfo._xScale.domain(), trackInfo._yScale.domain(), (model.getChannelScale('x') as any)?.domain(), (model.getChannelScale('y') as any)?.domain());

    // Replace the scale of a genomic axis with the one that is generated by the HiGlass data fetcher.
    ['x', 'x1', 'x1e', 'xe'].forEach((d: any) => {
        // const c = tm.spec()[d as keyof typeof ChannelTypes];
        // if(IsChannelDeep(c) && c.type === 'genomic') {
        model.setChannelScale(d, trackInfo._xScale);
        // }
    });

    if (Is2DTrack(model.spec())) {
        // Since small numbers are positioned on the top in the y axis, we reverse the domain, making it consistent to regular y scale.
        const yScale = trackInfo._yScale.copy();
        yScale.range([yScale.range()[1], yScale.range()[0]]);

        ['y', 'y1', 'y1e', 'ye'].forEach((d: any) => {
            model.setChannelScale(d, yScale);
        });
    }

    // Size of a track
    const [trackWidth, trackHeight] = trackInfo.dimensions;

    // DEBUG
    // drawChartOutlines(HGC, trackInfo, model);
    //

    /* spec */
    switch (model.spec().mark) {
        case 'point':
            drawPoint(trackInfo, tile.graphics, model);
            break;
        case 'bar':
            drawBar(trackInfo, tile, model);
            break;
        case 'line':
            drawLine(tile.graphics, model, trackInfo.tooltips, trackWidth, trackHeight);
            break;
        case 'area':
            drawArea(HGC, trackInfo, tile, model);
            break;
        case 'rect':
            drawRect(HGC, trackInfo, tile, model);
            break;
        case 'triangleLeft':
        case 'triangleRight':
        case 'triangleBottom':
            drawTriangle(tile.graphics, model, trackWidth, trackHeight);
            break;
        case 'text':
            drawText(HGC, trackInfo, tile, model);
            break;
        case 'rule':
            drawRule(HGC, trackInfo, tile, model);
            break;
        case 'betweenLink':
        case 'withinLink':
            drawLink(tile.graphics, trackInfo, model);
            break;
        default:
            console.warn('Unsupported mark type');
            break;
    }
}

/**
 * Draw chart embellishments before rendering marks.
 */
export function drawPreEmbellishment(
    HGC: any,
    trackInfo: any,
    tile: any,
    model: GoslingTrackModel,
    theme: Required<CompleteThemeDeep>
) {
    if (!HGC || !trackInfo || !tile) {
        // We did not receive parameters correctly.
        return;
    }

    if (model.spec().mark === 'brush') {
        // We do not draw brush. Instead, higlass do.
        return;
    }

    // This is only to render embellishments only once.
    // TODO: Instead of rendering and removing for every tiles, render pBorder only once
    trackInfo.pBackground.clear();
    trackInfo.pBackground.removeChildren();
    trackInfo.pBorder.clear();
    trackInfo.pBorder.removeChildren();

    const CIRCULAR = model.spec().layout === 'circular';

    // Replace the scale of a genomic axis with the one that is generated by the HiGlass data fetcher.
    ['x', 'x1', 'x1e', 'xe'].forEach((d: any) => {
        // const c = tm.spec()[d as keyof typeof ChannelTypes];
        // if(IsChannelDeep(c) && c.type === 'genomic') {
        model.setChannelScale(d, trackInfo._xScale);
        // }
    });

    if (CIRCULAR) {
        drawCircularOutlines(HGC, trackInfo, tile, model, theme);
    } else {
        drawBackground(HGC, trackInfo, tile, model, theme);
        drawChartOutlines(HGC, trackInfo, model, theme);
    }
    drawGrid(trackInfo, model, theme);
}

/**
 * Draw chart embellishments after rendering marks.
 */
export function drawPostEmbellishment(
    HGC: any,
    trackInfo: any,
    tile: any,
    model: GoslingTrackModel,
    theme: Required<CompleteThemeDeep>
) {
    if (!HGC || !trackInfo || !tile) {
        // We did not receive parameters correctly.
        return;
    }

    if (model.spec().mark === 'brush') {
        // We do not draw brush. Instead, higlass do.
        return;
    }

    const CIRCULAR = model.spec().layout === 'circular';

    // Replace the scale of a genomic axis with the one that is generated by the HiGlass data fetcher.
    ['x', 'x1', 'x1e', 'xe'].forEach((d: any) => {
        // const c = tm.spec()[d as keyof typeof ChannelTypes];
        // if(IsChannelDeep(c) && c.type === 'genomic') {
        model.setChannelScale(d, trackInfo._xScale);
        // }
    });

    if (CIRCULAR) {
        drawCircularYAxis(HGC, trackInfo, tile, model, theme);
        drawCircularTitle(HGC, trackInfo, tile, model, theme);
    } else {
        drawLinearYAxis(HGC, trackInfo, tile, model, theme);
        drawRowLegend(HGC, trackInfo, tile, model, theme);
    }
    drawColorLegend(HGC, trackInfo, tile, model, theme);
}
