// Shared geometry. Chrome actions occupy the same column in every sidebar row.
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const shape = { control: 6, row: 8, panel: 10 } as const;
export const uiSize = {
  chromeMouse: 42,
  chromeTouch: 54,
  divider: 1,
  touchTarget: 44,
  mouseAction: 28,
  icon: 15,
  iconSlot: 20,
  sidebarInset: 8,
  sidebarContentInset: 16,
  // Rail width includes the 1 px separator, leaving equal 8 px gutters.
  railMouse: 28 + 8 * 2 + 1,
  railTouch: 44 + 8 * 2 + 1,
  railButtonMouse: 28,
  railButtonTouch: 44,
  railGap: 8,
  searchGap: 12,
  sectionGap: 16,
} as const;

// Herdr prompt/machine-add: 18 px inset, 15 px title, 36 px inputs.
export const formSize = {
  width: 460,
  machineWidth: 560,
  inset: 18,
  title: 15,
  titleLine: 20,
  label: 11.5,
  body: 12.8,
  bodyLine: 19,
  input: 36,
  button: 32,
} as const;
