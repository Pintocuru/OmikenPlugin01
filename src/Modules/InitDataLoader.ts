// src/scripts/InitDataLoader.js
import ElectronStore from "electron-store";
import fs from "fs"; // 同期的なfsに戻す
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

const OmikenPath = "Omiken/index.json"; // おみくじデータ
const presetPath = "preset/index.json"; // presetデータ

export class InitDataLoader {
  private store: ElectronStore<StoreType>;
  private Games: Record<string, GameType>;

  constructor(store: ElectronStore<StoreType>) {
    this.store = store;
  }

  // Omiken/presetデータ読み込み
  loadPluginData() {
    try {
      const Omiken = this.loadJson<OmikenType>(OmikenPath);
      //const { PresetsMoto, CharasMoto } = this.loadPresets(presetPath);

      // 
      const Presets = this.fileReadObject(
        path.join(configs.dataRoot, "Presets"),
        "json"
      );
      const Charas = this.fileReadObject(
        path.join(configs.dataRoot, "Charas"),
        "json"
      );
      const Scripts = this.fileReadObject(configs.ScriptsRoot, "js");
      console.warn("testtest", Scripts);

      return {
        Omiken,
        OmikenTypesArray: filterTypes(Omiken.types, Omiken.rules),
        Presets,
        Charas,
        Scripts,
        Visits: (this.store as any).get("Visits", {}),
        Games: this.initializeGames(),
        TimeConfig: {
          pluginTime: Date.now(),
          lc: 0,
          lastTime: 0,
          lastUserId: "",
        },
      };
    } catch (error) {
      this.errorMethod("プラグインデータの読み込み中にエラーが発生", error);
      throw error;
    }
  }

  // JSONファイルを読む
  private loadJson<T>(filePath: string): T | null {
    try {
      const fullPath = path.join(configs.dataRoot, filePath);

      // ファイルの存在確認
      if (!fs.existsSync(fullPath)) {
        this.errorMethod(`ファイルが見つかりません: ${fullPath}`);
        return null;
      }

      const fileContent = fs.readFileSync(fullPath, "utf-8");
      const parsedData = JSON.parse(fileContent) as T;

      // データのundefinedチェック
      if (!parsedData) {
        this.errorMethod(`無効なデータ: ${filePath}`);
        return null;
      }

      return parsedData;
    } catch (error) {
      this.errorMethod(`ファイル読み込みエラー: ${filePath}`, error);
      return null;
    }
  }

  // Scriptsにある関数を読み込み
  private fileReadObject(
    dir: string,
    extension: "json" | "js"
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    try {
      // ディレクトリ内のファイル一覧を取得
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        // 指定された拡張子のみ対象
        if (file.endsWith(`.${extension}`)) {
          const key = file.replace(new RegExp(`\\.${extension}$`), "");
          const filePath = path.join(dir, file);
          try {
            if (extension === "json") {
              // JSONファイルを読み込み
              const fileContent = fs.readFileSync(filePath, "utf-8");
              result[key] = JSON.parse(fileContent);
            } else if (extension === "js") {
              // JSファイルをrequireで読み込み
              const module = require(filePath);
              result[key] = module[key];
            } else {
              // サポートされていない拡張子
              this.errorMethod(`ファイルを読み込めません.${extension}`);
            }
          } catch (err) {
            this.errorMethod(`ファイルの読み込みに失敗: ${filePath}`, err);
          }
        }
      });
    } catch (err) {
      this.errorMethod(`ディレクトリの読み取りに失敗: ${dir}`, err);
    }
    return result;
  }

  // Gamesのすべてのdrawsを初期化する
  private initializeGames(): Record<string, GameType> {
    const Games = (this.store as any).get("Games", {}) as Record<
      string,
      GameType
    >;
    return Object.fromEntries(
      Object.entries(Games).map(([key, game]) => [key, { ...game, draws: 0 }])
    );
  }

  // エラー用メゾット(コンソールログとわんコメへの投稿)
  private errorMethod(message: string, error?: unknown): void {
    console.error(message, error);
    postErrorMessage(message);
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
