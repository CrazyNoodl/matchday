import { useStore } from '../index';

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => null,
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

describe('groupByTours', () => {
  it('defaults to true', () => {
    expect(useStore.getState().groupByTours).toBe(true);
  });

  it('setGroupByTours flips the value', () => {
    useStore.getState().setGroupByTours(false);
    expect(useStore.getState().groupByTours).toBe(false);

    useStore.getState().setGroupByTours(true);
    expect(useStore.getState().groupByTours).toBe(true);
  });
});
