export interface Guide {
  id: string
  title: string
  thumbnail: string
  type: 'script' | 'video'
  url: string
}

export const MOCK_GUIDES: Guide[] = [
  {
    id: 'debloat-windows-script',
    title: 'Debloat Windows 11 in 5 Minutes',
    thumbnail: 'https://picsum.photos/seed/debloat-windows/400/225',
    type: 'script',
    url: 'https://github.com/Raphire/Win11Debloat',
  },
  {
    id: 'gpu-driver-cleanup-script',
    title: 'Clean GPU Drivers Before Reinstalling',
    thumbnail: 'https://picsum.photos/seed/gpu-cleanup/400/225',
    type: 'script',
    url: 'https://www.wagnardsoft.com/display-driver-uninstaller-DDU-',
  },
  {
    id: 'bios-update-script',
    title: 'Safely Flash a Motherboard BIOS Update',
    thumbnail: 'https://picsum.photos/seed/bios-flash/400/225',
    type: 'script',
    url: 'https://www.asus.com/support/faq/1038500/',
  },
  {
    id: 'ram-xmp-script',
    title: 'Enable XMP/DOCP for Full RAM Speed',
    thumbnail: 'https://picsum.photos/seed/ram-xmp/400/225',
    type: 'script',
    url: 'https://www.corsair.com/us/en/explorer/diy/memory/what-is-xmp/',
  },
  {
    id: 'first-build-video',
    title: 'How to Build a Gaming PC (Full Guide)',
    thumbnail: 'https://picsum.photos/seed/first-build/400/225',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=IhX0fOUYd8Q',
  },
  {
    id: 'cable-management-video',
    title: 'Cable Management Tips for Beginners',
    thumbnail: 'https://picsum.photos/seed/cable-mgmt/400/225',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=UWup2VbF3Xg',
  },
  {
    id: 'thermal-paste-video',
    title: 'How to Apply Thermal Paste Correctly',
    thumbnail: 'https://picsum.photos/seed/thermal-paste/400/225',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=r4T5uMuCXeY',
  },
  {
    id: 'windows-install-video',
    title: 'Installing Windows 11 From a USB Drive',
    thumbnail: 'https://picsum.photos/seed/windows-install/400/225',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=9OpaSFkPYA',
  },
]
