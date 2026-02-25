export type Card = {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    color: string;
};

export type ConnectorType = 'straight' | 'curved';
export type ConnectorStyle = 'solid' | 'dashed';

export type Connector = {
    id: string;
    fromCardId: string;
    toCardId: string;
    type: ConnectorType;
    style: ConnectorStyle;
};

export type Point = {
    x: number;
    y: number;
};

export type ToolType = 'select' | 'hand' | 'sticky' | 'arrow';

export type AppState = {
    // Board Data
    cards: Card[];
    connectors: Connector[];

    // Selection
    selectedIds: string[];

    // Viewport/Canvas state
    canvasScale: number;
    canvasOffset: Point;

    // Current Tool
    currentTool: ToolType;

    // Connector Creation State
    connectingFromCardId: string | null;
};
