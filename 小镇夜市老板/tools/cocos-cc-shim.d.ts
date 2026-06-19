declare module 'cc' {
  export class Component {}

  export class JsonAsset {
    json: unknown;
  }

  type CocosPropertyDecorator = PropertyDecorator & ((options?: unknown) => PropertyDecorator);

  export const _decorator: {
    ccclass: (name?: string) => ClassDecorator;
    property: CocosPropertyDecorator;
  };

  export const director: {
    loadScene: (name: string) => void;
  };

  export const resources: {
    load: <T>(
      path: string,
      type: new (...args: unknown[]) => T,
      callback: (error: Error | null, asset: T | null) => void
    ) => void;
  };

  export const sys: {
    localStorage: {
      getItem: (key: string) => string | null;
      setItem: (key: string, value: string) => void;
      removeItem: (key: string) => void;
    };
  };
}
