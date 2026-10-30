export interface PanelResizeHandleProps {
  label: string;
  side: "left" | "right";
  value: number;
  min: number;
  max: number;
  onClose?: () => void;
  onChange: (value: number) => void;
  defaultValue: number;
}
