
export interface Point {
  x: number; // 相對於圖片中心點的座標
  y: number;
}

export interface Layer {
  id: string;
  name: string;
  type: 'perspective' | 'ortho-grid'; // 新增：圖層類型
  points: Point[];
  visible: boolean;
  locked: boolean;
  color: string;
  density: number; // 透視為放射數量，網格為垂直線數量
  densityY?: number; // 新增：網格專用的水平線數量
  width: number;
}

export interface AppState {
  image: HTMLImageElement | null;
  layers: Layer[];
  activeLayerId: string | null;
  workspaceZoom: number;
}
