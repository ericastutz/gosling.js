import {
    // MultipleViews,
    CommonViewDef,
    // GoslingSpec,
    // Track,
    // SingleView,
    // OverlaidTrack,
    SingleTrack,
    PrGoslingSpec,
    PrSingleView,
    PrOverlaidTrack,
    PrMultipleViews,
    PrTrack
} from '../gosling.schema';
import { IsProcessedOverlaidTracks, isXAxis } from '../gosling.schema.guards';
import { HIGLASS_AXIS_SIZE } from '../higlass-model';
import {
    DEFAULT_CIRCULAR_VIEW_PADDING,
    DEFAULT_INNER_RADIUS_PROP,
    DEFAULT_SUBTITLE_HEIGHT,
    DEFAULT_TITLE_HEIGHT,
    DEFAULT_VIEW_SPACING
} from '../layout/defaults';
import { traverseTracksAndViews, traverseViewArrangements } from './spec-process';

export interface Size {
    width: number;
    height: number;
}

export interface GridInfo extends Size {
    columnSizes: number[];
    rowSizes: number[];
    columnGaps: number[];
    rowGaps: number[];
}

/**
 * Position information of each track.
 */
export interface BoundingBox extends Size {
    x: number;
    y: number;
}

/**
 * Relative positioning of views, used in HiGlass view configs as `layout`.
 */
export interface RelativePosition {
    w: number;
    h: number;
    x: number;
    y: number;
}

/**
 * Track information for its arrangement.
 */
export interface TrackInfo {
    tracksOverlaid: PrTrack[];
    boundingBox: BoundingBox;
    layout: RelativePosition;
}

/**
 * Return the size of entire visualization.
 * @param trackInfos
 */
export function getBoundingBox(trackInfos: TrackInfo[]) {
    let width = 0;
    let height = 0;

    trackInfos.forEach(_ => {
        const w = _.boundingBox.x + _.boundingBox.width;
        const h = _.boundingBox.y + _.boundingBox.height;
        if (height < h) {
            height = h;
        }
        if (width < w) {
            width = w;
        }
    });
    return { width, height };
}

/**
 * Collect information of individual tracks including their size/position and specs
 * @param spec
 */
export function getRelativeTrackInfo(spec: PrGoslingSpec): TrackInfo[] {
    let trackInfos: TrackInfo[] = [] as TrackInfo[];

    // Collect track information including spec, bounding boxes, and RGL' `layout`.
    collectTrackInfo(spec, trackInfos); // RGL parameter (`layout`) is not deteremined yet since we do not know the entire size of vis yet.

    // Get the size of entire visualization.
    const size = getBoundingBox(trackInfos);

    // Titles
    if (spec.title || spec.subtitle) {
        // If title and/or subtitle presents, offset the y position by title/subtitle size
        const titleHeight = (spec.title ? DEFAULT_TITLE_HEIGHT : 0) + (spec.subtitle ? DEFAULT_SUBTITLE_HEIGHT : 0);
        const marginBottom = 4;

        size.height += titleHeight + marginBottom;

        // Offset all non-title tracks.
        trackInfos.forEach(_ => {
            _.boundingBox.y += titleHeight + marginBottom;
        });

        // Add a title track.
        trackInfos = [
            {
                tracksOverlaid: [getTextTrack({ width: size.width, height: titleHeight }, spec.title, spec.subtitle)],
                boundingBox: { x: 0, y: 0, width: size.width, height: titleHeight },
                layout: { x: 0, y: 0, w: 12, h: (titleHeight / size.height) * 12.0 }
            },
            ...trackInfos
        ];
    }

    // Calculate `layout`s for React Grid Layout (RGL).
    trackInfos.forEach(_ => {
        _.layout.x = (_.boundingBox.x / size.width) * 12;
        _.layout.y = (_.boundingBox.y / size.height) * 12;
        _.layout.w = (_.boundingBox.width / size.width) * 12;
        _.layout.h = (_.boundingBox.height / size.height) * 12;
    });

    return trackInfos;
}

