import { getBoundingBox, Size, TrackInfo } from '../utils/bounding-box';
import { goslingToHiGlass } from '../gosling-to-higlass';
import { HiGlassModel } from '../higlass-model';
import { HiGlassSpec } from '../higlass.schema';
import { getLinkingInfo } from '../utils/linking';
import { GoslingSpec } from '../gosling.schema';
import { CompleteThemeDeep } from '../utils/theme';

export function renderHiGlass(
    spec: GoslingSpec,
    trackInfos: TrackInfo[],
    setHg: (hg: HiGlassSpec, size: Size) => void,
    theme: CompleteThemeDeep
) {
    if (trackInfos.length === 0) {
        // no tracks to render, so no point to render HiGlass.
        return;
    }

    /* Generate/update the HiGlass model by iterating tracks */
    const hgModel = new HiGlassModel();
    trackInfos.forEach(tb => {
        const { track, boundingBox: bb, layout } = tb;
        goslingToHiGlass(hgModel, track, bb, layout, theme);
    });

    /* Add linking information to the HiGlass model */
    const linkingInfos = getLinkingInfo(hgModel);

    /* Linking between a brush and a view */
    linkingInfos
        .filter(d => d.isBrush)
        .forEach(info => {
            hgModel.addBrush(
                info.layout,
                info.viewId,
                theme,
                // TODO: perhaps need some changes
                linkingInfos.find(d => !d.isBrush && d.linkId === info.linkId)?.viewId,
                info.style
            );
        });

    /*
     * Linking zoom levels between views
     */

    // Set `locksByViewUid`
    linkingInfos
        .filter(d => !d.isBrush)
        .forEach(d => {
            hgModel.spec().zoomLocks.locksByViewUid[d.viewId] = d.zoomLinkingId;
        });

    // Set `locksDict`
    const uniqueZoomLinkIds = Array.from(new Set(linkingInfos.map(d => d.zoomLinkingId)));
    uniqueZoomLinkIds.forEach(zoomLinkingId => {
        hgModel.spec().zoomLocks.locksDict[zoomLinkingId] = { uid: zoomLinkingId };
        linkingInfos
            .filter(d => !d.isBrush)
            .filter(d => d.zoomLinkingId === zoomLinkingId)
            .forEach(d => {
                hgModel.spec().zoomLocks.locksDict[zoomLinkingId][d.viewId] = [124625310.5, 124625310.5, 249250.621];
            });
    });

    /*
     * Linking locations between views
     */

    // Set `locksByViewUid`
    linkingInfos
        .filter(d => !d.isBrush)
        .forEach(d => {
            if (!hgModel.spec().locationLocks.locksByViewUid[d.viewId]) {
                hgModel.spec().locationLocks.locksByViewUid[d.viewId] = {};
            }
            hgModel.spec().locationLocks.locksByViewUid[d.viewId][d.channel === 'x' ? 'x' : 'y'] = {
                lock: d.linkId,
                axis: 'to-be-set' // source axis
            };
        });

    // set source `axis`
    const { locksByViewUid } = hgModel.spec().locationLocks;
    Object.keys(locksByViewUid).forEach(targetId => {
        Object.keys(locksByViewUid[targetId]).forEach(targetChannel => {
            const linkingId = locksByViewUid[targetId][targetChannel].lock;
            // Find a view that has the identical linkingId
            Object.keys(locksByViewUid)
                .filter(id => targetId !== id)
                .forEach(sourceId => {
                    Object.keys(locksByViewUid[sourceId]).forEach(sourceChannel => {
                        if (locksByViewUid[sourceId][sourceChannel].lock === linkingId) {
                            locksByViewUid[targetId][targetChannel].axis = sourceChannel;
                            locksByViewUid[sourceId][sourceChannel].axis = targetChannel;
                        }
                    });
                });
        });
    });

    // Remove locks that do not have proper axis
    // ...

    // Set `locksDict`
    const uniqueLocationLinkIds = Array.from(new Set(linkingInfos.map(d => d.linkId)));
    uniqueLocationLinkIds.forEach(linkId => {
        hgModel.spec().locationLocks.locksDict[linkId] = { uid: linkId };
        linkingInfos
            .filter(d => !d.isBrush)
            .filter(d => d.linkId === linkId)
            .forEach(d => {
                hgModel.spec().locationLocks.locksDict[linkId][d.viewId] = [124625310.5, 124625310.5, 249250.621];
            });
    });

    // !! Uncomment the following code to test with specific HiGlass viewConfig
    // hgModel.setExampleHiglassViewConfig();

    setHg(hgModel.spec(), getBoundingBox(trackInfos));
}
