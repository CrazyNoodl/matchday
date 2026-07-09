import {
  resizeImage,
  MEDIA_MAX_DIMENSION,
  OCR_PAYLOAD_MAX_DIMENSION,
  STAT_PHOTO_STORAGE_MAX_DIMENSION,
} from '../imageResize';

const mockSaveAsync = jest.fn();
const mockRenderAsync = jest.fn();
const mockResize = jest.fn();
const mockManipulate = jest.fn();

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: (...args: unknown[]) => mockManipulate(...args) },
  SaveFormat: { JPEG: 'jpeg' },
}));

describe('resizeImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockManipulate.mockReturnValue({ resize: mockResize });
    mockResize.mockReturnValue({ renderAsync: mockRenderAsync });
    mockRenderAsync.mockResolvedValue({ saveAsync: mockSaveAsync });
  });

  it('no-ops when the source is already within the cap', async () => {
    const result = await resizeImage(
      'file://original.jpg',
      { width: 1000, height: 800 },
      MEDIA_MAX_DIMENSION,
    );
    expect(result).toEqual({ uri: 'file://original.jpg' });
    expect(mockManipulate).not.toHaveBeenCalled();
  });

  it('constrains by width when width is the longest edge', async () => {
    mockSaveAsync.mockResolvedValue({
      uri: 'file://resized.jpg',
      width: OCR_PAYLOAD_MAX_DIMENSION,
      height: 1000,
    });

    const result = await resizeImage(
      'file://original.jpg',
      { width: 4000, height: 3000 },
      OCR_PAYLOAD_MAX_DIMENSION,
      { base64: true },
    );

    expect(mockManipulate).toHaveBeenCalledWith('file://original.jpg');
    expect(mockResize).toHaveBeenCalledWith({ width: OCR_PAYLOAD_MAX_DIMENSION });
    expect(mockSaveAsync).toHaveBeenCalledWith({ format: 'jpeg', compress: 0.85, base64: true });
    expect(result).toEqual({ uri: 'file://resized.jpg', base64: undefined });
  });

  it('constrains by height when height is the longest edge', async () => {
    mockSaveAsync.mockResolvedValue({
      uri: 'file://resized.jpg',
      width: 900,
      height: STAT_PHOTO_STORAGE_MAX_DIMENSION,
    });

    await resizeImage(
      'file://original.jpg',
      { width: 900, height: 3600 },
      STAT_PHOTO_STORAGE_MAX_DIMENSION,
    );

    expect(mockResize).toHaveBeenCalledWith({ height: STAT_PHOTO_STORAGE_MAX_DIMENSION });
  });

  it('passes through the requested base64/compress options and result', async () => {
    mockSaveAsync.mockResolvedValue({
      uri: 'file://resized.jpg',
      width: 1200,
      height: 900,
      base64: 'abc123',
    });

    const result = await resizeImage('file://original.jpg', { width: 4800, height: 3600 }, 1200, {
      compress: 0.7,
      base64: true,
    });

    expect(mockSaveAsync).toHaveBeenCalledWith({ format: 'jpeg', compress: 0.7, base64: true });
    expect(result).toEqual({ uri: 'file://resized.jpg', base64: 'abc123' });
  });
});