/**
 * Visit all tracks and views in the Gosling spec to collect information of individual tracks, including their size, position, and spec.
 * @param spec
 * @param output
 * @param dx
 * @param dy
 * @param forceWidth
 * @param forceHeight
 * @param circularRootNotFound
 */
function collectTrackInfo(
    spec: PrGoslingSpec | PrSingleView,
    output: TrackInfo[],
    dx = 0,
    dy = 0,
    circularRootNotFound = true // A flag variable to find a root level of circular tracks/views
) {
    let cumWidth = 0;
    let cumHeight = 0;

    /* Parameters to determine if we need to combine all the children to show as a single circular visualization */
    let allChildCircularLayout = true;
    let traversedAtLeastOnce = false;
    traverseTracksAndViews(spec, (tv: CommonViewDef) => {
        traversedAtLeastOnce = true;
        if (tv.layout !== 'circular') {
            allChildCircularLayout = false;
        }
    });

    // if a horizontal/vertical arrangement is being used by children, they should be placed separately.
    let noChildConcatArrangement = true;
    traverseViewArrangements(spec, (a: PrMultipleViews) => {
        if (a.arrangement === 'vertical' || a.arrangement === 'horizontal') {
            noChildConcatArrangement = false;
        }
    });

    const isThisCircularRoot =
        circularRootNotFound &&
        allChildCircularLayout &&
        traversedAtLeastOnce &&
        noChildConcatArrangement &&
        (('views' in spec && (spec.arrangement === 'parallel' || spec.arrangement === 'serial')) || 'tracks' in spec);

    const numTracksBeforeInsert = output.length;

    if ('tracks' in spec) {
        // Use the largest `width` for this view.
        cumWidth = Math.max(...spec.tracks.map((d: PrOverlaidTrack | PrTrack) => d.width));

        spec.tracks.forEach((track, i, array) => {
            // Use shared `width` across tracks.
            track.width = cumWidth;

            const addInfo = (t: PrTrack) => {
                output.push({
                    tracksOverlaid: [t],
                    boundingBox: {
                        x: dx,
                        y: dy + cumHeight,
                        width: cumWidth,
                        height: track.height
                    },
                    layout: { x: 0, y: 0, w: 0, h: 0 } // Just put a dummy info here, this should be added after entire bounding box has been determined
                });
            };
            if (IsProcessedOverlaidTracks(track)) {
                if (getNumOfXAxes(track.tracks) >= 1) {
                    track.height += HIGLASS_AXIS_SIZE; // TODO: this should be done in the spec-preprocess
                }
                track.tracks.forEach(t => addInfo(t));
            } else {
                if (getNumOfXAxes([track]) === 1) {
                    track.height += HIGLASS_AXIS_SIZE;
                }
                addInfo(track);
                cumHeight += track.height;
            }

            if (i !== array.length - 1) {
                cumHeight += spec.spacing !== undefined ? spec.spacing : 0;
            }
        });
    } else {
        // We did not reach a track definition, so continue traversing.

        // We first calculate position and size of each view and track by considering it as if it uses a linear layout
        if (spec.arrangement === 'parallel' || spec.arrangement === 'vertical') {
            const spacing = spec.spacing !== undefined ? spec.spacing : DEFAULT_VIEW_SPACING;

            spec.views.forEach((v, i, array) => {
                const viewBB = collectTrackInfo(
                    v,
                    output,
                    dx,
                    dy + cumHeight,
                    !isThisCircularRoot && circularRootNotFound
                );

                if (cumWidth < viewBB.width) {
                    cumWidth = viewBB.width;
                }
                if (i !== array.length - 1) {
                    cumHeight += spacing;
                }
                cumHeight += viewBB.height;
            });
        } else if (spec.arrangement === 'serial' || spec.arrangement === 'horizontal') {
            spec.views.forEach((v, i, array) => {
                const spacing = spec.spacing !== undefined ? spec.spacing : DEFAULT_VIEW_SPACING;

                // If so, we do not want to put large between-gap.
                // spacing *= (spec.arrangement === 'serial' && spec.layout === 'circular' ? 0.2 : 1);

                const viewBB = collectTrackInfo(
                    v,
                    output,
                    dx + cumWidth,
                    dy,
                    !isThisCircularRoot && circularRootNotFound
                );

                if (cumHeight < viewBB.height) {
                    cumHeight = viewBB.height;
                }
                if (i !== array.length - 1) {
                    cumWidth += spacing;
                }
                cumWidth += viewBB.width;
            });
        }
    }

    // If this is a root view that uses a circular layout, use the posiiton and size of views/tracks to calculate circular-specific parameters, such as outer/inner radius and start/end angle
    if (isThisCircularRoot) {
        const cTracks = output.slice(numTracksBeforeInsert);

        // const ifMultipleViews =
        //     'views' in spec &&
        //     (spec.arrangement === 'parallel' || spec.arrangement === 'serial') &&
        //     spec.views.length > 1;

        const SPACING = spec.spacing !== undefined ? spec.spacing : DEFAULT_VIEW_SPACING;
        const PADDING = DEFAULT_CIRCULAR_VIEW_PADDING;
        const INNER_RADIUS = spec.centerRadius !== undefined ? spec.centerRadius : DEFAULT_INNER_RADIUS_PROP;
        const TOTAL_RADIUS = cumWidth / 2.0 + PADDING; // (cumWidth + cumHeight) / 2.0 / 2.0;
        const TOTAL_RING_SIZE = TOTAL_RADIUS * (1 - INNER_RADIUS);

        // const numXAxes = getNumOfXAxes(cTracks.map(info => info.track));

        cTracks.forEach(t => {
            t.tracksOverlaid.forEach(o => {
                o.layout = 'circular';

                o._outerRadius = TOTAL_RADIUS - PADDING - ((t.boundingBox.y - dy) / cumHeight) * TOTAL_RING_SIZE;
                o._innerRadius =
                    TOTAL_RADIUS -
                    PADDING -
                    ((t.boundingBox.y + t.boundingBox.height - dy) / cumHeight) * TOTAL_RING_SIZE;

                // in circular layouts, we place spacing in the origin as well
                const spacingAngle = (SPACING / cumWidth) * 360;

                // !!! Multiplying by (cumWidth - SPACING) / cumWidth) to rescale to exclude SPACING
                o._startAngle =
                    spacingAngle + ((((t.boundingBox.x - dx) / cumWidth) * (cumWidth - SPACING)) / cumWidth) * 360;
                o._endAngle =
                    ((((t.boundingBox.x + t.boundingBox.width - dx) / cumWidth) * (cumWidth - SPACING)) / cumWidth) *
                    360;
                // t.track.startAngle = ((t.boundingBox.x - dx) / cumWidth) * 360;
                // t.track.endAngle = ((t.boundingBox.x + t.boundingBox.width - dx) / cumWidth) * 360;

                t.boundingBox.x = dx;
                t.boundingBox.y = dy;

                // Circular tracks share the same size and position since technically these tracks are being overlaid on top of the others
                t.boundingBox.height = o.height = t.boundingBox.width = o.width = TOTAL_RADIUS * 2;

                // if (i !== 0) {
                //     // Technically, we overlay tracks that is 'combined' as a single circular view.
                //     t.tracksOverlaid._overlayOnPreviousTrack = true;
                // }

                // !!! As circular tracks are not well supported now when parallelized or serialized, we do not support brush for now.
                // if (ifMultipleViews) {
                //     if (IsProcessedOverlaidTracks(t.tracksOverlaid)) {
                //         // TODO:
                //         // t.track.overlay = t.track.overlay.filter(o => o.mark !== 'brush');
                //     }
                // }
            });
        });

        cumHeight = TOTAL_RADIUS * 2;
    }

    return { x: dx, y: dy, width: cumWidth, height: cumHeight };
}

export function getNumOfXAxes(tracks: SingleTrack[]): number {
    return tracks.filter(t => isXAxis(t)).length;
}

/**
 * Get a spec for a title track.
 * @param size
 * @param title
 * @param subtitle
 */
const getTextTrack = (size: Size, title?: string, subtitle?: string) => {
    return JSON.parse(
        JSON.stringify({
            mark: 'header',
            width: size.width,
            height: size.height,
            title,
            subtitle
        })
    ) as PrTrack;
};
