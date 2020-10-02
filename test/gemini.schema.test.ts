import { Channel, BasicSingleTrack } from '../src/core/gemini.schema';
import {
    IsChannelDeep,
    IsChannelValue,
    IsDataMetadata,
    IsDomainChrInterval,
    getValueUsingChannel,
    IsStackedMark,
    IsStackedChannel,
    getVisualizationType
} from '../src/core/gemini.schema.guards';

describe('gemini schema should be checked correctly', () => {
    it('Type guards should be checked correctly', () => {
        expect(IsChannelDeep({ value: 1 } as Channel)).toBe(false);
        expect(IsChannelDeep({ field: 'x' } as Channel)).toBe(true);
        expect(IsChannelValue({ value: 1 } as Channel)).toBe(true);
        expect(IsChannelValue({ field: 'x' } as Channel)).toBe(false);

        expect(IsDataMetadata({ type: 'higlass-multivec', column: 'c', row: 'r', value: 'v' })).toBe(true);
        expect(IsDomainChrInterval({ chromosome: '1', interval: [1, 1000] })).toBe(true);
    });

    it('Should properly retreive values from data with channel spec', () => {
        expect(getValueUsingChannel({ x: 1 }, { field: 'x' } as Channel)).toBe(1);

        expect(getValueUsingChannel({ x: 1 }, { field: 'y' } as Channel)).toBeUndefined();
    });

    it('Spec for stacked bar/area charts should be detected as using a stacked mark', () => {
        expect(
            IsStackedMark({
                mark: 'bar',
                x: { field: 'x', type: 'genomic' },
                y: { field: 'y', type: 'quantitative' },
                color: { field: 'y', type: 'nominal' }
            } as BasicSingleTrack)
        ).toBe(true);

        expect(
            IsStackedMark({
                mark: 'area',
                x: { field: 'x', type: 'genomic' },
                y: { field: 'y', type: 'quantitative' },
                color: { field: 'y', type: 'nominal' }
            } as BasicSingleTrack)
        ).toBe(true);
    });

    it('Spec for regular charts without stacking marks should be detected as using a non-stacked mark', () => {
        expect(
            IsStackedMark({
                mark: 'bar',
                x: { field: 'x', type: 'genomic' },
                y: { field: 'y', type: 'quantitative' },
                color: { field: 'y', type: 'quantitative' }
            } as BasicSingleTrack)
        ).toBe(false);

        expect(
            IsStackedMark({
                mark: 'bar',
                x: { field: 'x', type: 'genomic' },
                y: { field: 'y', type: 'quantitative' },
                color: { field: 'y', type: 'nominal' },
                row: { field: 'y', type: 'nominal' }
            } as BasicSingleTrack)
        ).toBe(false);

        expect(
            IsStackedMark({
                mark: 'line',
                x: { field: 'x', type: 'genomic' },
                y: { field: 'y', type: 'quantitative' },
                color: { field: 'y', type: 'nominal' }
            } as BasicSingleTrack)
        ).toBe(false);
    });

    it('Stacked channels should be detected correctly', () => {
        expect(
            IsStackedChannel(
                {
                    mark: 'bar',
                    x: { field: 'x', type: 'genomic' },
                    y: { field: 'y', type: 'quantitative' },
                    color: { field: 'y', type: 'nominal' }
                } as BasicSingleTrack,
                'y'
            )
        ).toBe(true);

        expect(
            IsStackedChannel(
                {
                    mark: 'bar',
                    x: { field: 'x', type: 'genomic' },
                    y: { field: 'y', type: 'quantitative' },
                    color: { field: 'y', type: 'nominal' }
                } as BasicSingleTrack,
                'x'
            )
        ).toBe(false);
    });

    it('Visualization types should be detected correctly', () => {
        expect(
            getVisualizationType({
                mark: 'line'
            } as BasicSingleTrack)
        ).toBe('line');
    });
});
