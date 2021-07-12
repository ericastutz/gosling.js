import { GoslingSpec } from './gosling.schema';
import { compileLayout } from './layout/layout';
import { HiGlassSpec } from './higlass.schema';
import { traverseToFixSpecDownstream, overrideTemplates } from './utils/spec-preprocess';
import { Size } from './utils/bounding-box';
import { CompleteThemeDeep } from './utils/theme';

export function compile(
    spec: GoslingSpec,
    setHg: (hg: HiGlassSpec, size: Size) => void,
    theme: Required<CompleteThemeDeep>
) {
    // Override default visual encoding (i.e., `DataTrack` => `BasicSingleTrack`)
    overrideTemplates(spec);

    // Fix track specs by looking into the root-level spec
    traverseToFixSpecDownstream(spec);

    // Make HiGlass models for individual tracks
    compileLayout(spec, setHg, theme);
}
