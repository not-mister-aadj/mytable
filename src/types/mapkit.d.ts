declare namespace mapkit {
  class Coordinate {
    constructor(latitude: number, longitude: number);
    latitude: number;
    longitude: number;
  }

  class CoordinateSpan {
    constructor(latitudeDelta: number, longitudeDelta: number);
  }

  class CoordinateRegion {
    constructor(center: Coordinate, span: CoordinateSpan);
  }

  class Style {
    constructor(options?: {
      strokeColor?: string;
      lineWidth?: number;
      lineDash?: number[];
    });
  }

  class MarkerAnnotation {
    constructor(
      coordinate: Coordinate,
      options?: {
        color?: string;
        glyphText?: string;
        title?: string;
        subtitle?: string;
        displayPriority?: number;
      },
    );
  }

  class PolylineOverlay {
    constructor(coordinates: Coordinate[], options?: { style?: Style });
  }

  interface MapConstructorOptions {
    center?: Coordinate;
    region?: CoordinateRegion;
    showsCompass?: string;
    showsZoomControl?: boolean;
    showsMapTypeControl?: boolean;
    isRotationEnabled?: boolean;
    mapType?: string;
  }

  class Map {
    constructor(element: HTMLElement | string, options?: MapConstructorOptions);
    addAnnotation(annotation: MarkerAnnotation): void;
    addAnnotations(annotations: MarkerAnnotation[]): void;
    addOverlay(overlay: PolylineOverlay): void;
    showItems(
      items: (MarkerAnnotation | PolylineOverlay)[],
      options?: { animate?: boolean; padding?: { top: number; right: number; bottom: number; left: number } },
    ): void;
    destroy(): void;
    static MapTypes: { standard: string; mutedStandard: string };
  }

  function init(options: {
    authorizationCallback: (done: (token: string) => void) => void;
    language?: string;
  }): void;

  function loadedLibraries(): string[];
}

interface Window {
  mapkit?: typeof mapkit;
  initMapKit?: () => void;
}
