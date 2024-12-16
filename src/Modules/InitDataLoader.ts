// src/scripts/InitDataLoader.js
import ElectronStore from "electron-store";
import fs from "fs";
import path from "path";
import {
  PresetType,
  OmikenType,
  RulesType,
  CharaType,
  StoreType,
  GameType,
  TypesType,
  ScriptsParamType,
} from "../types/index";
import { postErrorMessage } from "./PostOmikuji";
import { configs } from "../config";

export class InitDataLoader {
  private store: ElectronStore<StoreType>;

  constructor(store: ElectronStore<StoreType>) {
    this.store = store;
  }

  // Omiken/presetデータ読み込み
  loadPluginData() {
    const OmikenPath = "Omiken/index.json"; // おみくじデータ
    const presetPath = "preset/index.json"; // presetデータ

    try {
      // Omikenデータを読み込み
      const Omiken = this.loadJson<OmikenType>(OmikenPath);
      if (!Omiken) {
        throw new Error(`Omikenデータの読み込みに失敗: ${OmikenPath}`);
      }

      // Omiken/Charasのプリセットデータを読み込み
      const { PresetsMoto, CharasMoto } = this.loadPresets(presetPath);
      const Charas: Record<string, CharaType> =
        this.loadCharasData<CharaType>(CharasMoto);
      const Presets: Record<string, OmikenType> =
        this.loadCharasData<OmikenType>(PresetsMoto);

      const Scripts = this.initializeScripts();

      // typesを参照しrulesを配列にする
      const OmikenTypesArray = filterTypes(Omiken.types, Omiken.rules);

      return {
        Omiken,
        OmikenTypesArray,
        Presets,
        Charas,
        Scripts,
        Visits: (this.store as any).get("Visits", {}),
        Games: (this.store as any).get("Games", {}),
        TimeConfig: (this.store as any).get("TimeConfig", {}),
      };
    } catch (error) {
      console.error("プラグインデータの読み込み中にエラーが発生", error);
      postErrorMessage(error); // エラーメッセージをわんコメへ投稿
      throw error;
    }
  }

  // dataからJSONファイルを読む
  private loadJson<T>(filePath: string): T | null {
    try {
      const fullPath = path.join(configs.dataRoot, filePath);
      // ファイルの存在確認
      if (!fs.existsSync(fullPath)) {
        console.error(`ファイルが見つかりません: ${fullPath}`);
        return null;
      }

      const fileContent = fs.readFileSync(fullPath, "utf-8");
      return JSON.parse(fileContent) as T;
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error(`JSONパースエラー: ${filePath}`, error.message);
      } else if (error instanceof Error) {
        console.error(`ファイル読み込みエラー: ${filePath}`, error.message);
      }
      return null;
    }
  }

  // preset/index.json を読み込み
  private loadPresets(presetPath: string): {
    PresetsMoto: PresetType[];
    CharasMoto: PresetType[];
    Scripts: PresetType[];
  } {
    const presets = this.loadJson<PresetType[]>(presetPath) || [];

    if (!presets || presets.length === 0) {
      console.warn(`プリセットデータが見つかりません: ${presetPath}`);
      return { PresetsMoto: [], CharasMoto: [], Scripts: [] };
    }

    return presets.reduce(
      (acc, item) => {
        if (item.type === "Omiken") {
          acc.PresetsMoto.push(item);
        } else if (item.type === "Chara") {
          acc.CharasMoto.push(item);
        } else if (item.type === "Script") {
          acc.Scripts.push(item);
        }
        return acc;
      },
      { PresetsMoto: [], CharasMoto: [], Scripts: [] }
    );
  }

  // presetのpathを読んでデータを返す
  private loadCharasData<T>(items: PresetType[]): Record<string, T> {
    const dataMap: Record<string, T> = {};

    items.forEach((item) => {
      if (!item.path) {
        console.warn(`キャラクターのパスが不明: ${item.id}`);
        return;
      }

      const data = this.loadJson<T>(`preset/${item.path}`);
      if (data) dataMap[item.id] = data;
    });

    return dataMap;
  }

  // Scriptsにある関数を読み込み
  private initializeScripts() {
    const Scripts: Record<string, ScriptsParamType> = {};
    const ScriptsDir = configs.ScriptsRoot; // ./Scripts フォルダのパス

    try {
      // ディレクトリ内のファイル一覧を取得
      const files = fs.readdirSync(ScriptsDir);

      files.forEach((file) => {
        // .js ファイルのみ対象
        if (file.endsWith(".js")) {
          const functionName = file.replace(/\.js$/, ""); // 拡張子を除去
          const modulePath = path.join(ScriptsDir, file);

          try {
            // モジュールを動的に読み込み
            const module = require(modulePath);

            // モジュール内の関数が存在するか確認
            if (typeof module[functionName] === "function") {
              Scripts[functionName] = module[functionName];
            } else {
              console.warn(
                `No valid function "${functionName}" found in file: ${file}`
              );
            }
          } catch (err) {
            console.error(`Failed to load module: ${modulePath}`, err);
          }
        }
      });
    } catch (err) {
      console.error(`Failed to read directory: ${ScriptsDir}`, err);
    }

    return Scripts;
  }

  // Gamesのすべてのdrawsを初期化する
  initializeGames() {
    const Games = (this.store as any).get("Games", {}) as Record<
      string,
      GameType
    >;
    const GamesNew = Object.fromEntries(
      Object.entries(Games).map(([key, game]) => [key, { ...game, draws: 0 }])
    );

    (this.store as any).set("Games", GamesNew);
    return GamesNew;
  }

  // TimeConfig の初期化
  initializeTimeConfig() {
    const timeConfig = {
      pluginTime: Date.now(),
      lc: 0,
      lastTime: 0,
      lastUserId: "",
    };
    (this.store as any).set("TimeConfig", timeConfig);
    return timeConfig;
  }
}

// rulesを配列にする
export function filterTypes(
  types: Record<TypesType, string[]>,
  rules: Record<string, RulesType>
) {
  return Object.keys(types).reduce((result, typeKey) => {
    result[typeKey] = types[typeKey]
      .map((id: string) => rules[id])
      .filter((rule) => rule !== undefined);
    return result;
  }, {} as Record<TypesType, RulesType[]>);
}

