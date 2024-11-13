// onesdk.d.ts
declare module 'onesdk' {
  export interface OneSDKConfig {
    protocol?: string;
    port?: number;
    host?: string;
    pathname?: string;
    mode?: string;
    [key: string]: any;  // その他のオプションプロパティも許可
  }

  export interface Comment {
    id: string;
    service: string;
    comment: string;
    colors?: {
      bodyBackgroundColor: string;
      bodyTextColor: string;
    };
    isMember?: boolean;
  }

  export interface OneSDK {
    new (config?: OneSDKConfig): OneSDK;

    // API関連のメソッド
    get(endpoint: string, config?: any): Promise<any>;
    post(endpoint: string, data: any, config?: any): Promise<any>;
    put(endpoint: string, data: any, config?: any): Promise<any>;
    delete(endpoint: string, config?: any): Promise<any>;

    // コメント関連のメソッド
    getComments(): Promise<Comment[]>;
    searchComments(params: any): Promise<Comment[]>;

    // その他のメソッド
    connect(): Promise<void>;
    ready(): Promise<void>;
    setup(config?: OneSDKConfig): Promise<void>;
  }

  const sdk: OneSDK;
  export default sdk;
}
